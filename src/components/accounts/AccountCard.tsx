import { getCategoryIcon } from '../../utils/categoryIcons';
import { ACCOUNT_TYPE_ICONS } from './AccountIcons';
import { ACCOUNT_TYPE_LABELS } from './constants';
import { AccountBalanceSchedule } from './AccountBalanceSchedule';
import type { Account, Member, RecurringPayment, PaymentMethod } from '../../types';

interface AccountCardProps {
  account: Account;
  member?: Member;
  allPaymentMethods: PaymentMethod[];
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
}

export const AccountCard = ({
  account, member, allPaymentMethods,
  onEditRecurring, onToggleRecurring,
}: AccountCardProps) => {

  return (
    <div
      data-account-id={account.id}
      className={`bg-white dark:bg-slate-800 rounded-lg md:rounded-xl p-3 md:p-4  transition-all duration-200`}
    >
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

          {/* 銀行タイプ */}
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{ACCOUNT_TYPE_LABELS[account.type]}</p>

        </div>
      </div>

      {/* 残高・引き落とし予定・振り込み予定セクション */}
      <div className="mt-3 md:mt-4">
        <AccountBalanceSchedule
          account={account}
          paymentMethods={allPaymentMethods}
          onEditRecurring={onEditRecurring}
          onToggleRecurring={onToggleRecurring}
        />
      </div>
    </div>
  );
};
