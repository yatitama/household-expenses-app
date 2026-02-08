import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { getMemberStats } from '../../services/statsService';
import { formatCurrency } from '../../utils/formatters';

interface MemberBarChartProps {
  year: number;
  month: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: { memberName: string; amount: number; color: string } }[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.memberName}</p>
      <p className="text-sm font-bold" style={{ color: data.color }}>{formatCurrency(data.amount)}</p>
    </div>
  );
};

export const MemberBarChart = ({ year, month }: MemberBarChartProps) => {
  const data = useMemo(() => getMemberStats(year, month), [year, month]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">メンバー別支出（当月）</h3>
      {data.length === 0 ? (
        <div className="h-[250px] md:h-[300px] flex items-center justify-center">
          <p className="text-sm text-gray-400">データがありません</p>
        </div>
      ) : (
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="memberName" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                tickFormatter={(v: number) => v >= 10000 ? `${Math.round(v / 10000)}万` : String(v)}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} animationDuration={800}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
