import { X, RefreshCw } from 'lucide-react';
import { formatCurrency, formatMonth } from '../../../utils/formatters';
import { getEffectiveRecurringAmount } from '../../../utils/savingsUtils';
import type { RecurringPayment } from '../../../types';

interface IndefiniteRecurringDetailModalProps {
  items: RecurringPayment[];
  month: string; // yyyy-MM
  isOpen: boolean;
  onClose: () => void;
}

const getPeriodLabel = (item: RecurringPayment): string => {
  if (item.periodType === 'months') {
    return item.periodValue === 1 ? '毎月' : `毎${item.periodValue}ヶ月`;
  }
  return item.periodValue === 1 ? '毎日' : `毎${item.periodValue}日`;
};

export const IndefiniteRecurringDetailModal = ({
  items,
  month,
  isOpen,
  onClose,
}: IndefiniteRecurringDetailModalProps) => {
  if (!isOpen) return null;

  const total = items.reduce((sum, rp) => sum + getEffectiveRecurringAmount(rp, month), 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md sm:rounded-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* ヘッダー */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-3 sm:p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  <RefreshCw size={14} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                    定期支出（無期限）
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatMonth(month)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 明細リスト */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-3 sm:p-4">
              {items.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">明細なし</p>
              ) : (
                items.map((item) => {
                  const effectiveAmount = getEffectiveRecurringAmount(item, month);
                  const hasOverride = (item.monthlyOverrides ?? {})[month] !== undefined;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs md:text-sm gap-2 p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-gray-900 dark:text-gray-100">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <RefreshCw size={10} />
                          {getPeriodLabel(item)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-gray-900 dark:text-gray-100 font-semibold">
                          {formatCurrency(effectiveAmount)}
                        </span>
                        {hasOverride && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                            {formatCurrency(item.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-3 sm:p-4 text-right">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">合計</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  );
};
