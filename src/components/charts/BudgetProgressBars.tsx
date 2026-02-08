import { useMemo } from 'react';
import { getBudgetProgress } from '../../services/statsService';
import { formatCurrency } from '../../utils/formatters';

interface BudgetProgressBarsProps {
  year: number;
  month: number;
}

export const BudgetProgressBars = ({ year, month }: BudgetProgressBarsProps) => {
  const data = useMemo(() => getBudgetProgress(year, month), [year, month]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4" aria-label="予算と実績の比較チャート（当月）">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">予算 vs 実績（当月）</h3>
      {data.length === 0 ? (
        <div className="py-8 flex items-center justify-center">
          <p className="text-sm text-gray-400">予算が設定されていません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const isOver = item.percentage > 100;
            const barWidth = Math.min(item.percentage, 100);
            return (
              <div key={item.categoryId} aria-label={`${item.categoryName}: 予算の${item.percentage}%を使用`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{item.categoryName}</span>
                  </div>
                  <span className={`text-sm font-bold ${isOver ? 'text-danger-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    {item.percentage}%
                  </span>
                </div>
                <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                      isOver ? 'bg-danger-600' : 'bg-primary-600'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{formatCurrency(item.actual)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">/ {formatCurrency(item.budget)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
