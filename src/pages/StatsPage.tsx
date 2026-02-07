import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { MonthlyTrendChart } from '../components/charts/MonthlyTrendChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { MemberBarChart } from '../components/charts/MemberBarChart';
import { BudgetProgressBars } from '../components/charts/BudgetProgressBars';
import { getMonthlyTotal } from '../services/statsService';
import { formatCurrency } from '../utils/formatters';

export const StatsPage = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthLabel = format(currentDate, 'yyyy年M月');

  const handlePrevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1));

  const { income, expense } = useMemo(() => getMonthlyTotal(year, month), [year, month]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-400 dark:to-accent-400">
          統計
        </h2>
        <div className="flex items-center gap-2 premium-card px-3 py-2">
          <button onClick={handlePrevMonth} className="p-1.5 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors" aria-label="前月">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-brand-800 dark:text-brand-200 min-w-[100px] text-center">{monthLabel}</span>
          <button onClick={handleNextMonth} className="p-1.5 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors" aria-label="翌月">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="premium-card p-4 md:p-5 animate-scale-in">
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">収入</p>
          <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(income)}</p>
        </div>
        <div className="premium-card p-4 md:p-5 animate-scale-in">
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">支出</p>
          <p className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(expense)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        <div className="md:col-span-2">
          <MonthlyTrendChart />
        </div>
        <CategoryPieChart year={year} month={month} />
        <MemberBarChart year={year} month={month} />
        <div className="md:col-span-2">
          <BudgetProgressBars year={year} month={month} />
        </div>
      </div>
    </div>
  );
};
