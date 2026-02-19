import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { categoryService, accountService, paymentMethodService } from '../../../services/storage';
import type { RecurringPayment } from '../../../types';

interface RecurringDetailModalProps {
  payment: RecurringPayment | null;
  occurrenceDate: string | null;
  isOpen: boolean;
  onClose: () => void;
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

export const RecurringDetailModal = ({
  payment,
  occurrenceDate,
  isOpen,
  onClose,
}: RecurringDetailModalProps) => {
  if (!isOpen || !payment) return null;

  const categories = categoryService.getAll();
  const category = payment.categoryId
    ? categories.find((c) => c.id === payment.categoryId)
    : undefined;

  const accounts = accountService.getAll();
  const account = payment.accountId
    ? accounts.find((a) => a.id === payment.accountId)
    : undefined;

  const paymentMethods = paymentMethodService.getAll();
  const paymentMethod = payment.paymentMethodId
    ? paymentMethods.find((pm) => pm.id === payment.paymentMethodId)
    : undefined;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCw size={16} className="text-blue-500 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">定期取引</h3>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* 名称 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">名称</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                {payment.name}
              </div>
            </div>

            {/* 種別 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">種別</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm">
                <span className={payment.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {payment.type === 'income' ? '収入' : '支出'}
                </span>
              </div>
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">金額</label>
              <div className={`w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-lg font-bold ${
                payment.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {payment.type === 'income' ? '+' : '-'}{formatCurrency(payment.amount)}
              </div>
            </div>

            {/* 発生日 */}
            {occurrenceDate && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">発生日</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {occurrenceDate}
                </div>
              </div>
            )}

            {/* 繰り返し */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">繰り返し</label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <RefreshCw size={12} className="text-blue-500 flex-shrink-0" />
                {getPeriodLabel(payment)}
              </div>
            </div>

            {/* カテゴリ */}
            {category && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">カテゴリ</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                    }}
                  >
                    {getCategoryIcon(category.icon, 12)}
                  </div>
                  {category.name}
                </div>
              </div>
            )}

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

            {/* 開始日 */}
            {payment.startDate && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">開始日</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {payment.startDate}
                </div>
              </div>
            )}

            {/* 終了日 */}
            {payment.endDate && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">終了日</label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {payment.endDate}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-b-xl">
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
