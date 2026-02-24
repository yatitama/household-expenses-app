import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { memberService } from '../../../services/storage';
import { UnsettledCardDetailModal } from './UnsettledCardDetailModal';
import type { Account, PaymentMethod, Transaction } from '../../../types';
import type { RecurringItem } from '../../../utils/scheduledPaymentsUtils';

interface UnsettledCardModalData {
  pm: PaymentMethod;
  paymentMonth: string;
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  total: number;
}

interface AccountDetailModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (account: Account) => void;
}

export const AccountDetailModal = ({
  account,
  isOpen,
  onClose,
  onEdit,
}: AccountDetailModalProps) => {
  const [unsettledCardModal, setUnsettledCardModal] = useState<UnsettledCardModalData | null>(null);

  if (!isOpen || !account) return null;

  const members = memberService.getAll();
  const member = members.find((m) => m.id === account.memberId);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-800 w-full max-w-md sm:rounded-xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{account.name}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{member?.name || 'その他'}</span>
              </div>
              {onEdit && account && (
                <button
                  onClick={() => { onEdit(account); onClose(); }}
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
              {/* 残高 */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                  残高
                </label>
                <div className="w-full bg-gray-50 dark:bg-slate-700 rounded-lg px-3 py-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(account.balance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {unsettledCardModal && (
        <UnsettledCardDetailModal
          paymentMethod={unsettledCardModal.pm}
          paymentMonth={unsettledCardModal.paymentMonth}
          transactions={unsettledCardModal.transactions}
          recurringItems={unsettledCardModal.recurringItems}
          total={unsettledCardModal.total}
          isOpen
          onClose={() => setUnsettledCardModal(null)}
        />
      )}
    </>
  );
};
