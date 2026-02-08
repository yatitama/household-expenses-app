import { PlusCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { categoryService } from '../../services/storage';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { ACCOUNT_TYPE_ICONS } from './AccountIcons';
import { ACCOUNT_TYPE_LABELS } from './constants';
import { RecurringAndLinkedList } from './RecurringAndLinkedList';
import { RecentTransactions } from './RecentTransactions';
import type { Account, Member, RecurringPayment, PaymentMethod, LinkedPaymentMethod } from '../../types';

interface AccountCardProps {
  account: Account;
  member?: Member;
  pendingAmount: number;
  totalPendingData?: {
    cardPending: number;
    recurringExpense: number;
    recurringIncome: number;
    totalPending: number;
  };
  linkedPaymentMethodsData: LinkedPaymentMethod[];
  allPaymentMethods: PaymentMethod[];
  pendingByPM: Record<string, number>;
  recurringPayments: RecurringPayment[];
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
  onAddLinkedPM: () => void;
  onToggleLinkedPM: (lpm: LinkedPaymentMethod) => void;
  onViewPM: (pm: PaymentMethod) => void;
}

export const AccountCard = ({
  account, member, pendingAmount, totalPendingData, linkedPaymentMethodsData, allPaymentMethods, pendingByPM, recurringPayments,
  onAddTransaction, onAddRecurring,
  onEditRecurring, onToggleRecurring,
  onAddLinkedPM, onToggleLinkedPM,
  onViewPM,
}: AccountCardProps) => {
  const [isPendingDetailsOpen, setIsPendingDetailsOpen] = useState(false);
  const [isPaymentMethodDetailsOpen, setIsPaymentMethodDetailsOpen] = useState(false);
  const categories = categoryService.getAll();
  const getPaymentMethod = (id: string) => allPaymentMethods.find((pm) => pm.id === id);
  const getUnsettledAmount = (paymentMethodId: string) => pendingByPM[paymentMethodId] || 0;
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  return (
    <div
      data-account-id={account.id}
      className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border-2 border-transparent transition-all duration-200`}
    >

      {/* クイックアクションボタン */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={onAddTransaction}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-lg font-medium transition-colors text-sm"
          title="取引を追加"
        >
          <PlusCircle size={16} />
          <span>追加</span>
        </button>
        <button
          onClick={onAddRecurring}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm"
          title="定期支払を設定"
        >
          <span>📅</span>
          <span>定期</span>
        </button>
      </div>

      {/* 口座情報 */}
      <div className="flex gap-2.5">
        {/* 口座アイコン */}
        <div className="flex-shrink-0 self-start">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: account.color }}
          >
            {ACCOUNT_TYPE_ICONS[account.type]}
          </div>
        </div>

        {/* 右側コンテンツ */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* 口座名 */}
          <div className="flex items-center gap-2">
            <div className="text-left flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{account.name}</p>
            </div>
            {member?.icon && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: member.color }}
              >
                {getCategoryIcon(member.icon, 14)}
              </div>
            )}
          </div>

          {/* 銀行タイプと金額 */}
          <div className="flex justify-between items-center gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">{ACCOUNT_TYPE_LABELS[account.type]}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(account.balance)}</p>
          </div>

          {/* ペンディング詳細 */}
          {((totalPendingData && (totalPendingData.cardPending > 0 || totalPendingData.recurringExpense > 0 || totalPendingData.recurringIncome > 0)) || pendingAmount > 0) && (
            <div className="mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsPendingDetailsOpen(!isPendingDetailsOpen); }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium flex items-center gap-1"
                aria-label={isPendingDetailsOpen ? '予定額を非表示' : '予定額を表示'}
                aria-expanded={isPendingDetailsOpen}
              >
                {isPendingDetailsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                予定額を表示
              </button>
              {isPendingDetailsOpen && (
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-0.5 pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                  {totalPendingData ? (
                    <>
                      {(totalPendingData.cardPending > 0 || totalPendingData.recurringExpense > 0) && (
                        <p className="flex justify-between">
                          <span>使う予定:</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(totalPendingData.cardPending + totalPendingData.recurringExpense)}</span>
                        </p>
                      )}
                      {totalPendingData.recurringIncome > 0 && (
                        <p className="flex justify-between">
                          <span>入る予定:</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">+{formatCurrency(totalPendingData.recurringIncome)}</span>
                        </p>
                      )}
                      <p className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-600">
                        <span>実質残高:</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(account.balance - totalPendingData.totalPending)}</span>
                      </p>
                    </>
                  ) : pendingAmount > 0 ? (
                    <p className="flex justify-between">
                      <span>引落後:</span>
                      <span className="font-bold">{formatCurrency(account.balance - pendingAmount)}</span>
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* 詳細セクション */}
      {(recurringPayments.length > 0 || linkedPaymentMethodsData.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsPaymentMethodDetailsOpen(!isPaymentMethodDetailsOpen)}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1 mb-3"
            aria-label={isPaymentMethodDetailsOpen ? '支払い方法・定期支払を非表示' : '支払い方法・定期支払を表示'}
            aria-expanded={isPaymentMethodDetailsOpen}
          >
            {isPaymentMethodDetailsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            支払い方法・定期支払 ({recurringPayments.length + linkedPaymentMethodsData.length})
          </button>

          {isPaymentMethodDetailsOpen && (
            <div className="space-y-2">
              <RecurringAndLinkedList
                recurringItems={recurringPayments}
                linkedItems={linkedPaymentMethodsData}
                onAddRecurring={onAddRecurring}
                onEditRecurring={onEditRecurring}
                onToggleRecurring={onToggleRecurring}
                onAddLinked={onAddLinkedPM}
                onToggleLinked={onToggleLinkedPM}
                onViewPM={onViewPM}
                getCategory={getCategory}
                getPaymentMethod={getPaymentMethod}
                getUnsettledAmount={getUnsettledAmount}
              />
            </div>
          )}
        </div>
      )}

      {/* 最近の取引 */}
      <div className="mt-4">
        <RecentTransactions accountId={account.id} />
      </div>
    </div>
  );
};
