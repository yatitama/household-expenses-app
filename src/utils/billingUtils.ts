import { addMonths, addDays, setDate, lastDayOfMonth, format, isBefore, startOfDay } from 'date-fns';
import type { PaymentMethod, Transaction, RecurringPayment } from '../types';
import { paymentMethodService, transactionService, accountService, recurringPaymentService } from '../services/storage';

/**
 * 取引日と支払い手段の設定から引き落とし日を計算する
 */
export const calculatePaymentDate = (
  transactionDate: string,
  pm: PaymentMethod
): Date | null => {
  if (pm.billingType === 'immediate') return null;
  if (!pm.closingDay || !pm.paymentDay || pm.paymentMonthOffset === undefined) return null;

  // 日付をローカルタイムゾーンで明示的に作成（タイムゾーンのずれを防ぐ）
  const [year, month, day] = transactionDate.split('-').map(Number);
  const txDate = new Date(year, month - 1, day);
  const txDay = txDate.getDate();

  // 締め月を決定（月末締め対応：締め日がその月の最終日以上なら月末締めとして扱う）
  const lastDayOfTxMonth = lastDayOfMonth(txDate).getDate();
  const effectiveClosingDay = Math.min(pm.closingDay, lastDayOfTxMonth);
  let closingMonth: Date;
  if (txDay <= effectiveClosingDay) {
    closingMonth = new Date(txDate.getFullYear(), txDate.getMonth(), 1);
  } else {
    closingMonth = addMonths(new Date(txDate.getFullYear(), txDate.getMonth(), 1), 1);
  }

  // 引き落とし月 = 締め月 + offset
  const paymentMonth = addMonths(closingMonth, pm.paymentMonthOffset);

  // 引き落とし日（月末を超えないように調整）
  const lastDay = lastDayOfMonth(paymentMonth).getDate();
  const actualPaymentDay = Math.min(pm.paymentDay, lastDay);

  return startOfDay(setDate(paymentMonth, actualPaymentDay));
};

/**
 * 未精算のカード取引を取得
 */
export const getUnsettledTransactions = (paymentMethodId?: string): Transaction[] => {
  const all = transactionService.getAll();
  return all.filter((t) => {
    if (!t.paymentMethodId) return false;
    if (t.settledAt) return false;
    if (paymentMethodId && t.paymentMethodId !== paymentMethodId) return false;
    return true;
  });
};

/**
 * 口座ごとの未精算額を計算
 * returns: { [accountId]: pendingAmount }
 */
export const getPendingAmountByAccount = (): Record<string, number> => {
  const unsettled = getUnsettledTransactions();
  const paymentMethods = paymentMethodService.getAll();
  const result: Record<string, number> = {};

  for (const t of unsettled) {
    const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
    if (!pm || !pm.linkedAccountId) continue;

    const accountId = pm.linkedAccountId;
    if (!result[accountId]) result[accountId] = 0;

    if (t.type === 'expense') {
      result[accountId] += t.amount;
    } else {
      result[accountId] -= t.amount;
    }
  }

  return result;
};

/**
 * 支払い手段ごとの未精算額を計算
 */
export const getPendingAmountByPaymentMethod = (): Record<string, number> => {
  const unsettled = getUnsettledTransactions();
  const result: Record<string, number> = {};

  for (const t of unsettled) {
    if (!t.paymentMethodId) continue;
    if (!result[t.paymentMethodId]) result[t.paymentMethodId] = 0;

    if (t.type === 'expense') {
      result[t.paymentMethodId] += t.amount;
    } else {
      result[t.paymentMethodId] -= t.amount;
    }
  }

  return result;
};

/**
 * 引き落とし日を過ぎた未精算取引を自動精算する
 */
