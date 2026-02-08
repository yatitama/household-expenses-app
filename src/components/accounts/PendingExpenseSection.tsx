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
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">今月の支出予測</h3>
      </div>

      <div className="space-y-2">
        {totalCardPending > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-amber-800 dark:text-amber-200">カード請求</span>
            <span className="font-semibold text-amber-900 dark:text-amber-100">-{formatCurrency(totalCardPending)}</span>
          </div>
        )}

        {totalRecurringExpense > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-amber-800 dark:text-amber-200">定期支出</span>
            <span className="font-semibold text-amber-900 dark:text-amber-100">-{formatCurrency(totalRecurringExpense)}</span>
          </div>
        )}

        {totalRecurringIncome > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-amber-800 dark:text-amber-200">定期収入</span>
            <span className="font-semibold text-green-600 dark:text-green-400">+{formatCurrency(totalRecurringIncome)}</span>
          </div>
        )}

        {(totalCardPending > 0 || totalRecurringExpense > 0 || totalRecurringIncome > 0) && (
          <div className="border-t border-amber-200 dark:border-amber-800 pt-2 mt-2 flex justify-between items-center text-sm">
            <span className="font-semibold text-amber-900 dark:text-amber-100">実質合計</span>
            <span className={`font-bold ${netPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {netPending > 0 ? '-' : '+'}{formatCurrency(Math.abs(netPending))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
