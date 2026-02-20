import { Pencil, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import type { RecurringPayment } from '../../../types';

interface RecurringPaymentDetailModalProps {
  recurringPayment: RecurringPayment | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (recurringPayment: RecurringPayment) => void;
}

export const RecurringPaymentDetailModal = ({
  recurringPayment,
  isOpen,
  onClose,
  onEdit,
}: RecurringPaymentDetailModalProps) => {
  if (!isOpen || !recurringPayment) return null;

  const getPeriodLabel = () => {
    const { periodType, periodValue } = recurringPayment;
    if (periodType === 'months') {
      return periodValue === 1 ? '毎月' : `${periodValue}ヶ月ごと`;
    }
    return periodValue === 1 ? '毎日' : `${periodValue}日ごと`;
  };

  const typeLabel = recurringPayment.type === 'income' ? '収入' : '支出';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">定期取引詳細</h3>
            {onEdit && recurringPayment && (
              <button
                onClick={() => { onEdit(recurringPayment); onClose(); }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 dark:text-gray-400"
                aria-label="編集"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="space-y-4 sm:space-y-5">
            {/* 名前 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名前</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-gray-100">
                {recurringPayment.name}
              </div>
            </div>

            {/* タイプ */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">タイプ</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                {typeLabel}
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
                {getPeriodLabel()}
              </div>
            </div>

            {/* 期間 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">期間</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                {recurringPayment.startDate || recurringPayment.createdAt.split('T')[0]}
                {recurringPayment.endDate ? ` 〜 ${recurringPayment.endDate}` : ' 〜 無期限'}
              </div>
            </div>

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

      </div>
    </div>
  );
};
