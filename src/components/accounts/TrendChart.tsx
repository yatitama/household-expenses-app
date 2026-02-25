import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import type { TrendDataPoint } from '../../utils/growthMetrics';

interface TrendChartProps {
  data: TrendDataPoint[];
  timeRange: '3m' | '6m' | '12m';
  onTimeRangeChange: (range: '3m' | '6m' | '12m') => void;
}

interface TooltipEntry {
  color: string;
  name: string;
  value: number;
  payload: { month: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg">
      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
        {data.month}
      </p>
      {payload.map((entry, index: number) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const TrendChart = ({ data, timeRange, onTimeRangeChange }: TrendChartProps) => {
  const timeRangeOptions: Array<'3m' | '6m' | '12m'> = ['3m', '6m', '12m'];
  const timeRangeLabels: Record<'3m' | '6m' | '12m', string> = {
    '3m': '3ヶ月',
    '6m': '6ヶ月',
    '12m': '1年',
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 mb-4 bg-white dark:bg-slate-900">
      {/* Header with time range toggle */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
          推移チャート
        </h3>
        <div className="flex gap-1">
          {timeRangeOptions.map((option) => (
            <button
              key={option}
              onClick={() => onTimeRangeChange(option)}
              className={`
                text-xs px-2 py-1 rounded transition-all
                ${
                  timeRange === option
                    ? 'bg-gray-700 dark:bg-gray-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {timeRangeLabels[option]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-40 md:h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 10 }}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(55, 65, 81, 0.3)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="rgba(55, 65, 81, 0)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(34, 197, 94, 0.3)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="rgba(34, 197, 94, 0)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(107, 114, 128, 0.2)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="rgb(107, 114, 128)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                stroke="rgb(107, 114, 128)"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="line"
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    netWorth: '純資産',
                    net: '月間黒字',
                    income: '収入',
                    expense: '支出',
                    savings: '貯金',
                  };
                  return labels[value] || value;
                }}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="rgb(55, 65, 81)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNetWorth)"
                yAxisId="left"
                isAnimationActive={true}
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="rgb(34, 197, 94)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNet)"
                yAxisId="right"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
            データがありません
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        <p>グレーの領域は純資産の推移、緑の領域は月間黒字を示しています</p>
      </div>
    </div>
  );
};
