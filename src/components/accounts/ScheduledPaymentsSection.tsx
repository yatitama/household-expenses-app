import { useMemo, useState } from 'react';
import { CalendarClock, CreditCard, RefreshCw, Landmark } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { formatCurrency, formatMonth } from '../../utils/formatters';
import {
  calculatePaymentDate,
  getUnsettledTransactions,
  getRecurringPaymentsForMonth,
  getActualPaymentDate,
  getBillingPeriod,
} from '../../utils/billingUtils';
import { getEffectiveRecurringAmount } from '../../utils/savingsUtils';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { paymentMethodService, accountService } from '../../services/storage';
import { UnsettledCardDetailModal } from './modals/UnsettledCardDetailModal';
import type { PaymentMethod, RecurringPayment, Transaction } from '../../types';

interface RecurringItem {
  rp: RecurringPayment;
  amount: number;
}

interface CardPaymentGroup {
  month: string; // yyyy-MM (引き落とし月)
  pm: PaymentMethod;
  transactions: Transaction[];
  transactionTotal: number;
  recurringItems: RecurringItem[];
  recurringTotal: number;
  total: number;
  paymentDate: Date | null;
  billingStart: Date | null;
  billingEnd: Date | null;
}

interface MonthlyCardPaymentGroups {
  month: string;
  groups: CardPaymentGroup[];
  monthTotal: number;
}

