import { formatCurrency } from '../../utils/formatters';
import { savingsGoalService } from '../../services/storage';
import { getEffectiveMonthlyAmount, isMonthExcluded } from '../../utils/savingsUtils';
import { getMonthsInRange } from '../../utils/growthMetrics';

interface SavingsProgressTimelineProps {
  currentMonth: string;
}

export const SavingsProgressTimeline = ({
  currentMonth,
}: SavingsProgressTimelineProps) => {
  const savingsGoals = savingsGoalService.getAll();

  // Filter out goals that are outside the current month range
  const activeGoals = savingsGoals.filter((goal) => {
    const targetMonth = goal.targetDate.substring(0, 7);
    return currentMonth >= goal.startMonth && currentMonth <= targetMonth;
  });

  if (activeGoals.length === 0) return null;

  // Focus on the primary/most recent goal
  const primaryGoal = activeGoals[activeGoals.length - 1];
  if (!primaryGoal) return null;

  // Calculate accumulated savings for the goal
  const months = getMonthsInRange(primaryGoal.startMonth, currentMonth);
  let accumulated = 0;
  months.forEach((m) => {
    if (!isMonthExcluded(primaryGoal, m)) {
      accumulated += getEffectiveMonthlyAmount(primaryGoal, m);
    }
  });

  // Calculate progress percentage
  const progress = Math.min(100, (accumulated / primaryGoal.targetAmount) * 100);

  // Calculate remaining months
  const targetDate = primaryGoal.targetDate;
  const [targetYear, targetMonth] = targetDate.split('-').map(Number);
  const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);

  let remainingMonths = 0;
  if (targetYear > currentYear || (targetYear === currentYear && targetMonth > currentMonthNum)) {
    if (targetYear === currentYear) {
      remainingMonths = targetMonth - currentMonthNum;
    } else {
      remainingMonths = (12 - currentMonthNum) + (targetYear - currentYear - 1) * 12 + targetMonth;
    }
  }

  const remaining = primaryGoal.targetAmount - accumulated;
  const monthlyAmount = getEffectiveMonthlyAmount(primaryGoal, currentMonth);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 mb-4 bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
            {primaryGoal.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {primaryGoal.targetDate.replace('-', '年') + '月まで'}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {progress.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {formatCurrency(accumulated)} / {formatCurrency(primaryGoal.targetAmount)}
          </span>
          {remainingMonths > 0 && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              あと {remainingMonths} ヶ月
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out`}
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg,
                ${progress < 50 ? '#60a5fa' : progress < 80 ? '#34d399' : '#fbbf24'} 0%,
                ${progress < 50 ? '#3b82f6' : progress < 80 ? '#10b981' : '#f59e0b'} 100%)`,
            }}
          />
        </div>
      </div>

      {/* Status message */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {remaining > 0 ? (
          <p>
            月額 {formatCurrency(monthlyAmount)} で {remainingMonths > 0 ? remainingMonths : '今月中'} で達成予定
          </p>
        ) : (
          <p className="text-green-600 dark:text-green-400 font-medium">
            目標達成！ 🎉
          </p>
        )}
      </div>
    </div>
  );
};
