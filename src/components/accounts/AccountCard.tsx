import { PlusCircle } from 'lucide-react';
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
  account, member, linkedPaymentMethodsData, allPaymentMethods, pendingByPM, recurringPayments,
  onAddTransaction, onAddRecurring,
  onEditRecurring, onToggleRecurring,
  onAddLinkedPM, onToggleLinkedPM,
  onViewPM,
}: AccountCardProps) => {
  const categories = categoryService.getAll();
  const getPaymentMethod = (id: string) => allPaymentMethods.find((pm) => pm.id === id);
  const getUnsettledAmount = (paymentMethodId: string) => pendingByPM[paymentMethodId] || 0;
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  return (
    <div
      data-account-id={account.id}
      className={`bg-white dark:bg-slate-800 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border-2 border-transparent transition-all duration-200`}
    >

      {/* クイックアクションボタン */}
      <div className="flex gap-2 mb-2 md:mb-3">
        <button
          onClick={onAddTransaction}
          className="flex-1 flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-lg font-medium transition-colors text-xs md:text-sm"
          title="取引を追加"
        >
          <PlusCircle size={16} />
          <span>追加</span>
        </button>
        <button
          onClick={onAddRecurring}
          className="flex-1 flex items-center justify-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-xs md:text-sm"
          title="定期支払を設定"
        >
          <span>📅</span>
          <span>定期</span>
        </button>
      </div>

      {/* 口座情報 */}
      <div className="flex gap-2 md:gap-2.5">
        {/* 口座アイコン */}
        <div className="flex-shrink-0 self-start">
          <div
            className="w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: account.color }}
          >
            {ACCOUNT_TYPE_ICONS[account.type]}
          </div>
        </div>

        {/* 右側コンテンツ */}
        <div className="flex-1 min-w-0 space-y-0.5 md:space-y-1">
          {/* 口座名 */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{account.name}</p>
            </div>
            {member?.icon && (
              <div
                className="w-5 md:w-6 h-5 md:h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: member.color }}
              >
                {getCategoryIcon(member.icon, 14)}
              </div>
            )}
          </div>

          {/* 銀行タイプと金額 */}
          <div className="flex justify-between items-center gap-2">
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{ACCOUNT_TYPE_LABELS[account.type]}</p>
            <p className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(account.balance)}</p>
          </div>

        </div>
      </div>
      {/* 定期取引・支払い手段セクション */}
      {(recurringPayments.length > 0 || linkedPaymentMethodsData.length > 0) && (
        <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-200 dark:border-gray-700">
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

      {/* 最近の取引 */}
      <div className="mt-2 md:mt-4">
        <RecentTransactions accountId={account.id} />
      </div>
    </div>
  );
};
