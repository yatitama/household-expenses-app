import { Pencil } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { categoryService, accountService, paymentMethodService } from '../../../services/storage';
import type { Transaction } from '../../../types';

interface CardUnsettledDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
}

export const CardUnsettledDetailModal = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
}: CardUnsettledDetailModalProps) => {
  if (!isOpen || !transaction) return null;

  const categories = categoryService.getAll();
  const category = categories.find((c) => c.id === transaction.categoryId);

  const accounts = accountService.getAll();
  const account = accounts.find((a) => a.id === transaction.accountId);

  const paymentMethods = paymentMethodService.getAll();
  const paymentMethod = transaction.paymentMethodId
    ? paymentMethods.find((pm) => pm.id === transaction.paymentMethodId)
    : undefined;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">明細詳細</h3>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* カテゴリ */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">カテゴリ</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${category?.color || '#6b7280'}20`,
                    color: category?.color || '#6b7280',
                  }}
                >
                  {getCategoryIcon(category?.icon || '', 12)}
                </div>
                {category?.name || 'その他'}
              </div>
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">金額</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(transaction.amount)}
              </div>
            </div>

            {/* 日付 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">日付</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                {transaction.date}
              </div>
            </div>

            {/* 口座 */}
            {account && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">口座</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: account.color || '#9ca3af' }}
                  />
                  {account.name}
                </div>
              </div>
            )}

            {/* 支払方法 */}
            {paymentMethod && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">支払方法</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {paymentMethod.name}
                </div>
              </div>
            )}

            {/* メモ */}
            {transaction.memo && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">メモ</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 break-words">
                  {transaction.memo}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-3 sm:p-4 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            閉じる
          </button>
          {onEdit && transaction && (
            <button
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Pencil size={16} />
              編集
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
