import { transactionService, accountService, savingsGoalService } from '../services/storage';
import { getRecurringPaymentsForMonth } from './billingUtils';
import { getEffectiveRecurringAmount, getEffectiveMonthlyAmount, isMonthExcluded } from './savingsUtils';

/**
 * Summary data for a single month
 */
export interface MonthSummary {
  month: string;           // yyyy-MM format
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  netIncome: number;      // income - expense - savings
  totalNetWorth: number;  // sum of all account balances
}

/**
 * Comparison data between two months
 */
export interface GrowthComparison {
  currentMonth: MonthSummary;
  previousMonth: MonthSummary;
  amountChange: number;   // current net - previous net
  percentChange: number;  // percentage change
  trend: 'up' | 'down' | 'flat';
}

/**
 * Achievement/milestone badge
 */
export interface Achievement {
  id: string;
  type: 'savings-goal' | 'spending-reduction' | 'net-income-increase' | 'streak';
  title: string;
  description: string;
  month: string;          // yyyy-MM
}

/**
 * Trend chart data point
 */
export interface TrendDataPoint {
  month: string;          // Display format like "2月"
  monthKey: string;       // yyyy-MM format for internal use
  income: number;
  expense: number;
  savings: number;
  net: number;
  netWorth: number;
}

/**
 * Get months in a date range (inclusive)
 */
export const getMonthsInRange = (startMonth: string, endMonth: string): string[] => {
  const months: string[] = [];
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  const [endYear, endMonthNum] = endMonth.split('-').map(Number);

  let currentYear = startYear;
  let currentMonth = startMonthNum;

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonthNum)) {
    months.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return months;
};

/**
 * Get previous month in yyyy-MM format
 */
export const getPreviousMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
};

/**
 * Format month string for display (e.g., "2026-02" → "2月")
 */
export const formatMonthForChart = (monthStr: string): string => {
  const [, month] = monthStr.split('-').map(Number);
  return `${month}月`;
};

/**
 * Calculate summary for a single month
 */
export const calculateMonthSummary = (monthStr: string): MonthSummary => {
  const [year, month] = monthStr.split('-').map(Number);

  // Get all transactions for the month
  const allTransactions = transactionService.getAll();
  const monthTransactions = allTransactions.filter((t) => {
    const [y, m] = t.date.split('-').map(Number);
    return y === year && m === month;
  });

  // Calculate totals
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Get recurring payments
  const recurringPayments = getRecurringPaymentsForMonth(year, month);
  const totalRecurringIncome = recurringPayments
    .filter((rp) => rp.type === 'income')
    .reduce((sum, rp) => sum + getEffectiveRecurringAmount(rp, monthStr), 0);

  const totalRecurringExpense = recurringPayments
    .filter((rp) => rp.type === 'expense')
    .reduce((sum, rp) => sum + getEffectiveRecurringAmount(rp, monthStr), 0);

  // Get savings goals
  const savingsGoals = savingsGoalService.getAll();
  const totalSavings = savingsGoals.reduce((sum, goal) => {
    const targetMonth = goal.targetDate.substring(0, 7);
    if (monthStr < goal.startMonth || monthStr > targetMonth) return sum;
    if (isMonthExcluded(goal, monthStr)) return sum;
    return sum + getEffectiveMonthlyAmount(goal, monthStr);
  }, 0);

  // Calculate net income (income - expense - savings)
  const netIncome =
    (totalIncome + totalRecurringIncome) - (totalExpense + totalRecurringExpense + totalSavings);

  // Get total net worth (sum of all account balances)
  const accounts = accountService.getAll();
  const totalNetWorth = accounts.reduce((sum, account) => sum + account.balance, 0);

  return {
    month: monthStr,
    totalIncome: totalIncome + totalRecurringIncome,
    totalExpense: totalExpense + totalRecurringExpense,
    totalSavings,
    netIncome,
    totalNetWorth,
  };
};

/**
 * Calculate month-over-month comparison
 */
