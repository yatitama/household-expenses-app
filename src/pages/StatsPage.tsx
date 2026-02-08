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
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">統計</h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="前月">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">{monthLabel}</span>
          <button onClick={handleNextMonth} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="翌月">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">収入</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(income)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">支出</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(expense)}</p>
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
