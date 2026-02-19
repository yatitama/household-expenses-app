import { X, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { paymentMethodService } from '../../../services/storage';
import type { Category, Transaction, RecurringPayment } from '../../../types';

interface CategoryTransactionsModalProps {
  category: Category | undefined;
  transactions: Transaction[];
  recurringPayments?: RecurringPayment[];
  isOpen: boolean;
  onClose: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
  onRecurringClick?: (payment: RecurringPayment) => void;
}

const getPeriodLabel = (payment: RecurringPayment): string => {
  if (payment.periodType === 'months') {
    return payment.periodValue === 1 ? '毎月' : `毎${payment.periodValue}ヶ月`;
  }
  if (payment.periodType === 'days') {
    return payment.periodValue === 1 ? '毎日' : `毎${payment.periodValue}日`;
  }
  return '';
};

export const CategoryTransactionsModal = ({
  category,
  transactions,
  recurringPayments = [],
  isOpen,
  onClose,
  onTransactionClick,
  onRecurringClick,
}: CategoryTransactionsModalProps) => {
  if (!isOpen) return null;

  const paymentMethods = paymentMethodService.getAll();

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  const transactionTotal = transactions.reduce((sum, t) => {
    return sum + (t.type === 'expense' ? t.amount : -t.amount);
  }, 0);

  const recurringTotal = recurringPayments.reduce((sum, rp) => {
    return sum + (rp.type === 'expense' ? rp.amount : -rp.amount);
  }, 0);

  const total = transactionTotal + recurringTotal;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-3 sm:p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${category?.color || '#6b7280'}20`,
                    color: category?.color || '#6b7280',
                  }}
                >
                  {getCategoryIcon(category?.icon || '', 14)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  {category?.name || 'その他'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 明細リスト */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-3 sm:p-4">
              {sorted.length === 0 && recurringPayments.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">明細なし</p>
              ) : (
                <>
                  {sorted.map((transaction) => {
                    const pm = paymentMethods.find((p) => p.id === transaction.paymentMethodId);
                    return (
                      <button
                        key={transaction.id}
                        onClick={() => onTransactionClick?.(transaction)}
                        className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-gray-900 dark:text-gray-100">
                            {transaction.memo || category?.name || 'その他'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(transaction.date)}
                            {pm && (
                              <span className="ml-1.5 text-gray-400 dark:text-gray-500">· {pm.name}</span>
                            )}
                          </p>
                        </div>
                        <span className="text-gray-900 dark:text-gray-100 font-semibold flex-shrink-0">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </button>
                    );
                  })}

                  {recurringPayments.map((rp) => (
                    <button
                      key={rp.id}
                      onClick={() => onRecurringClick?.(rp)}
                      className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-gray-900 dark:text-gray-100">{rp.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <RefreshCw size={10} />
                          {getPeriodLabel(rp)}
                        </p>
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold flex-shrink-0">
                        {formatCurrency(rp.amount)}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          <div className="p-3 sm:p-4 border-b dark:border-gray-700 text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">合計</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="p-3 sm:p-4">
            <button
              onClick={onClose}
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
