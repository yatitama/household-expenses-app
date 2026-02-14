import { formatCurrency, formatDate } from '../../../utils/formatters';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { categoryService } from '../../../services/storage';
import type { PaymentMethod, Transaction } from '../../../types';

interface CardUnsettledListModalProps {
  paymentMethod: PaymentMethod | null;
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

export const CardUnsettledListModal = ({
  paymentMethod,
  transactions,
  isOpen,
  onClose,
  onTransactionClick,
}: CardUnsettledListModalProps) => {
  if (!isOpen || !paymentMethod) return null;

  const categories = categoryService.getAll();
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  // グループ化（日付ごと）
  const groupedByDate = transactions.reduce(
    (acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    },
    {} as Record<string, Transaction[]>
  );

  // 日付でソート（新しい順）
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const total = transactions.reduce((sum, t) => {
    return sum + (t.type === 'expense' ? t.amount : -t.amount);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{paymentMethod.name}</h3>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                明細なし
              </p>
            ) : (
              sortedDates.map((date) => (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {formatDate(date)}
                    </h4>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {formatCurrency(
                        groupedByDate[date].reduce((sum, t) => {
                          return sum + (t.type === 'expense' ? t.amount : -t.amount);
                        }, 0)
                      )}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {groupedByDate[date].map((transaction) => {
                      const category = getCategory(transaction.categoryId);
                      return (
                        <button
                          key={transaction.id}
                          onClick={() => onTransactionClick?.(transaction)}
                          className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                            >
                              {getCategoryIcon(category?.icon || '', 12)}
                            </div>
                            <p className="truncate text-gray-900 dark:text-gray-100">{category?.name || 'その他'}</p>
                          </div>
                          <span className="text-gray-900 dark:text-gray-700 font-semibold flex-shrink-0">
                            {formatCurrency(transaction.amount)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-3 sm:p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          <div className="flex-1">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">合計</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(total)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