export const settleOverdueTransactions = (): void => {
  const unsettled = getUnsettledTransactions();
  const paymentMethods = paymentMethodService.getAll();
  const today = startOfDay(new Date());

  // 口座ごとの精算額を集計
  const settlementByAccount: Record<string, number> = {};

  for (const t of unsettled) {
    const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
    if (!pm || !pm.linkedAccountId) continue;

    if (pm.billingType === 'immediate') {
      // 即時精算: 未精算のものがあれば即精算
      const settleAmount = t.type === 'expense' ? t.amount : -t.amount;
      settlementByAccount[pm.linkedAccountId] = (settlementByAccount[pm.linkedAccountId] || 0) + settleAmount;
      transactionService.update(t.id, { settledAt: format(today, 'yyyy-MM-dd') });
      continue;
    }

    // 月次精算: 引き落とし日を過ぎたか確認
    const paymentDate = calculatePaymentDate(t.date, pm);
    if (!paymentDate) continue;

    // 引き落とし日が今日以前の場合に精算する
    if (!isBefore(today, paymentDate)) {
      const settleAmount = t.type === 'expense' ? t.amount : -t.amount;
      settlementByAccount[pm.linkedAccountId] = (settlementByAccount[pm.linkedAccountId] || 0) + settleAmount;
      transactionService.update(t.id, { settledAt: format(today, 'yyyy-MM-dd') });
    }
  }

  // 口座残高を更新
  for (const [accountId, amount] of Object.entries(settlementByAccount)) {
    const account = accountService.getById(accountId);
    if (account) {
      accountService.update(accountId, { balance: account.balance - amount });
    }
  }
};

/**
 * 支払い月と支払い手段の設定から引き落とし日（実際の日付）を取得
 */
export const getActualPaymentDate = (paymentMonthStr: string, pm: PaymentMethod): Date | null => {
  if (pm.billingType !== 'monthly' || !pm.paymentDay) return null;
  const [y, m] = paymentMonthStr.split('-').map(Number);
  const paymentMonthDate = new Date(y, m - 1, 1);
  const lastDay = lastDayOfMonth(paymentMonthDate).getDate();
  const actualPaymentDay = Math.min(pm.paymentDay, lastDay);
  return startOfDay(new Date(y, m - 1, actualPaymentDay));
};

/**
 * 支払い月と支払い手段の設定から利用期間（締め期間）を計算
 */
export const getBillingPeriod = (
  paymentMonthStr: string,
  pm: PaymentMethod
): { start: Date; end: Date } | null => {
  if (pm.billingType !== 'monthly' || !pm.closingDay || pm.paymentMonthOffset === undefined) return null;

  const [y, m] = paymentMonthStr.split('-').map(Number);
  // 締め月 = 支払い月 - offset
  const closingMonthDate = addMonths(new Date(y, m - 1, 1), -pm.paymentMonthOffset);
  const closingYear = closingMonthDate.getFullYear();
  const closingMonthNum = closingMonthDate.getMonth();

  // 締め期間終了 = 締め月のclosingDay（月末調整あり）
  const lastDayOfClosing = lastDayOfMonth(closingMonthDate).getDate();
  const effectiveClosingDay = Math.min(pm.closingDay, lastDayOfClosing);
  const billingEnd = startOfDay(new Date(closingYear, closingMonthNum, effectiveClosingDay));

  // 締め期間開始 = 前の締め月のclosingDay + 1日
  const prevClosingMonthDate = addMonths(closingMonthDate, -1);
  const lastDayOfPrevClosing = lastDayOfMonth(prevClosingMonthDate).getDate();
  const effectivePrevClosingDay = Math.min(pm.closingDay, lastDayOfPrevClosing);
  const prevBillingEnd = startOfDay(
    new Date(prevClosingMonthDate.getFullYear(), prevClosingMonthDate.getMonth(), effectivePrevClosingDay)
  );
  const billingStart = addDays(prevBillingEnd, 1);

  return { start: billingStart, end: billingEnd };
};

/**
 * 定期支払い・収入の次回発生日を計算する
 * startDate（未設定時は createdAt の日付部分）を基準日として periodValue ヶ月 or 日ごとの次回発生日を返す
 * endDate が設定されている場合、その日を過ぎた発生日は null を返す
 */
