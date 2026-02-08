import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getMonthlyStats } from '../../services/statsService';
import { formatCurrency } from '../../utils/formatters';

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium dark:text-gray-300" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const MonthlyTrendChart = () => {
  const data = useMemo(() => getMonthlyStats(6), []);

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4" aria-label="月別収支推移チャート（過去6ヶ月）">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">月別収支推移（過去6ヶ月）</h3>
      {!hasData ? (
        <div className="h-[250px] md:h-[300px] flex items-center justify-center">
          <p className="text-sm text-gray-400">データがありません</p>
        </div>
      ) : (
        <div className="h-[250px] md:h-[300px]" role="img" aria-label="月別の収入と支出を示すラインチャート">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} stroke="#d1d5db" />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#d1d5db"
                tickFormatter={(v: number) => v >= 10000 ? `${Math.round(v / 10000)}万` : String(v)}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="income"
                name="収入"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="支出"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
