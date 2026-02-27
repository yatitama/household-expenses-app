import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  transactionService,
  categoryService,
  paymentMethodService,
  accountService,
} from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { getRecurringPaymentsForMonth } from '../utils/billingUtils';
import { getEffectiveRecurringAmount } from '../utils/savingsUtils';

type TrendPeriod = '3months' | '6months' | '1year';
type TrendType = 'net' | 'expense' | 'income';
type PieGroupMode = 'category' | 'payment' | 'account';

interface TrendDataPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

interface PieItem {
  /** カテゴリ/支払元/引落口座の ID。合成キー（__direct__ 等）の場合は遷移ボタンを非表示 */
  id: string;
  name: string;
  color: string;
  amount: number;
}

const EXPENSE_COLOR = '#ef4444';
const INCOME_COLOR = '#22c55e';
const NET_POS_COLOR = '#3b82f6';
const NET_NEG_COLOR = '#ef4444';
const GRID_COLOR = 'rgba(107,114,128,0.2)';
const TICK_COLOR = '#9ca3af';

const mergePieItem = (
  map: Map<string, PieItem>,
  key: string,
  name: string,
  color: string,
  amount: number,
) => {
  const existing = map.get(key);
  if (existing) {
    existing.amount += amount;
  } else {
    map.set(key, { id: key, name, color, amount });
  }
};

