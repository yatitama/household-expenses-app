import { useMemo, useState } from 'react';
import { CalendarClock, CreditCard, RefreshCw, Landmark } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import {
  calculatePaymentDate,
  calculateNextRecurringDate,
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

interface RecurringDateGroup {
  key: string; // 'yyyy-MM-dd' or 'no-date'
  date: Date | null;
  items: RecurringItem[];
  total: number;
}

interface CardMonthEntry {
  pm: PaymentMethod;
  transactions: Transaction[];
  transactionTotal: number;
  recurringItems: RecurringItem[];
  recurringTotal: number;
  total: number;
  billingStart: Date | null;
  billingEnd: Date | null;
}

interface CardMonthGroup {
  month: string; // yyyy-MM（引き落とし月）
  paymentDate: Date | null;
  cards: CardMonthEntry[];
  monthTotal: number;
}

interface AccountScheduleGroup {
  accountId: string;
  accountName: string;
  accountColor: string;
  cardMonthGroups: CardMonthGroup[];
  recurringDateGroups: RecurringDateGroup[];
  recurringTotal: number;
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

  // monthlyカードごとの定期支出（今月分）
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

  // 口座ごとの引き落とし予定グループ（カード月次 + 直結定期支出）
  const accountScheduleGroups = useMemo((): AccountScheduleGroup[] => {
    const accounts = accountService.getAll();
    const unsettled = getUnsettledTransactions();
    const result: AccountScheduleGroup[] = [];

    for (const account of accounts) {
      // この口座に紐づくmonthlyカード
      const linkedMonthlyCards = paymentMethods.filter(
        (pm) => pm.linkedAccountId === account.id && pm.billingType === 'monthly'
      );

      // 引き落とし月 × カードのマップ
      const monthMap: Record<
        string,
        {
          paymentDate: Date | null;
          cardMap: Record<
            string,
            {
              pm: PaymentMethod;
              transactions: Transaction[];
              transactionTotal: number;
              recurringItems: RecurringItem[];
              recurringTotal: number;
              billingStart: Date | null;
              billingEnd: Date | null;
            }
          >;
        }
      > = {};

      // 未精算取引を追加
      for (const t of unsettled) {
        const pm = linkedMonthlyCards.find((p) => p.id === t.paymentMethodId);
        if (!pm) continue;
        const paymentDate = calculatePaymentDate(t.date, pm);
        if (!paymentDate) continue;
        const paymentMonth = format(paymentDate, 'yyyy-MM');

        if (!monthMap[paymentMonth]) {
          monthMap[paymentMonth] = {
            paymentDate: getActualPaymentDate(paymentMonth, pm),
            cardMap: {},
          };
        }
        if (!monthMap[paymentMonth].cardMap[pm.id]) {
          const billingPeriod = getBillingPeriod(paymentMonth, pm);
          monthMap[paymentMonth].cardMap[pm.id] = {
            pm,
            transactions: [],
            transactionTotal: 0,
            recurringItems: [],
            recurringTotal: 0,
            billingStart: billingPeriod?.start ?? null,
            billingEnd: billingPeriod?.end ?? null,
          };
        }
        monthMap[paymentMonth].cardMap[pm.id].transactions.push(t);
        monthMap[paymentMonth].cardMap[pm.id].transactionTotal +=
          t.type === 'expense' ? t.amount : -t.amount;
      }

      // 今月のカード紐づき定期支出を追加
      for (const pm of linkedMonthlyCards) {
        const items = cardRecurringMap[pm.id];
        if (!items || items.length === 0) continue;
        if (pm.paymentMonthOffset === undefined) continue;

        const paymentMonth = format(
          addMonths(new Date(thisYear, thisMonth - 1, 1), pm.paymentMonthOffset),
          'yyyy-MM'
        );

        if (!monthMap[paymentMonth]) {
          monthMap[paymentMonth] = {
            paymentDate: getActualPaymentDate(paymentMonth, pm),
            cardMap: {},
          };
        }
        if (!monthMap[paymentMonth].cardMap[pm.id]) {
          const billingPeriod = getBillingPeriod(paymentMonth, pm);
          monthMap[paymentMonth].cardMap[pm.id] = {
            pm,
            transactions: [],
            transactionTotal: 0,
            recurringItems: [],
            recurringTotal: 0,
            billingStart: billingPeriod?.start ?? null,
            billingEnd: billingPeriod?.end ?? null,
          };
        }
        for (const item of items) {
          monthMap[paymentMonth].cardMap[pm.id].recurringItems.push(item);
          monthMap[paymentMonth].cardMap[pm.id].recurringTotal += item.amount;
        }
      }

      // カード月グループをソートして配列化
      const cardMonthGroups: CardMonthGroup[] = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => {
          const cards: CardMonthEntry[] = Object.values(data.cardMap).map((c) => ({
            ...c,
            total: c.transactionTotal + c.recurringTotal,
          }));
          const monthTotal = cards.reduce((sum, c) => sum + c.total, 0);
          return { month, paymentDate: data.paymentDate, cards, monthTotal };
        });

      // 口座直結の定期支出（monthlyカード経由でないもの）
      // 前月末日を基準に calculateNextRecurringDate で当月の発生日を求め、日付ごとにグループ化
      const prevMonthLastDay = new Date(thisYear, thisMonth - 1, 0);
      const recurringWithDates: Array<{ rp: RecurringPayment; amount: number; paymentDate: Date | null }> = [];
      for (const rp of thisMonthRecurring) {
        if (rp.accountId !== account.id) continue;
        if (rp.paymentMethodId) {
          const pm = paymentMethods.find((p) => p.id === rp.paymentMethodId);
          if (pm && pm.billingType === 'monthly') continue;
        }
        const amount = getEffectiveRecurringAmount(rp, thisMonthStr);
        const paymentDate = calculateNextRecurringDate(rp, prevMonthLastDay);
        recurringWithDates.push({ rp, amount, paymentDate });
      }
      // 発生日順にソート（日付なしは末尾）
      recurringWithDates.sort((a, b) => {
        if (!a.paymentDate && !b.paymentDate) return 0;
        if (!a.paymentDate) return 1;
        if (!b.paymentDate) return -1;
        return a.paymentDate.getTime() - b.paymentDate.getTime();
      });
      // 同じ発生日をグループ化
      const recurringDateGroupMap: Record<string, RecurringDateGroup> = {};
      for (const { rp, amount, paymentDate } of recurringWithDates) {
        const key = paymentDate ? format(paymentDate, 'yyyy-MM-dd') : 'no-date';
        if (!recurringDateGroupMap[key]) {
          recurringDateGroupMap[key] = { key, date: paymentDate, items: [], total: 0 };
        }
        recurringDateGroupMap[key].items.push({ rp, amount });
        recurringDateGroupMap[key].total += amount;
      }
      const recurringDateGroups = Object.values(recurringDateGroupMap);
      const recurringTotal = recurringDateGroups.reduce((sum, g) => sum + g.total, 0);

      const cardTotal = cardMonthGroups.reduce((sum, g) => sum + g.monthTotal, 0);
      const total = cardTotal + recurringTotal;

      if (cardMonthGroups.length === 0 && recurringDateGroups.length === 0) continue;

      result.push({
        accountId: account.id,
        accountName: account.name,
        accountColor: account.color,
        cardMonthGroups,
        recurringDateGroups,
        recurringTotal,
        total,
      });
    }

    return result;
  }, [paymentMethods, cardRecurringMap, thisMonthRecurring, thisYear, thisMonth, thisMonthStr]);

  const grandTotal = useMemo(
    () => accountScheduleGroups.reduce((sum, g) => sum + g.total, 0),
    [accountScheduleGroups]
  );

  if (accountScheduleGroups.length === 0) return null;

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

      <div className="pt-2 pb-3 md:pb-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accountScheduleGroups.map((group) => (
              <div
                key={group.accountId}
                className="border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 flex flex-col gap-2 relative overflow-hidden"
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

                {/* カード引き落とし（月毎） */}
                {group.cardMonthGroups.map((monthGroup) => (
                  <div key={monthGroup.month} className="relative z-10">
                    {/* 引き落とし月ヘッダー */}
                    {monthGroup.paymentDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-1">
                        {format(monthGroup.paymentDate, 'M月d日')}引き落とし
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {monthGroup.cards.map((cardEntry) => (
                        <button
                          key={cardEntry.pm.id}
                          onClick={() =>
                            setUnsettledCardModal({
                              pm: cardEntry.pm,
                              paymentMonth: monthGroup.month,
                              transactions: cardEntry.transactions,
                              recurringItems: cardEntry.recurringItems,
                              total: cardEntry.total,
                            })
                          }
                          className="w-full flex items-center justify-between text-xs px-1 py-1 hover:bg-gray-50 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          <span className="flex items-center gap-1 min-w-0">
                            <CreditCard
                              size={10}
                              className="flex-shrink-0"
                              style={{ color: cardEntry.pm.color }}
                            />
                            <span className="text-gray-700 dark:text-gray-300 truncate">
                              {cardEntry.pm.name}
                            </span>
                            {cardEntry.recurringItems.length > 0 && (
                              <RefreshCw size={9} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                            )}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium ml-2 flex-shrink-0">
                            {formatCurrency(cardEntry.total)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 定期支出（口座直結）- カードと同じフォーマットで日付グループ表示 */}
                {group.recurringDateGroups.map((dateGroup) => (
                  <div key={dateGroup.key} className="relative z-10">
                    {dateGroup.date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-1">
                        {format(dateGroup.date, 'M月d日')}引き落とし
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {dateGroup.items.map(({ rp, amount }) => (
                        <div
                          key={rp.id}
                          className="w-full flex items-center justify-between text-xs px-1 py-1"
                        >
                          <span className="flex items-center gap-1 min-w-0">
                            <RefreshCw size={10} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300 truncate">{rp.name}</span>
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium ml-2 flex-shrink-0">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 合計 */}
                <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100 mt-auto">
                  {formatCurrency(group.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
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