export const calculateNextRecurringDate = (
  recurring: RecurringPayment,
  fromDate: Date = new Date()
): Date | null => {
  if (!recurring.isActive) return null;

  const from = startOfDay(fromDate);
  const refDateStr = recurring.startDate || recurring.createdAt.split('T')[0];
  const [sy, sm, sd] = refDateStr.split('-').map(Number);
  const startDate = startOfDay(new Date(sy, sm - 1, sd));

  // endDate が設定されている場合、その日を過ぎていれば null
  const endDate = recurring.endDate
    ? startOfDay(new Date(recurring.endDate.split('-').map(Number)[0], recurring.endDate.split('-').map(Number)[1] - 1, recurring.endDate.split('-').map(Number)[2]))
    : null;

  const fromStr = format(from, 'yyyy-MM-dd');

  let candidate: Date;

  if (recurring.periodType === 'months') {
    if (isBefore(from, startDate)) {
      candidate = startDate;
    } else {
      const monthsDiff = (from.getFullYear() - startDate.getFullYear()) * 12
        + (from.getMonth() - startDate.getMonth());
      const cyclesPassed = Math.floor(monthsDiff / recurring.periodValue);
      candidate = addMonths(startDate, cyclesPassed * recurring.periodValue);
      if (isBefore(candidate, from) || format(candidate, 'yyyy-MM-dd') === fromStr) {
        candidate = addMonths(startDate, (cyclesPassed + 1) * recurring.periodValue);
      }
    }
  } else if (recurring.periodType === 'days') {
    if (isBefore(from, startDate)) {
      candidate = startDate;
    } else {
      const daysDiff = Math.floor((from.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const cyclesPassed = Math.floor(daysDiff / recurring.periodValue);
      candidate = addDays(startDate, cyclesPassed * recurring.periodValue);
      if (isBefore(candidate, from) || format(candidate, 'yyyy-MM-dd') === fromStr) {
        candidate = addDays(startDate, (cyclesPassed + 1) * recurring.periodValue);
      }
    }
  } else {
    return null;
  }

  // endDate を超えている場合は null
  if (endDate && isBefore(endDate, candidate)) return null;

  return startOfDay(candidate);
};

/**
 * 定期支払いの次回発生日を計算
 */
export const calculateRecurringNextDate = (
  recurring: RecurringPayment,
  fromDate: Date = new Date()
): Date | null => {
  return calculateNextRecurringDate(recurring, fromDate);
};

/**
 * 指定日数以内に発生する定期支払い・収入を取得
 */
export const getUpcomingRecurringPayments = (days: number = 31): RecurringPayment[] => {
  const all = recurringPaymentService.getAll();
  const today = startOfDay(new Date());
  const limitDate = addDays(today, days);

  return all.filter((rp) => {
    if (!rp.isActive) return false;
    const nextDate = calculateRecurringNextDate(rp, today);
    if (!nextDate) return false;
    return !isBefore(limitDate, nextDate);
  });
};

/**
 * 指定年月に発生する定期支払い・収入を取得
 */
export const getRecurringPaymentsForMonth = (year: number, month: number): RecurringPayment[] => {
  const all = recurringPaymentService.getAll();
  // 対象月の前日から計算することで、対象月内の発生日を取得する
  const prevDay = new Date(year, month - 1, 0); // 前月末日

  return all.filter((rp) => {
    if (!rp.isActive) return false;
    const nextDate = calculateRecurringNextDate(rp, prevDay);
    if (!nextDate) return false;
    return nextDate.getFullYear() === year && nextDate.getMonth() + 1 === month;
  });
};

/**
 * 定期支払い・収入の合計を計算
 * returns: { expense: number, income: number }
 */
export const getPendingRecurringSummary = (days: number = 31): { expense: number; income: number } => {
  const upcoming = getUpcomingRecurringPayments(days);
  return upcoming.reduce(
    (acc, rp) => {
      if (rp.type === 'expense') {
        acc.expense += rp.amount;
      } else {
        acc.income += rp.amount;
      }
      return acc;
    },
    { expense: 0, income: 0 }
  );
};
