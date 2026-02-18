import type { SavingsGoal } from '../types';

// yyyy-MM 形式の月文字列を生成
export const toYearMonth = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// 現在の実際の月 (yyyy-MM)
export const getCurrentMonth = (): string => toYearMonth(new Date());

// 次の月を返す (yyyy-MM)
export const getNextMonth = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
};

// 前の月を返す (yyyy-MM)
export const getPrevMonth = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
};

// 月の比較 (a < b なら負, a === b なら 0, a > b なら正)
export const compareMonths = (a: string, b: string): number => {
  return a.localeCompare(b);
};

// 開始月から終了月までのすべての月リストを返す (両端含む)
export const getMonthsInRange = (startMonth: string, endMonth: string): string[] => {
  const months: string[] = [];
  let current = startMonth;
  while (compareMonths(current, endMonth) <= 0) {
    months.push(current);
    current = getNextMonth(current);
  }
  return months;
};

// 目標日から対象月 (yyyy-MM) を取得
export const getTargetMonth = (targetDate: string): string => {
  return targetDate.substring(0, 7);
};

// 貯金目標の毎月の貯金額を計算する
// アクティブな月 = 開始月〜目標月のうち除外されていない月
export const calculateMonthlyAmount = (goal: SavingsGoal): number => {
  const targetMonth = getTargetMonth(goal.targetDate);
  const allMonths = getMonthsInRange(goal.startMonth, targetMonth);
  const activeMonths = allMonths.filter((m) => !goal.excludedMonths.includes(m));
  if (activeMonths.length === 0) return goal.targetAmount;
  return Math.ceil(goal.targetAmount / activeMonths.length);
};

// 指定月の実際の貯金額 (月別上書きがあればそれを、なければ通常月額を返す)
export const getEffectiveMonthlyAmount = (goal: SavingsGoal, month: string): number => {
  const overrides = goal.monthlyOverrides ?? {};
  if (month in overrides) return overrides[month];
  return calculateMonthlyAmount(goal);
};

// 貯金目標の今月時点での貯まった金額を計算する
// (現在の実際の月までの非除外月の合計。月別上書きがあればその金額を使用)
export const calculateAccumulatedAmount = (goal: SavingsGoal, currentRealMonth: string): number => {
  const targetMonth = getTargetMonth(goal.targetDate);
  const endMonth = compareMonths(currentRealMonth, targetMonth) <= 0 ? currentRealMonth : targetMonth;
  const allMonths = getMonthsInRange(goal.startMonth, endMonth);
  const activePassedMonths = allMonths.filter((m) => !goal.excludedMonths.includes(m));
  return activePassedMonths.reduce((sum, m) => sum + getEffectiveMonthlyAmount(goal, m), 0);
};

// 指定月が除外されているかどうか
export const isMonthExcluded = (goal: SavingsGoal, month: string): boolean => {
  return goal.excludedMonths.includes(month);
};

// 残り月数 (今月以降の非除外月) を計算する
export const getRemainingMonthsCount = (goal: SavingsGoal, currentRealMonth: string): number => {
  const targetMonth = getTargetMonth(goal.targetDate);
  if (compareMonths(currentRealMonth, targetMonth) > 0) return 0;
  const allMonths = getMonthsInRange(currentRealMonth, targetMonth);
  return allMonths.filter((m) => !goal.excludedMonths.includes(m)).length;
};