export const AccountsPage = () => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);

  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('6months');
  const [trendType, setTrendType] = useState<TrendType>('expense');
  const [pieYear, setPieYear] = useState(() => now.getFullYear());
  const [pieMonth, setPieMonth] = useState(() => now.getMonth() + 1);
  const [pieGroupMode, setPieGroupMode] = useState<PieGroupMode>('category');

  const [allTransactions] = useState(() => transactionService.getAll());
  const [categories] = useState(() => categoryService.getAll());
  const [paymentMethods] = useState(() => paymentMethodService.getAll());
  const [accounts] = useState(() => accountService.getAll());

  // 収支推移グラフ用データ（定期支払い含む）
  const trendData = useMemo((): TrendDataPoint[] => {
    const count = trendPeriod === '3months' ? 3 : trendPeriod === '6months' ? 6 : 12;
    const result: TrendDataPoint[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
      const label = `${monthNum}月`;

      const txns = allTransactions.filter((t) => t.date.startsWith(monthStr));
      const txIncome = txns
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const txExpense = txns
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      const rps = getRecurringPaymentsForMonth(year, monthNum);
      const rpIncome = rps
        .filter((rp) => rp.type === 'income')
        .reduce((s, rp) => s + getEffectiveRecurringAmount(rp, monthStr), 0);
      const rpExpense = rps
        .filter((rp) => rp.type === 'expense')
        .reduce((s, rp) => s + getEffectiveRecurringAmount(rp, monthStr), 0);

      const income = txIncome + rpIncome;
      const expense = txExpense + rpExpense;
      result.push({ label, income, expense, net: income - expense });
    }
    return result;
  }, [trendPeriod, allTransactions, now]);

  // 円グラフ用: 通常の支出取引
  const pieViewMonth = `${pieYear}-${String(pieMonth).padStart(2, '0')}`;
  const monthExpenses = useMemo(
    () => allTransactions.filter((t) => t.type === 'expense' && t.date.startsWith(pieViewMonth)),
    [allTransactions, pieViewMonth],
  );

  // 円グラフ用: 定期支出
  const monthRecurringExpenses = useMemo(
    () => getRecurringPaymentsForMonth(pieYear, pieMonth).filter((rp) => rp.type === 'expense'),
    [pieYear, pieMonth],
  );

  const pieData = useMemo((): PieItem[] => {
    const map = new Map<string, PieItem>();

    // 通常取引
    for (const t of monthExpenses) {
      let key: string;
      let name: string;
      let color: string;

      if (pieGroupMode === 'category') {
        const cat = categories.find((c) => c.id === t.categoryId);
        key = t.categoryId;
        name = cat?.name ?? '不明';
        color = cat?.color ?? '#6b7280';
      } else if (pieGroupMode === 'payment') {
        key = t.paymentMethodId ?? '__direct__';
        const pm = t.paymentMethodId
          ? paymentMethods.find((p) => p.id === t.paymentMethodId)
          : undefined;
        name = pm?.name ?? '現金・直接引落';
        color = pm?.color ?? '#6b7280';
      } else {
        let accId = t.accountId;
        if (t.paymentMethodId) {
          const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
          if (pm) accId = pm.linkedAccountId;
        }
        key = accId;
        const acc = accounts.find((a) => a.id === accId);
        name = acc?.name ?? '不明';
        color = acc?.color ?? '#6b7280';
      }

      mergePieItem(map, key, name, color, t.amount);
    }

    // 定期取引
    for (const rp of monthRecurringExpenses) {
      const amount = getEffectiveRecurringAmount(rp, pieViewMonth);
      let key: string;
      let name: string;
      let color: string;

      if (pieGroupMode === 'category') {
        const catId = rp.categoryId ?? '__unknown_cat__';
        const cat = rp.categoryId ? categories.find((c) => c.id === rp.categoryId) : undefined;
        key = catId;
        name = cat?.name ?? '不明';
        color = cat?.color ?? '#6b7280';
      } else if (pieGroupMode === 'payment') {
        key = rp.paymentMethodId ?? '__direct__';
        const pm = rp.paymentMethodId
          ? paymentMethods.find((p) => p.id === rp.paymentMethodId)
          : undefined;
        name = pm?.name ?? '現金・直接引落';
        color = pm?.color ?? '#6b7280';
      } else {
        let accId = rp.accountId ?? '__unknown_acc__';
        if (rp.paymentMethodId) {
          const pm = paymentMethods.find((p) => p.id === rp.paymentMethodId);
          if (pm) accId = pm.linkedAccountId;
        }
        key = accId;
        const acc = accounts.find((a) => a.id === accId);
        name = acc?.name ?? '不明';
        color = acc?.color ?? '#6b7280';
      }

      mergePieItem(map, key, name, color, amount);
    }

    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [
    pieGroupMode,
    monthExpenses,
    monthRecurringExpenses,
    pieViewMonth,
    categories,
    paymentMethods,
    accounts,
  ]);

  const totalPieAmount = pieData.reduce((s, d) => s + d.amount, 0);
  const hasExpenseData = monthExpenses.length > 0 || monthRecurringExpenses.length > 0;

  const handlePrevPieMonth = () => {
    if (pieMonth === 1) {
      setPieYear((y) => y - 1);
      setPieMonth(12);
    } else {
      setPieMonth((m) => m - 1);
    }
  };

  const handleNextPieMonth = () => {
    if (pieMonth === 12) {
      setPieYear((y) => y + 1);
      setPieMonth(1);
    } else {
      setPieMonth((m) => m + 1);
    }
  };

  // 凡例アイテムクリック時に履歴画面へ遷移
  const handleLegendNavigate = (item: PieItem) => {
    // 合成キー（直接払い・不明）は遷移対象外
    if (item.id.startsWith('__')) return;

    const monthDate = new Date(pieYear, pieMonth - 1, 1);
    const dateRange = {
      start: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
      end: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
    };

    // グループ種別に応じてフィルターと groupBy を設定
    type GroupByType = 'date' | 'category' | 'account' | 'payment';
    let groupBy: GroupByType = 'date';
    const statePayload: {
      filterType: string;
      dateRange: { start: string; end: string };
      transactionType: 'expense';
      categoryIds?: string[];
      paymentMethodIds?: string[];
      accountIds?: string[];
      initialGroupBy: GroupByType;
    } = {
      filterType: 'pie-breakdown',
      dateRange,
      transactionType: 'expense',
      initialGroupBy: groupBy,
    };

    if (pieGroupMode === 'category') {
      groupBy = 'category';
      statePayload.categoryIds = [item.id];
    } else if (pieGroupMode === 'payment') {
      groupBy = 'payment';
      statePayload.paymentMethodIds = [item.id];
    } else {
      groupBy = 'account';
      statePayload.accountIds = [item.id];
    }
    statePayload.initialGroupBy = groupBy;

    navigate('/transactions', { state: statePayload });
  };

  const getBarColor = (entry: TrendDataPoint): string => {
    if (trendType === 'expense') return EXPENSE_COLOR;
    if (trendType === 'income') return INCOME_COLOR;
    return entry.net >= 0 ? NET_POS_COLOR : NET_NEG_COLOR;
  };

  const formatYAxis = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 100000000) return `${Math.round(value / 100000000)}億`;
    if (abs >= 10000) return `${Math.round(value / 10000)}万`;
    return String(value);
  };

  const trendLabel =
    trendType === 'net' ? '収支' : trendType === 'expense' ? '支出' : '収入';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-32">
      {/* 収支推移グラフ */}
      <div className="bg-white dark:bg-slate-800 m-3 md:m-4 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            収支の推移
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* 期間トグル */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
              {(['3months', '6months', '1year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    trendPeriod === p
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {p === '3months' ? '3ヶ月' : p === '6months' ? '半年' : '1年'}
                </button>
              ))}
            </div>
            {/* グラフ種別トグル */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
              {(['net', 'expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTrendType(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    trendType === t
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {t === 'net' ? '収支' : t === 'expense' ? '支出' : '収入'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="pb-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} margin={{ top: 4, right: 12, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10, fill: TICK_COLOR }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip
                formatter={(value) => {
                  const amount = typeof value === 'number' ? value : 0;
                  return [formatCurrency(amount), trendLabel];
                }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              {trendType === 'net' && (
                <ReferenceLine y={0} stroke={TICK_COLOR} strokeDasharray="3 3" />
              )}
              <Bar dataKey={trendType} radius={[3, 3, 0, 0]} maxBarSize={40}>
                {trendData.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 支出内訳 円グラフ */}
      <div className="bg-white dark:bg-slate-800 mx-3 md:mx-4 mb-4 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">支出内訳</h2>
            {/* 月セレクタ */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrevPieMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[6.5rem] text-center tabular-nums">
                {pieYear}年{pieMonth}月
              </span>
              <button
                onClick={handleNextPieMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          {/* グループ切り替え */}
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
            {(['category', 'payment', 'account'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPieGroupMode(m)}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${
                  pieGroupMode === m
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {m === 'category' ? 'カテゴリ' : m === 'payment' ? '支払元' : '引落口座'}
              </button>
            ))}
          </div>
        </div>

        {!hasExpenseData ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
            この月の支出データはありません
          </div>
        ) : (
          <>
            {/* ドーナツ円グラフ
                [&_.recharts-sector]:outline-none でクリック時の青枠フォーカスリングを抑制 */}
            <div className="relative [&_.recharts-sector]:outline-none">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="name"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* wrapperStyle の zIndex でドーナツ中央ラベルより前面に表示 */}
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(typeof value === 'number' ? value : 0),
                      typeof name === 'string' ? name : '',
                    ]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    wrapperStyle={{ zIndex: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* ドーナツ中央ラベル（pointer-events-none でチャートへの操作を妨げない） */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">合計</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatCurrency(totalPieAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* 凡例リスト */}
            <div className="px-4 pb-5 space-y-2.5 overflow-hidden">
              {pieData.map((item, index) => {
                const pct = totalPieAmount > 0 ? (item.amount / totalPieAmount) * 100 : 0;
                const canNavigate = !item.id.startsWith('__');
                return (
                  <div key={index}>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate min-w-0">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 w-9 text-right tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100 flex-shrink-0 tabular-nums w-20 text-right">
                        {formatCurrency(item.amount)}
                      </span>
                      {canNavigate ? (
                        <button
                          onClick={() => handleLegendNavigate(item)}
                          className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="履歴を見る"
                        >
                          <ExternalLink size={13} />
                        </button>
                      ) : (
                        <span className="flex-shrink-0 w-[22px]" />
                      )}
                    </div>
                    <div className="ml-4 h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
