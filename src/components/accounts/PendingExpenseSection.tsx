import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PendingExpenseSectionProps {
  totalCardPending: number;
  totalRecurringExpense: number;
  totalRecurringIncome: number;
}

export const PendingExpenseSection = ({
  totalCardPending,
  totalRecurringExpense,
  totalRecurringIncome,
}: PendingExpenseSectionProps) => {
  const totalPending = totalCardPending + totalRecurringExpense;
  const netPending = totalPending - totalRecurringIncome;

  // 表示すべきペンディングがない場合は表示しない
  if (totalCardPending === 0 && totalRecurringExpense === 0 && totalRecurringIncome === 0) {
    return null;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900/20 rounded-lg md:rounded-xl p-3 md:p-4 dark:border-gray-800">
      <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
        <AlertCircle size={16} className="md:w-4.5 md:h-4.5 text-gray-700 dark:text-gray-500 flex-shrink-0" />
        <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-200">今月の支出予測</h3>
      </div>

      <div className="space-y-1.5 md:space-y-2">
        {totalCardPending > 0 && (
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span className="text-gray-800 dark:text-gray-300">カード請求</span>
            <span className="font-semibold text-gray-900 dark:text-gray-200 font-mono text-right w-28">-{formatCurrency(totalCardPending)}</span>
          </div>
        )}

        {totalRecurringExpense > 0 && (
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span className="text-gray-800 dark:text-gray-300">定期支出</span>
            <span className="font-semibold text-gray-900 dark:text-gray-200 font-mono text-right w-28">-{formatCurrency(totalRecurringExpense)}</span>
          </div>
        )}

        {totalRecurringIncome > 0 && (
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span className="text-gray-800 dark:text-gray-300">定期収入</span>
            <span className="font-semibold text-gray-700 dark:text-gray-600 font-mono text-right w-28">+{formatCurrency(totalRecurringIncome)}</span>
          </div>
        )}

        {(totalCardPending > 0 || totalRecurringExpense > 0 || totalRecurringIncome > 0) && (
          <div className="border-t dark:border-gray-800 pt-1.5 md:pt-2 mt-1.5 md:mt-2 flex justify-between items-center text-xs md:text-sm">
            <span className="font-semibold text-gray-900 dark:text-gray-200">実質合計</span>
            <span className={`font-bold font-mono text-right w-28 ${netPending > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
              {netPending > 0 ? '-' : '+'}{formatCurrency(Math.abs(netPending))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
