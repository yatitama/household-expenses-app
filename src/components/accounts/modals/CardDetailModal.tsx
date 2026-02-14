import { Pencil } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { memberService, accountService } from '../../../services/storage';
import { PM_TYPE_LABELS, BILLING_TYPE_LABELS } from '../constants';
import { PM_TYPE_ICONS } from '../AccountIcons';
import type { PaymentMethod } from '../../../types';

interface CardDetailModalProps {
  paymentMethod: PaymentMethod | null;
  pendingAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (paymentMethod: PaymentMethod) => void;
}

export const CardDetailModal = ({
  paymentMethod,
  pendingAmount,
  isOpen,
  onClose,
  onEdit,
}: CardDetailModalProps) => {
  if (!isOpen || !paymentMethod) return null;

  const members = memberService.getAll();
  const member = members.find((m) => m.id === paymentMethod.memberId);
  const linkedAccount = accountService.getAll().find((a) => a.id === paymentMethod.linkedAccountId);

  const getBillingInfo = () => {
    if (paymentMethod.billingType === 'immediate') {
      return `請求タイプ: ${BILLING_TYPE_LABELS[paymentMethod.billingType]}`;
    } else {
      const closingDay = paymentMethod.closingDay || 15;
      const paymentDay = paymentMethod.paymentDay || 10;
      return `締日: 毎月${closingDay}日 引き落とし日: ${paymentDay}日 引き落とし先: ${linkedAccount?.name || 'その他'}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">カード詳細</h3>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* カード名とメンバー・タイプ情報 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                カード名
              </label>
              <div className="w-full">
                <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {paymentMethod.name}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span>{member?.name || 'その他'}</span>
                  <span className="flex items-center gap-1">
                    {PM_TYPE_ICONS[paymentMethod.type]}
                    {PM_TYPE_LABELS[paymentMethod.type]}
                  </span>
                </div>
              </div>
            </div>

            {/* 未精算金額 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                未精算金額
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(pendingAmount)}
              </div>
            </div>

            {/* 請求情報 */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                請求情報
              </label>
              <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                <div className="mb-1">{getBillingInfo()}</div>
                {paymentMethod.billingType === 'monthly' && paymentMethod.paymentMonthOffset && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    支払い月オフセット: {paymentMethod.paymentMonthOffset}ヶ月
                  </div>
                )}
              </div>
            </div>

            {/* リンク先口座 */}
            {linkedAccount && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                  リンク先口座
                </label>
                <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {linkedAccount.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-3 sm:p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            閉じる
          </button>
          {onEdit && paymentMethod && (
            <button
              onClick={() => {
                onEdit(paymentMethod);
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
