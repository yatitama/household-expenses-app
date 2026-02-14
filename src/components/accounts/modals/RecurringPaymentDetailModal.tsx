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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">詳細</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="閉じる"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-4">
          {/* 名前とカテゴリ */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${category?.color || '#6b7280'}20`,
                color: category?.color || '#6b7280',
              }}
            >
              {getCategoryIcon(category?.icon || '', 16)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {typeLabel} • {category?.name}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {recurringPayment.name}
              </p>
            </div>
          </div>

          {/* 金額 */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">金額</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(recurringPayment.amount)}
            </p>
          </div>

          {/* 周期 */}
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">周期</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {getFrequencyLabel()}
            </p>
          </div>

          {/* メモ */}
          {recurringPayment.memo && (
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">メモ</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                {recurringPayment.memo}
              </p>
            </div>
          )}

          {/* ステータス */}
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ステータス</p>
            <p className="text-sm font-medium">
              {recurringPayment.isActive ? (
                <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                  有効
                </span>
              ) : (
                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded text-xs">
                  無効
                </span>
              )}
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
