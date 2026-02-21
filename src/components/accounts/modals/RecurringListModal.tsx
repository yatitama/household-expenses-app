import { X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { getEffectiveRecurringAmount } from '../../../utils/savingsUtils';
import type { RecurringPayment } from '../../../types';

interface RecurringListModalProps {
  title: string;
  items: RecurringPayment[];
  total: number;
  month: string; // yyyy-MM
  isOpen: boolean;
  onClose: () => void;
  onItemClick: (item: RecurringPayment) => void;
}

export const RecurringListModal = ({
  title,
  items,
  total,
  month,
  isOpen,
  onClose,
  onItemClick,
}: RecurringListModalProps) => {
  if (!isOpen) return null;

  const getPeriodLabel = (item: RecurringPayment) => {
    const { periodType, periodValue } = item;
    if (periodType === 'months') {
      return periodValue === 1 ? '毎月' : `${periodValue}ヶ月ごと`;
    }
    return periodValue === 1 ? '毎日' : `${periodValue}日ごと`;
  };

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
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
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
              {items.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">明細なし</p>
              ) : (
                items.map((item) => {
                  const effectiveAmount = getEffectiveRecurringAmount(item, month);
                  const hasOverride = (item.monthlyOverrides ?? {})[month] !== undefined;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-gray-900 dark:text-gray-100">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{getPeriodLabel(item)}</p>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 font-semibold flex-shrink-0">
                        <p>{formatCurrency(effectiveAmount)}</p>
                        {hasOverride && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-through">
                            {formatCurrency(item.amount)}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
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
