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
 * 定期支払い・収入の次回発生日を計算する
 */
export const calculateNextRecurringDate = (
  recurring: RecurringPayment,
  fromDate: Date = new Date()
): Date | null => {
  if (!recurring.isActive) return null;

  const today = startOfDay(fromDate);
  const { frequency, dayOfMonth, monthOfYear } = recurring;

  if (frequency === 'monthly') {
    // 月次: 今月または来月のdayOfMonth日
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfThisMonth = lastDayOfMonth(thisMonth).getDate();
    const actualDay = Math.min(dayOfMonth, lastDayOfThisMonth);

    let nextDate = new Date(today.getFullYear(), today.getMonth(), actualDay);
    const nextDateStr = format(nextDate, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');

    if (isBefore(nextDate, today) || nextDateStr === todayStr) {
      // 今日以前なら来月
      nextDate = addMonths(thisMonth, 1);
      const lastDayOfNextMonth = lastDayOfMonth(nextDate).getDate();
      const actualDayNext = Math.min(dayOfMonth, lastDayOfNextMonth);
      nextDate = setDate(nextDate, actualDayNext);
    }

    return startOfDay(nextDate);
  }

  if (frequency === 'yearly' && monthOfYear) {
    // 年次: 今年または来年のmonthOfYear月dayOfMonth日
    const thisYearMonth = new Date(today.getFullYear(), monthOfYear - 1, 1);
    const lastDayOfTargetMonth = lastDayOfMonth(thisYearMonth).getDate();
    const actualDay = Math.min(dayOfMonth, lastDayOfTargetMonth);

    let nextDate = new Date(today.getFullYear(), monthOfYear - 1, actualDay);
    const nextDateStr = format(nextDate, 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');

    if (isBefore(nextDate, today) || nextDateStr === todayStr) {
      // 今日以前なら来年
      const nextYearMonth = new Date(today.getFullYear() + 1, monthOfYear - 1, 1);
      const lastDayOfNextYearMonth = lastDayOfMonth(nextYearMonth).getDate();
      const actualDayNext = Math.min(dayOfMonth, lastDayOfNextYearMonth);
      nextDate = new Date(today.getFullYear() + 1, monthOfYear - 1, actualDayNext);
    }

    return startOfDay(nextDate);
  }

  return null;
};

/**
 * 定期支払いの次回発生日を計算（カード紐付けの場合はカード引き落とし日を使用）
 */
export const calculateRecurringNextDate = (
  recurring: RecurringPayment,
  fromDate: Date = new Date()
): Date | null => {
  if (!recurring.isActive) return null;

  // カード紐付けの場合は引き落とし日を使用
  if (recurring.paymentMethodId) {
    const pm = paymentMethodService.getById(recurring.paymentMethodId);
    if (pm) {
      const today = startOfDay(fromDate);
      const { frequency, monthOfYear } = recurring;

      if (frequency === 'monthly') {
        // 月次の場合、翌月の引き落とし日を計算
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // ダミー日付でカード引き落とし日を計算
        const dummyDate = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
        const paymentDate = calculatePaymentDate(dummyDate, pm);
        if (!paymentDate) return null;

        const paymentDay = paymentDate.getDate();

        // 今月の引き落とし日
        let nextDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
        const nextDateStr = format(nextDate, 'yyyy-MM-dd');
        const todayStr = format(today, 'yyyy-MM-dd');

        if (isBefore(nextDate, today) || nextDateStr === todayStr) {
          // 今日以前なら来月の引き落とし日
          const nextMonth = addMonths(thisMonth, 1);
          nextDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), paymentDay);
        }

        return startOfDay(nextDate);
      }

      // 年次の場合も同様に計算
      if (frequency === 'yearly' && monthOfYear) {
        const thisYearMonth = new Date(today.getFullYear(), monthOfYear - 1, 1);
        const dummyDate = format(thisYearMonth, 'yyyy-MM-dd');
        const paymentDate = calculatePaymentDate(dummyDate, pm);
        if (!paymentDate) return null;

        const paymentDay = paymentDate.getDate();

        let nextDate = new Date(today.getFullYear(), monthOfYear - 1, paymentDay);
        const nextDateStr = format(nextDate, 'yyyy-MM-dd');
        const todayStr = format(today, 'yyyy-MM-dd');

        if (isBefore(nextDate, today) || nextDateStr === todayStr) {
          const nextYearMonth = new Date(today.getFullYear() + 1, monthOfYear - 1, 1);
          nextDate = new Date(nextYearMonth.getFullYear(), nextYearMonth.getMonth(), paymentDay);
        }

        return startOfDay(nextDate);
      }

      return null;
    }
  }

  // カード紐付けでない場合は通常の計算
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
 * 口座ごとの未精算の定期支払い・収入を計算
 * returns: { [accountId]: { expense: number, income: number } }
 */
export const getPendingRecurringByAccount = (days: number = 31): Record<string, { expense: number; income: number }> => {
  const upcoming = getUpcomingRecurringPayments(days);
  const result: Record<string, { expense: number; income: number }> = {};

  for (const rp of upcoming) {
    const accountId = rp.accountId;
    if (!result[accountId]) {
      result[accountId] = { expense: 0, income: 0 };
    }

    if (rp.type === 'expense') {
      result[accountId].expense += rp.amount;
    } else {
      result[accountId].income += rp.amount;
    }
  }

  return result;
};

/**
 * 口座ごとの総合的な未精算額を計算（カード + 定期支払い・収入）
 * returns: { [accountId]: { cardPending, recurringExpense, recurringIncome, totalPending } }
 */
export const getTotalPendingByAccount = (recurringDays: number = 31): Record<
  string,
  {
    cardPending: number;
    recurringExpense: number;
    recurringIncome: number;
    totalPending: number;
  }
> => {
  const cardPending = getPendingAmountByAccount();
  const recurringPending = getPendingRecurringByAccount(recurringDays);
  const result: Record<
    string,
    {
      cardPending: number;
      recurringExpense: number;
      recurringIncome: number;
      totalPending: number;
    }
  > = {};

  // すべての口座IDを収集
  const allAccountIds = new Set([...Object.keys(cardPending), ...Object.keys(recurringPending)]);

  for (const accountId of allAccountIds) {
    const card = cardPending[accountId] || 0;
    const recurring = recurringPending[accountId] || { expense: 0, income: 0 };

    result[accountId] = {
      cardPending: card,
      recurringExpense: recurring.expense,
      recurringIncome: recurring.income,
      totalPending: card + recurring.expense - recurring.income,
    };
  }

  return result;
};
