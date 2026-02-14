import { X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { categoryService } from '../../../services/storage';
import type { RecurringPayment } from '../../../types';

interface RecurringPaymentDetailModalProps {
  recurringPayment: RecurringPayment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecurringPaymentDetailModal = ({
  recurringPayment,
  isOpen,
  onClose,
}: RecurringPaymentDetailModalProps) => {
  if (!isOpen || !recurringPayment) return null;

  const categories = categoryService.getAll();
  const category = categories.find((c) => c.id === recurringPayment.categoryId);

  const getFrequencyLabel = () => {
    if (recurringPayment.frequency === 'monthly') {
      return `毎月${recurringPayment.dayOfMonth}日`;
    } else {
      return `毎年${recurringPayment.monthOfYear}月${recurringPayment.dayOfMonth}日`;
    }
  };

  const typeLabel = recurringPayment.type === 'income' ? '収入' : '支出';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">定期取引詳細</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg"
              aria-label="閉じる"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* 名前 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-gray-100">
                {recurringPayment.name}
              </div>
            </div>

            {/* タイプとカテゴリ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">タイプ</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {typeLabel}
                </div>
              </div>
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
                  {category?.name}
                </div>
              </div>
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">金額</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(recurringPayment.amount)}
              </div>
            </div>

            {/* 周期 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">周期</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                {getFrequencyLabel()}
              </div>
            </div>

            {/* メモ */}
            {recurringPayment.memo && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">メモ</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 break-words">
                  {recurringPayment.memo}
                </div>
              </div>
            )}

            {/* ステータス */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">ステータス</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm">
                {recurringPayment.isActive ? (
                  <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                    有効
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">
                    無効
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-3 sm:p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
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
