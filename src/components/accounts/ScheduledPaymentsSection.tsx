import { useMemo, useState } from 'react';
import { CalendarClock, CreditCard, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, formatMonth, formatDateFull } from '../../utils/formatters';
import {
  calculateNextRecurringDate,
  calculatePaymentDate,
  getUnsettledTransactions,
  getRecurringPaymentsForMonth,
} from '../../utils/billingUtils';
import { getEffectiveRecurringAmount } from '../../utils/savingsUtils';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { paymentMethodService, recurringPaymentService } from '../../services/storage';
import { UnsettledCardDetailModal } from './modals/UnsettledCardDetailModal';
import { IndefiniteRecurringDetailModal } from './modals/IndefiniteRecurringDetailModal';
import type { PaymentMethod, RecurringPayment, Transaction } from '../../types';

interface UnsettledGroup {
  pm: PaymentMethod;
  transactions: Transaction[];
  total: number;
}

interface MonthlyUnsettledGroups {
  month: string; // yyyy-MM
  groups: UnsettledGroup[];
  monthTotal: number;
}

export const ScheduledPaymentsSection = () => {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const thisMonthStr = format(now, 'yyyy-MM');

  const [unsettledCardModal, setUnsettledCardModal] = useState<{
    pm: PaymentMethod;
    paymentMonth: string;
    transactions: Transaction[];
    total: number;
  } | null>(null);
  const [isIndefiniteModalOpen, setIsIndefiniteModalOpen] = useState(false);

  useBodyScrollLock(!!unsettledCardModal || isIndefiniteModalOpen);

  // 1. 未精算カード取引を引き落とし月×支払い手段でグループ化
  const unsettledByMonth = useMemo((): MonthlyUnsettledGroups[] => {
    const unsettled = getUnsettledTransactions();
    const paymentMethods = paymentMethodService.getAll();

    const monthMap: Record<string, Record<string, UnsettledGroup>> = {};

    for (const t of unsettled) {
      const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
      if (!pm || pm.billingType !== 'monthly') continue;

      const paymentDate = calculatePaymentDate(t.date, pm);
      if (!paymentDate) continue;

      const paymentMonth = format(paymentDate, 'yyyy-MM');

      if (!monthMap[paymentMonth]) monthMap[paymentMonth] = {};
      if (!monthMap[paymentMonth][pm.id]) {
        monthMap[paymentMonth][pm.id] = { pm, transactions: [], total: 0 };
      }

      monthMap[paymentMonth][pm.id].transactions.push(t);
      monthMap[paymentMonth][pm.id].total +=
        t.type === 'expense' ? t.amount : -t.amount;
    }

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pmMap]) => {
        const groups = Object.values(pmMap);
        const monthTotal = groups.reduce((sum, g) => sum + g.total, 0);
        return { month, groups, monthTotal };
      });
  }, []);

  // 2. 終了日未指定の定期支出（今月分）
  const indefiniteRecurring = useMemo((): RecurringPayment[] => {
    return getRecurringPaymentsForMonth(thisYear, thisMonth).filter(
      (rp) => rp.type === 'expense' && !rp.endDate
    );
  }, [thisYear, thisMonth]);

  const indefiniteTotal = useMemo((): number => {
    return indefiniteRecurring.reduce(
      (sum, rp) => sum + getEffectiveRecurringAmount(rp, thisMonthStr),
      0
    );
  }, [indefiniteRecurring, thisMonthStr]);

  // 3. 終了日指定の定期支出（今月以降の残額合計）
  const finiteRecurringWithRemaining = useMemo((): {
    rp: RecurringPayment;
    remainingTotal: number;
  }[] => {
    const all = recurringPaymentService.getAll();
    // 前月末日を起点に今月以降の発生日を検索
    const prevDayOfCurrentMonth = new Date(thisYear, thisMonth - 1, 0);

    return all
      .filter((rp) => rp.isActive && rp.type === 'expense' && !!rp.endDate)
      .map((rp) => {
        const firstNext = calculateNextRecurringDate(rp, prevDayOfCurrentMonth);
        if (!firstNext) return null;

        // 今月以降の全発生分を合計
        let total = 0;
        let currentFrom = prevDayOfCurrentMonth;
        let iterations = 0;
        while (iterations < 1000) {
          const nd = calculateNextRecurringDate(rp, currentFrom);
          if (!nd) break;
          const month = format(nd, 'yyyy-MM');
          total += getEffectiveRecurringAmount(rp, month);
          currentFrom = nd;
          iterations++;
        }

        return { rp, remainingTotal: total };
      })
      .filter(
        (item): item is { rp: RecurringPayment; remainingTotal: number } => item !== null
      );
  }, [thisYear, thisMonth]);

  // セクション合計
  const unsettledTotal = useMemo(
    () => unsettledByMonth.reduce((sum, m) => sum + m.monthTotal, 0),
    [unsettledByMonth]
  );
  const finiteTotal = finiteRecurringWithRemaining.reduce(
    (sum, item) => sum + item.remainingTotal,
    0
  );
  const grandTotal = unsettledTotal + indefiniteTotal + finiteTotal;

  const hasContent =
    unsettledByMonth.length > 0 ||
    indefiniteRecurring.length > 0 ||
    finiteRecurringWithRemaining.length > 0;

  if (!hasContent) return null;

  return (
    <div data-section-name="引き落とし予定" className="relative">
      {/* セクションヘッダー */}
      <div
        className="sticky bg-white dark:bg-slate-900 z-20 p-2 border-b dark:border-gray-700"
        style={{ top: 'max(0px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarClock size={14} className="text-gray-900 dark:text-gray-100" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              引き落とし予定
            </h3>
          </div>
          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
            -{formatCurrency(grandTotal)}
          </p>
        </div>
      </div>

      <div className="pt-2 pb-3 md:pb-4 space-y-4">
        {/* 未精算カード引き落とし（月毎グリッド） */}
        {unsettledByMonth.map(({ month, groups }) => (
          <div key={month} className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-2">
              {formatMonth(month)} 引き落とし（未精算）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map(({ pm, transactions, total }) => (
                <button
                  key={pm.id}
                  onClick={() =>
                    setUnsettledCardModal({ pm, paymentMonth: month, transactions, total })
                  }
                  className="border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 text-left flex flex-col gap-2 hover:opacity-80 transition-all relative overflow-hidden"
                >
                  {/* 背景アイコン */}
                  <div
                    className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                    style={{ color: pm.color }}
                  >
                    <CreditCard size={80} />
                  </div>
                  {/* コンテンツ */}
                  <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-900/50 px-1 rounded">
                      {pm.name}
                    </p>
                  </div>
                  <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(total)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 定期支出（終了日未指定）今月分 */}
        {indefiniteRecurring.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-2">
              {formatMonth(thisMonthStr)} 定期支出（無期限）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => setIsIndefiniteModalOpen(true)}
                className="border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 text-left flex flex-col gap-2 hover:opacity-80 transition-all relative overflow-hidden"
              >
                {/* 背景アイコン */}
                <div className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none text-gray-500 dark:text-gray-400">
                  <RefreshCw size={80} />
                </div>
                {/* コンテンツ */}
                <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-900/50 px-1 rounded">
                    定期支出（{indefiniteRecurring.length}件）
                  </p>
                </div>
                <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(indefiniteTotal)}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* 定期支出（終了日指定）今月以降残額 */}
        {finiteRecurringWithRemaining.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-2">
              定期支出（期間指定）残額
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {finiteRecurringWithRemaining.map(({ rp, remainingTotal }) => (
                <div
                  key={rp.id}
                  className="border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 flex flex-col gap-2 relative overflow-hidden"
                >
                  {/* 背景アイコン */}
                  <div className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none text-gray-500 dark:text-gray-400">
                    <Calendar size={80} />
                  </div>
                  {/* コンテンツ */}
                  <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-900/50 px-1 rounded">
                      {rp.name}
                    </p>
                  </div>
                  <div className="relative z-10">
                    <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(remainingTotal)}
                    </p>
                    {rp.endDate && (
                      <p className="text-right text-xs text-gray-500 dark:text-gray-400">
                        {formatDateFull(rp.endDate)}まで
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 未精算カード明細モーダル */}
      {unsettledCardModal && (
        <UnsettledCardDetailModal
          paymentMethod={unsettledCardModal.pm}
          paymentMonth={unsettledCardModal.paymentMonth}
          transactions={unsettledCardModal.transactions}
          total={unsettledCardModal.total}
          isOpen
          onClose={() => setUnsettledCardModal(null)}
        />
      )}

      {/* 無期限定期支出明細モーダル */}
      <IndefiniteRecurringDetailModal
        items={indefiniteRecurring}
        month={thisMonthStr}
        isOpen={isIndefiniteModalOpen}
        onClose={() => setIsIndefiniteModalOpen(false)}
      />
    </div>
  );
};
