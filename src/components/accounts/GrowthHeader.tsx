import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { GrowthComparison } from '../../utils/growthMetrics';

interface GrowthHeaderProps {
  comparison: GrowthComparison | null;
}

export const GrowthHeader = ({ comparison }: GrowthHeaderProps) => {
  if (!comparison) return null;

  const { amountChange, percentChange, trend } = comparison;
  const isPositive = amountChange > 0;
  const isFlat = trend === 'flat';

  return (
    <div
      className={`
        border border-gray-200 dark:border-gray-700 rounded-lg
        p-3 md:p-4 mb-4
        flex flex-col gap-3
        transition-all duration-300 ease-out
        animate-in fade-in slide-in-from-top-2
      `}
      style={{
        background: isPositive
          ? 'linear-gradient(135deg, rgba(132, 204, 22, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%)'
          : isFlat
          ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.05) 0%, rgba(107, 114, 128, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)',
      }}
    >
      {/* Message row */}
      <div className="flex items-center justify-center gap-1.5">
        {isPositive && <Sparkles size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />}
        <span className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 text-center">
          {isPositive ? '先月より 頑張れた！' : isFlat ? '先月と同じペース' : '先月より課題あり'}
        </span>
      </div>

      {/* Main comparison display */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {isPositive && (
            <TrendingUp size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          )}
          {!isPositive && !isFlat && (
            <TrendingDown size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <div className={`text-base md:text-xl font-bold ${
            isPositive
              ? 'text-green-700 dark:text-green-400'
              : isFlat
              ? 'text-gray-700 dark:text-gray-400'
              : 'text-red-700 dark:text-red-400'
          }`}>
            先月比: {isPositive ? '+' : ''}{formatCurrency(amountChange)}
          </div>
        </div>
        <div className={`text-xs md:text-sm font-medium ${
          isPositive
            ? 'text-green-600 dark:text-green-400'
            : isFlat
            ? 'text-gray-600 dark:text-gray-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          ({isPositive ? '+' : ''}{percentChange.toFixed(1)}%)
        </div>
      </div>

      {/* Insight message */}
      {isPositive && (
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
          この調子なら月間 {formatCurrency(amountChange * 12 / 100)} の改善が期待できます
        </div>
      )}
    </div>
  );
};
