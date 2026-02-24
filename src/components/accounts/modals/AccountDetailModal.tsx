import { useState } from 'react';
import { Pencil, X, CreditCard, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../../utils/formatters';
import { memberService } from '../../../services/storage';
import { UnsettledCardDetailModal } from './UnsettledCardDetailModal';
import type { Account, PaymentMethod, RecurringPayment, Transaction } from '../../../types';
import type { AccountScheduleGroup, RecurringItem } from '../../../utils/scheduledPaymentsUtils';

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
  scheduleGroup?: AccountScheduleGroup | null;
  onClose: () => void;
  onEdit?: (account: Account) => void;
}

export const AccountDetailModal = ({
  account,
  isOpen,
  scheduleGroup,
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

              {/* 引き落とし予定 */}
              {scheduleGroup && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                    引き落とし予定
                  </label>
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg px-3 py-2 space-y-3">
                    {scheduleGroup.entries.map((entry) =>
                      entry.kind === 'card' ? (
                        <div key={entry.monthGroup.month}>
                          {entry.monthGroup.paymentDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {format(entry.monthGroup.paymentDate, 'M月d日')}引き落とし
                            </p>
                          )}
                          <div className="space-y-0.5">
                            {entry.monthGroup.cards.map((cardEntry) => (
                              <button
                                key={cardEntry.pm.id}
                                onClick={() =>
                                  setUnsettledCardModal({
                                    pm: cardEntry.pm,
                                    paymentMonth: entry.monthGroup.month,
                                    transactions: cardEntry.transactions,
                                    recurringItems: cardEntry.recurringItems,
                                    total: cardEntry.total,
                                  })
                                }
                                className="w-full flex items-center justify-between text-xs px-1 py-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors"
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <CreditCard
                                    size={10}
                                    className="flex-shrink-0"
                                    style={{ color: cardEntry.pm.color }}
                                  />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {cardEntry.pm.name}
                                  </span>
                                  {cardEntry.recurringItems.length > 0 && (
                                    <RefreshCw size={9} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                                  )}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium ml-2 flex-shrink-0">
                                  {formatCurrency(cardEntry.total)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div key={entry.dateGroup.key}>
                          {entry.dateGroup.date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {format(entry.dateGroup.date, 'M月d日')}引き落とし
                            </p>
                          )}
                          <div className="space-y-0.5">
                            {entry.dateGroup.items.map(({ rp, amount }: { rp: RecurringPayment; amount: number }) => (
                              <div
                                key={rp.id}
                                className="w-full flex items-center justify-between text-xs px-1 py-1"
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <RefreshCw size={10} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">{rp.name}</span>
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium ml-2 flex-shrink-0">
                                  {formatCurrency(amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                    <div className="border-t dark:border-gray-600 pt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">合計</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        -{formatCurrency(scheduleGroup.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
