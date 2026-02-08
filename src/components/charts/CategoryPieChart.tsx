import { useMemo, useState, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, type PieLabelRenderProps } from 'recharts';
import { getCategoryStats } from '../../services/statsService';
import { formatCurrency } from '../../utils/formatters';
import type { CategoryStats } from '../../services/statsService';

interface CategoryPieChartProps {
  year: number;
  month: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: CategoryStats }[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
      <p className="text-sm font-semibold dark:text-gray-200" style={{ color: data.color }}>{data.categoryName}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-300 mt-1">{formatCurrency(data.amount)}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{data.percentage}%</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = (props: PieLabelRenderProps & { percentage?: number; categoryName?: string }) => {
  const cx = Number(props.cx);
  const cy = Number(props.cy);
  const midAngle = Number(props.midAngle);
  const innerRadius = Number(props.innerRadius);
  const outerRadius = Number(props.outerRadius);
  const percentage = Number(props.percentage ?? 0);
  const categoryName = String(props.categoryName ?? '');
  if (percentage < 5) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {categoryName.length > 4 ? `${categoryName.slice(0, 3)}..` : categoryName}
      {' '}{percentage}%
    </text>
  );
};

export const CategoryPieChart = ({ year, month }: CategoryPieChartProps) => {
  const data = useMemo(() => getCategoryStats(year, month), [year, month]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryStats | null>(null);

  const handleClick = useCallback((_: unknown, index: number) => {
    setSelectedCategory(data[index] || null);
  }, [data]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4" aria-label="カテゴリ別支出チャート（当月）">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">カテゴリ別支出（当月）</h3>
      {data.length === 0 ? (
        <div className="h-[250px] md:h-[300px] flex items-center justify-center">
          <p className="text-sm text-gray-400">データがありません</p>
        </div>
      ) : (
        <>
          <div className="h-[250px] md:h-[300px]" role="img" aria-label="支出をカテゴリ別に示した円グラフ">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius="85%"
                  dataKey="amount"
                  onClick={handleClick}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} cursor="pointer" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {selectedCategory && (
            <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                <span className="text-sm font-medium text-gray-800">{selectedCategory.categoryName}</span>
              </div>
              <p className="text-sm text-gray-600">{formatCurrency(selectedCategory.amount)} ({selectedCategory.percentage}%)</p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {data.slice(0, 6).map((item) => (
              <div key={item.categoryId} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.categoryName}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
