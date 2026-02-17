import { useRef } from 'react';
import { getUpcomingRecurringPayments } from '../../utils/billingUtils';
import { AccountGridSection } from './AccountGridSection';
import { RecurringItemGridSection } from './RecurringItemGridSection';
import type { Account, RecurringPayment } from '../../types';

interface AssetCardProps {
  groupedAccounts: Record<string, Account[]>;
  onRecurringDetailClick?: (recurringPayment: RecurringPayment) => void;
  onAccountClick?: (account: Account) => void;
  onAddAccountClick?: () => void;
  onAddRecurringExpenseClick?: () => void;
  onAddRecurringIncomeClick?: () => void;
}

export const AssetCard = ({
  groupedAccounts,
  onRecurringDetailClick,
  onAccountClick,
  onAddAccountClick,
  onAddRecurringExpenseClick,
  onAddRecurringIncomeClick,
}: AssetCardProps) => {
  const allUpcomingRecurring = getUpcomingRecurringPayments(31);

  const accountsSectionRef = useRef<HTMLDivElement>(null);
  const expenseSectionRef = useRef<HTMLDivElement>(null);
  const incomeSectionRef = useRef<HTMLDivElement>(null);

  const allAccountsList = Object.entries(groupedAccounts).flatMap(([, memberAccounts]) => memberAccounts);
  const allUpcomingExpense = allUpcomingRecurring.filter((rp) => rp.type === 'expense');
  const allUpcomingIncome = allUpcomingRecurring.filter((rp) => rp.type === 'income');

  return (
    <div className="px-1 md:px-2 lg:px-3">
      {/* 口座セクション */}
      <div ref={accountsSectionRef} data-section-name="口座">
        <div
          className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
          style={{ top: 'max(0px, env(safe-area-inset-top))' }}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">口座</h3>
        </div>
        <div className="pt-2 pb-3 md:pb-4">
          <AccountGridSection accounts={allAccountsList} onAccountClick={onAccountClick} onAddClick={onAddAccountClick} />
        </div>
      </div>

      {/* 定期支出セクション */}
      <div ref={expenseSectionRef} data-section-name="定期支出">
        <div
          className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
          style={{ top: 'max(0px, env(safe-area-inset-top))' }}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">定期支出</h3>
        </div>
        <div className="pt-2 pb-3 md:pb-4">
          <RecurringItemGridSection
            title=""
            items={allUpcomingExpense}
            onItemClick={onRecurringDetailClick || (() => {})}
            onAddClick={onAddRecurringExpenseClick}
          />
        </div>
      </div>

      {/* 定期収入セクション */}
      <div ref={incomeSectionRef} data-section-name="定期収入">
        <div
          className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
          style={{ top: 'max(0px, env(safe-area-inset-top))' }}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">定期収入</h3>
        </div>
        <div className="pt-2 pb-3 md:pb-4">
          <RecurringItemGridSection
            title=""
            items={allUpcomingIncome}
            onItemClick={onRecurringDetailClick || (() => {})}
            onAddClick={onAddRecurringIncomeClick}
          />
        </div>
      </div>
    </div>
  );
};
