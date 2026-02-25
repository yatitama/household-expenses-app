import { ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { savingsGoalService } from '../../services/storage';
import { getEffectiveMonthlyAmount, isMonthExcluded } from '../../utils/savingsUtils';
import type { MonthSummary } from '../../utils/growthMetrics';

interface MonthComparisonCardsProps {
  currentMonth: string;
  previousMonth: string;
  currentSummary: MonthSummary;
  previousSummary: MonthSummary;
}

interface MetricDisplay {
  label: string;
  current: number;
  previous: number;
}

export const MonthComparisonCards = ({
  currentMonth,
  previousMonth,
  currentSummary,
  previousSummary,
}: MonthComparisonCardsProps) => {
  // Calculate total assets (net worth)
  const currentTotalAssets = currentSummary.totalNetWorth;
  const previousTotalAssets = previousSummary.totalNetWorth;

  // Calculate accumulated savings (sum of all savings goals)
  const calculateAccumulatedSavings = (upToMonth: string): number => {
    const savingsGoals = savingsGoalService.getAll();
    return savingsGoals.reduce((sum, goal) => {
      if (upToMonth < goal.startMonth) return sum;

      // Calculate accumulated up to this month
      let accumulated = 0;
      let checkMonth = goal.startMonth;
      while (checkMonth <= upToMonth) {
        if (!isMonthExcluded(goal, checkMonth)) {
          accumulated += getEffectiveMonthlyAmount(goal, checkMonth);
        }
        // Move to next month
        const [year, month] = checkMonth.split('-').map(Number);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        checkMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      }

      return sum + accumulated;
    }, 0);
  };

  const currentAccumulatedSavings = calculateAccumulatedSavings(currentMonth);
  const previousAccumulatedSavings = calculateAccumulatedSavings(previousMonth);

  const metrics: MetricDisplay[] = [
    {
      label: '収入',
      current: currentSummary.totalIncome,
      previous: previousSummary.totalIncome,
    },
    {
      label: '支出',
      current: currentSummary.totalExpense,
      previous: previousSummary.totalExpense,
    },
    {
      label: '純資産',
      current: currentTotalAssets,
      previous: previousTotalAssets,
    },
    {
      label: '貯金額',
      current: currentAccumulatedSavings,
      previous: previousAccumulatedSavings,
    },
  ];

  const getChangeIndicator = (current: number, previous: number, isBenefit: boolean) => {
    const change = current - previous;
    const isPositive = isBenefit ? change > 0 : change < 0;

    if (change === 0) return null;

    const percentChange = previous !== 0 ? Math.abs((change / previous) * 100) : 0;

    return {
      isPositive,
      change,
      percentChange,
    };
  };

  // Format current/previous month for display
  const formatMonthDisplay = (monthStr: string) => {
    const [, month] = monthStr.split('-').map(Number);
    return `${month}月`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      {/* Current Month Card */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {formatMonthDisplay(currentMonth)}
        </h3>
        <div className="space-y-2.5">
          {metrics.map((metric, idx) => {
            const isBenefit = metric.label === '収入' || metric.label === '純資産' || metric.label === '貯金額';
            const change = getChangeIndicator(metric.current, metric.previous, isBenefit);

            return (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-700 dark:text-gray-400">
                  {metric.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(metric.current)}
                  </span>
                  {change && (
                    <div className="flex items-center gap-0.5">
                      {change.isPositive ? (
                        <ArrowUp size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <ArrowDown size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${
                        change.isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {change.percentChange.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Previous Month Card */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-slate-900 opacity-75">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          {formatMonthDisplay(previousMonth)}
        </h3>
        <div className="space-y-2.5">
          {metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-500">
                {metric.label}
              </span>
              <span className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-400">
                {formatCurrency(metric.previous)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
