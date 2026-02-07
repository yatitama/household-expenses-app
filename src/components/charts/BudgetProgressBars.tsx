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
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-bold text-gray-800 mb-3">予算 vs 実績（当月）</h3>
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
              <div key={item.categoryId}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-gray-700">{item.categoryName}</span>
                  </div>
                  <span className={`text-xs font-bold ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
                    {item.percentage}%
                  </span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                      isOver ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{formatCurrency(item.actual)}</span>
                  <span className="text-xs text-gray-400">/ {formatCurrency(item.budget)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
