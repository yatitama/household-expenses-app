import { X } from 'lucide-react';
import { formatCurrency, formatDate, formatMonth } from '../../../utils/formatters';
import { categoryService } from '../../../services/storage';
import type { Transaction, PaymentMethod } from '../../../types';

interface UnsettledCardDetailModalProps {
  paymentMethod: PaymentMethod;
  paymentMonth: string; // yyyy-MM
  transactions: Transaction[];
  total: number;
  isOpen: boolean;
  onClose: () => void;
}

export const UnsettledCardDetailModal = ({
  paymentMethod,
  paymentMonth,
  transactions,
  total,
  isOpen,
  onClose,
}: UnsettledCardDetailModalProps) => {
  if (!isOpen) return null;

  const categories = categoryService.getAll();
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

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
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {paymentMethod.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatMonth(paymentMonth)} 引き落とし予定（未精算）
                </p>
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
              {sorted.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">明細なし</p>
              ) : (
                sorted.map((t) => {
                  const category = categories.find((c) => c.id === t.categoryId);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs md:text-sm gap-2 p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-gray-900 dark:text-gray-100">
                          {t.memo || category?.name || 'その他'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(t.date)}
                        </p>
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold flex-shrink-0">
                        {formatCurrency(t.type === 'expense' ? t.amount : -t.amount)}
                      </span>
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