interface AccountPaymentGroup {
  accountId: string;
  accountName: string;
  accountColor: string;
  recurringItems: RecurringItem[];
  total: number;
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
    recurringItems: RecurringItem[];
    total: number;
  } | null>(null);

  useBodyScrollLock(!!unsettledCardModal);

  // 全データ取得
  const paymentMethods = useMemo(() => paymentMethodService.getAll(), []);
  const thisMonthRecurring = useMemo(
    () => getRecurringPaymentsForMonth(thisYear, thisMonth).filter((rp) => rp.type === 'expense'),
    [thisYear, thisMonth]
  );

  // カードごとの定期支出（今月分）: カードと紐づく支払い手段がmonthlyの場合
  const cardRecurringMap = useMemo((): Record<string, RecurringItem[]> => {
    const map: Record<string, RecurringItem[]> = {};
    for (const rp of thisMonthRecurring) {
      if (!rp.paymentMethodId) continue;
      const pm = paymentMethods.find((p) => p.id === rp.paymentMethodId);
      if (!pm || pm.billingType !== 'monthly') continue;
      if (!map[pm.id]) map[pm.id] = [];
      map[pm.id].push({ rp, amount: getEffectiveRecurringAmount(rp, thisMonthStr) });
    }
    return map;
  }, [thisMonthRecurring, paymentMethods, thisMonthStr]);

  // 1. 未精算カード取引 + カード紐づき定期支出 を引き落とし月×支払い手段でグループ化
  const cardPaymentGroups = useMemo((): MonthlyCardPaymentGroups[] => {
    const unsettled = getUnsettledTransactions();
    // payment month × pm id のマップ
    const monthMap: Record<string, Record<string, CardPaymentGroup>> = {};

    // 未精算取引を追加
    for (const t of unsettled) {
      const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
      if (!pm || pm.billingType !== 'monthly') continue;
      const paymentDate = calculatePaymentDate(t.date, pm);
      if (!paymentDate) continue;
      const paymentMonth = format(paymentDate, 'yyyy-MM');

      if (!monthMap[paymentMonth]) monthMap[paymentMonth] = {};
      if (!monthMap[paymentMonth][pm.id]) {
        const billingPeriod = getBillingPeriod(paymentMonth, pm);
        monthMap[paymentMonth][pm.id] = {
          month: paymentMonth,
          pm,
          transactions: [],
          transactionTotal: 0,
          recurringItems: [],
          recurringTotal: 0,
          total: 0,
          paymentDate: getActualPaymentDate(paymentMonth, pm),
          billingStart: billingPeriod?.start ?? null,
          billingEnd: billingPeriod?.end ?? null,
        };
      }
      monthMap[paymentMonth][pm.id].transactions.push(t);
      monthMap[paymentMonth][pm.id].transactionTotal += t.type === 'expense' ? t.amount : -t.amount;
    }

    // 今月分のカード紐づき定期支出を追加
    for (const [pmId, items] of Object.entries(cardRecurringMap)) {
      const pm = paymentMethods.find((p) => p.id === pmId);
      if (!pm || pm.paymentMonthOffset === undefined) continue;
      // 今月1日を起点に引き落とし月を算出
      const paymentMonth = format(
        addMonths(new Date(thisYear, thisMonth - 1, 1), pm.paymentMonthOffset),
        'yyyy-MM'
      );
      if (!monthMap[paymentMonth]) monthMap[paymentMonth] = {};
      if (!monthMap[paymentMonth][pm.id]) {
        const billingPeriod = getBillingPeriod(paymentMonth, pm);
        monthMap[paymentMonth][pm.id] = {
          month: paymentMonth,
          pm,
          transactions: [],
          transactionTotal: 0,
          recurringItems: [],
          recurringTotal: 0,
          total: 0,
          paymentDate: getActualPaymentDate(paymentMonth, pm),
          billingStart: billingPeriod?.start ?? null,
          billingEnd: billingPeriod?.end ?? null,
        };
      }
      for (const item of items) {
        monthMap[paymentMonth][pm.id].recurringItems.push(item);
        monthMap[paymentMonth][pm.id].recurringTotal += item.amount;
      }
    }

    // total を計算してソート
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pmMap]) => {
        const groups = Object.values(pmMap).map((g) => ({
          ...g,
          total: g.transactionTotal + g.recurringTotal,
        }));
        const monthTotal = groups.reduce((sum, g) => sum + g.total, 0);
        return { month, groups, monthTotal };
      });
  }, [paymentMethods, cardRecurringMap, thisYear, thisMonth]);

  // 2. 口座紐づきの定期支出（カード経由でない or 即時カード経由）を口座ごとにグループ化
  const accountPaymentGroups = useMemo((): AccountPaymentGroup[] => {
    const accounts = accountService.getAll();
    const map: Record<string, AccountPaymentGroup> = {};

    for (const rp of thisMonthRecurring) {
      // monthlyカード紐づきはカードセクションで表示済み → スキップ
      if (rp.paymentMethodId) {
        const pm = paymentMethods.find((p) => p.id === rp.paymentMethodId);
        if (pm && pm.billingType === 'monthly') continue;
      }
      // accountId がなければスキップ
      if (!rp.accountId) continue;

      const account = accounts.find((a) => a.id === rp.accountId);
      if (!account) continue;

      if (!map[account.id]) {
        map[account.id] = {
          accountId: account.id,
          accountName: account.name,
          accountColor: account.color,
          recurringItems: [],
          total: 0,
        };
      }
      const amount = getEffectiveRecurringAmount(rp, thisMonthStr);
      map[account.id].recurringItems.push({ rp, amount });
      map[account.id].total += amount;
    }

    return Object.values(map);
  }, [thisMonthRecurring, paymentMethods, thisMonthStr]);

  // グランドトータル
  const cardTotal = useMemo(
    () => cardPaymentGroups.reduce((sum, m) => sum + m.monthTotal, 0),
    [cardPaymentGroups]
  );
  const accountTotal = useMemo(
    () => accountPaymentGroups.reduce((sum, g) => sum + g.total, 0),
    [accountPaymentGroups]
  );
  const grandTotal = cardTotal + accountTotal;

  const hasContent = cardPaymentGroups.length > 0 || accountPaymentGroups.length > 0;

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
        {/* カード引き落とし（月毎グリッド） */}
        {cardPaymentGroups.map(({ month, groups }) => (
          <div key={month} className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map((group) => (
                <button
                  key={group.pm.id}
                  onClick={() =>
                    setUnsettledCardModal({
                      pm: group.pm,
                      paymentMonth: month,
                      transactions: group.transactions,
                      recurringItems: group.recurringItems,
                      total: group.total,
                    })
                  }
                  className="border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 text-left flex flex-col gap-1.5 hover:opacity-80 transition-all relative overflow-hidden"
                >
                  {/* 背景アイコン */}
                  <div
                    className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                    style={{ color: group.pm.color }}
                  >
                    <CreditCard size={80} />
                  </div>
                  {/* カード名 */}
                  <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-900/50 px-1 rounded">
                      {group.pm.name}
                    </p>
                  </div>
                  {/* 引き落とし日と利用期間 */}
                  <div className="relative z-10 flex items-end justify-between gap-1 mt-auto">
                    <div className="flex flex-col">
                      {group.paymentDate ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(group.paymentDate, 'yyyy年M月d日')} 引き落とし
                          {group.billingStart && group.billingEnd && (
                            <span> ({format(group.billingStart, 'M月d日')}〜{format(group.billingEnd, 'M月d日')} 利用分)</span>
                          )}
                        </p>
                      ) : (
                        <span />
                      )}
                    </div>
                    <p className="text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(group.total)}
                    </p>
                  </div>
                  {/* 定期支出バッジ */}
                  {group.recurringItems.length > 0 && (
                    <div className="relative z-10 flex items-center gap-1 px-1">
                      <RefreshCw size={10} className="text-gray-400 dark:text-gray-500" />
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        定期{group.recurringItems.length}件含む
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 口座ごとの定期支出（今月分） */}
        {accountPaymentGroups.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-2">
              {formatMonth(thisMonthStr)} 定期支出（口座引き落とし）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accountPaymentGroups.map((group) => (
                <div
                  key={group.accountId}
                  className="border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 flex flex-col gap-1.5 relative overflow-hidden"
                >
                  {/* 背景アイコン */}
                  <div
                    className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                    style={{ color: group.accountColor }}
                  >
                    <Landmark size={80} />
                  </div>
                  {/* 口座名 */}
                  <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-900/50 px-1 rounded">
                      {group.accountName}
                    </p>
                  </div>
                  {/* 明細 */}
                  <div className="relative z-10 space-y-0.5 px-1">
                    {group.recurringItems.map(({ rp, amount }) => (
                      <div key={rp.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 truncate flex items-center gap-1">
                          <RefreshCw size={9} className="flex-shrink-0" />
                          {rp.name}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium ml-2 flex-shrink-0">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* 合計 */}
                  <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100 mt-auto">
                    {formatCurrency(group.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* カード明細モーダル */}
      {unsettledCardModal && (
        <UnsettledCardDetailModal
          paymentMethod={unsettledCardModal.pm}
          paymentMonth={unsettledCardModal.paymentMonth}
          transactions={unsettledCardModal.transactions}
          recurringItems={unsettledCardModal.recurringItems}
          total={unsettledCardModal.total}
          isOpen
          onClose={() => setUnsettledCardModal(null)}
        />
      )}
    </div>
  );
};
