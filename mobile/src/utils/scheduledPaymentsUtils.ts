import { format, addMonths } from 'date-fns';
import {
  calculatePaymentDate,
  calculateNextRecurringDate,
  getUnsettledTransactions,
  getRecurringPaymentsForMonth,
  getActualPaymentDate,
  getBillingPeriod,
} from './billingUtils';
import { getEffectiveRecurringAmount } from './savingsUtils';
import type { Account, PaymentMethod, RecurringPayment, Transaction } from '../types';

export interface RecurringItem {
  rp: RecurringPayment;
  amount: number;
}

export interface RecurringDateGroup {
  key: string; // 'yyyy-MM-dd' or 'no-date'
  date: Date | null;
  items: RecurringItem[];
  total: number;
}

export interface CardMonthEntry {
  pm: PaymentMethod;
  transactions: Transaction[];
  transactionTotal: number;
  recurringItems: RecurringItem[];
  recurringTotal: number;
  total: number;
  billingStart: Date | null;
  billingEnd: Date | null;
}

export interface CardMonthGroup {
  month: string; // yyyy-MM（引き落とし月）
  paymentDate: Date | null;
  cards: CardMonthEntry[];
  monthTotal: number;
}

export type ScheduleEntry =
  | { kind: 'card'; monthGroup: CardMonthGroup }
  | { kind: 'recurring'; dateGroup: RecurringDateGroup };

export interface AccountScheduleGroup {
  accountId: string;
  accountName: string;
  accountColor: string;
  entries: ScheduleEntry[];
  total: number;
}

export const getAccountScheduleGroups = (
  accounts: Account[],
  paymentMethods: PaymentMethod[],
  now: Date = new Date()
): AccountScheduleGroup[] => {
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const thisMonthStr = format(now, 'yyyy-MM');

  const thisMonthRecurring = getRecurringPaymentsForMonth(thisYear, thisMonth).filter(
    (rp) => rp.type === 'expense'
  );

  // monthlyカードごとの定期支出（今月分）
  const cardRecurringMap: Record<string, RecurringItem[]> = {};
  for (const rp of thisMonthRecurring) {
    if (!rp.paymentMethodId) continue;
    const pm = paymentMethods.find((p) => p.id === rp.paymentMethodId);
    if (!pm || pm.billingType !== 'monthly') continue;
    if (!cardRecurringMap[pm.id]) cardRecurringMap[pm.id] = [];
    cardRecurringMap[pm.id].push({ rp, amount: getEffectiveRecurringAmount(rp, thisMonthStr) });
  }

  const unsettled = getUnsettledTransactions();
  const result: AccountScheduleGroup[] = [];

  for (const account of accounts) {
    const linkedMonthlyCards = paymentMethods.filter(
      (pm) => pm.linkedAccountId === account.id && pm.billingType === 'monthly'
    );

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
    recurringWithDates.sort((a, b) => {
      if (!a.paymentDate && !b.paymentDate) return 0;
      if (!a.paymentDate) return 1;
      if (!b.paymentDate) return -1;
      return a.paymentDate.getTime() - b.paymentDate.getTime();
    });

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

    const entries: ScheduleEntry[] = [
      ...cardMonthGroups.map((mg): ScheduleEntry => ({ kind: 'card', monthGroup: mg })),
      ...recurringDateGroups.map((dg): ScheduleEntry => ({ kind: 'recurring', dateGroup: dg })),
    ];
    entries.sort((a, b) => {
      const da = a.kind === 'card' ? a.monthGroup.paymentDate : a.dateGroup.date;
      const db = b.kind === 'card' ? b.monthGroup.paymentDate : b.dateGroup.date;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });

    if (entries.length === 0) continue;

    result.push({
      accountId: account.id,
      accountName: account.name,
      accountColor: account.color,
      entries,
      total,
    });
  }

  return result;
};