export const calculateMonthOverMonthChange = (
  current: MonthSummary,
  previous: MonthSummary
): GrowthComparison => {
  const amountChange = current.netIncome - previous.netIncome;
  const percentChange = previous.netIncome !== 0
    ? (amountChange / Math.abs(previous.netIncome)) * 100
    : 0;

  return {
    currentMonth: current,
    previousMonth: previous,
    amountChange,
    percentChange,
    trend: amountChange > 0 ? 'up' : amountChange < 0 ? 'down' : 'flat',
  };
};

/**
 * Calculate trend data for multiple months
 */
export const calculateTrendData = (months: string[]): TrendDataPoint[] => {
  return months.map((monthStr) => {
    const summary = calculateMonthSummary(monthStr);
    return {
      month: formatMonthForChart(monthStr),
      monthKey: monthStr,
      income: summary.totalIncome,
      expense: summary.totalExpense,
      savings: summary.totalSavings,
      net: summary.netIncome,
      netWorth: summary.totalNetWorth,
    };
  });
};

/**
 * Detect achievements for a given month
 */
export const detectAchievements = (
  monthStr: string,
  recentMonthSummaries: MonthSummary[]
): Achievement[] => {
  const achievements: Achievement[] = [];
  const currentMonthSummary = recentMonthSummaries[recentMonthSummaries.length - 1];

  if (!currentMonthSummary || currentMonthSummary.month !== monthStr) {
    return achievements;
  }

  // 1. Check for savings goal achievement
  const savingsGoals = savingsGoalService.getAll();
  savingsGoals.forEach((goal) => {
    // Calculate accumulated amount up to this month
    const months = getMonthsInRange(goal.startMonth, monthStr);
    let accumulated = 0;
    months.forEach((m) => {
      if (m <= monthStr && isMonthExcluded(goal, m) === false) {
        accumulated += getEffectiveMonthlyAmount(goal, m);
      }
    });

    // Check if we reached the target
    if (accumulated >= goal.targetAmount && accumulated - getEffectiveMonthlyAmount(goal, monthStr) < goal.targetAmount) {
      achievements.push({
        id: `savings-goal-${goal.id}`,
        type: 'savings-goal',
        title: `¥${goal.targetAmount.toLocaleString('ja-JP')}貯金達成 🎉`,
        description: `${goal.name}の目標金額に達しました`,
        month: monthStr,
      });
    }
  });

  // 2. Check for spending reduction (compared to previous month)
  if (recentMonthSummaries.length >= 2) {
    const previousMonthSummary = recentMonthSummaries[recentMonthSummaries.length - 2];
    if (currentMonthSummary.totalExpense < previousMonthSummary.totalExpense) {
      const reduction = previousMonthSummary.totalExpense - currentMonthSummary.totalExpense;
      const percentReduction = (reduction / previousMonthSummary.totalExpense) * 100;
      achievements.push({
        id: `spending-reduction-${monthStr}`,
        type: 'spending-reduction',
        title: `支出削減 💪`,
        description: `前月比${percentReduction.toFixed(1)}%削減しました`,
        month: monthStr,
      });
    }
  }

  // 3. Check for month achieving positive net income
  if (currentMonthSummary.netIncome > 0) {
    achievements.push({
      id: `net-income-${monthStr}`,
      type: 'net-income-increase',
      title: `月の黒字化 📈`,
      description: `${currentMonthSummary.netIncome.toLocaleString('ja-JP')}円の黒字を達成しました`,
      month: monthStr,
    });
  }

  // 4. Check for consecutive positive months (streak)
  if (recentMonthSummaries.length >= 3) {
    const lastThreeMonths = recentMonthSummaries.slice(-3);
    if (lastThreeMonths.every((s) => s.netIncome > 0)) {
      achievements.push({
        id: `streak-3-${monthStr}`,
        type: 'streak',
        title: `黒字連続 ✅`,
        description: `3ヶ月連続で黒字を達成しました`,
        month: monthStr,
      });
    }
  }

  return achievements;
};

/**
 * Get the last N months from a given month
 */
export const getLastNMonths = (fromMonth: string, count: number): string[] => {
  const months: string[] = [];
  let currentMonth = fromMonth;

  for (let i = 0; i < count; i++) {
    months.unshift(currentMonth);
    currentMonth = getPreviousMonth(currentMonth);
  }

  return months;
};
