import { getUnsettledTransactions, getUpcomingRecurringPayments } from '../../utils/billingUtils';
import { AccountGridSection } from './AccountGridSection';
import { CardGridSection } from './CardGridSection';
import { RecurringItemGridSection } from './RecurringItemGridSection';
import type { PaymentMethod, Account, Transaction, RecurringPayment } from '../../types';

interface CardUnsettledInfo {
  paymentMethod: PaymentMethod;
  unsettledAmount: number;
  unsettledTransactions: Transaction[];
}

interface AssetCardProps {
  groupedAccounts: Record<string, Account[]>;
  paymentMethods?: PaymentMethod[];
  onRecurringDetailClick?: (recurringPayment: RecurringPayment) => void;
  onCardUnsettledSheetOpen?: (paymentMethod: PaymentMethod, transactions: Transaction[]) => void;
  onAddAccountClick?: () => void;
  onAddCardClick?: () => void;
  onAddRecurringExpenseClick?: () => void;
  onAddRecurringIncomeClick?: () => void;
}

export const AssetCard = ({
  groupedAccounts,
  paymentMethods = [],
  onRecurringDetailClick,
  onCardUnsettledSheetOpen,
  onAddAccountClick,
  onAddCardClick,
  onAddRecurringExpenseClick,
  onAddRecurringIncomeClick,
}: AssetCardProps) => {
  const allUnsettledTransactions = getUnsettledTransactions();
  const allUpcomingRecurring = getUpcomingRecurringPayments(31);

  // メンバーごとのアカウント取得
  const allAccountsList = Object.entries(groupedAccounts).flatMap(([, memberAccounts]) => memberAccounts);

  // 紐づけされたすべてのカード
  const linkedPaymentMethods = paymentMethods.filter((pm) => pm.linkedAccountId);

  // カード未精算情報
  const allCardUnsettledList: CardUnsettledInfo[] = linkedPaymentMethods.map((pm) => {
    const pmUnsettled = allUnsettledTransactions.filter((t) => t.paymentMethodId === pm.id);
    const amount = pmUnsettled.reduce((sum: number, t: Transaction) => {
      return sum + (t.type === 'expense' ? t.amount : -t.amount);
    }, 0);
    return {
      paymentMethod: pm,
      unsettledAmount: amount,
      unsettledTransactions: pmUnsettled,
    };
  });

  // すべての定期支出・収入
  const allUpcomingExpense = allUpcomingRecurring.filter((rp) => rp.type === 'expense');
  const allUpcomingIncome = allUpcomingRecurring.filter((rp) => rp.type === 'income');

  return (
    <div className="px-1 md:px-2 lg:px-3">
      {/* 口座セクション */}
      <div
        className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700 mt-2 md:mt-3"
        style={{ top: 'max(0px, env(safe-area-inset-top))' }}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">口座</h3>
      </div>
      <div className="pt-2 pb-3 md:pb-4">
        <AccountGridSection accounts={allAccountsList} onAddClick={onAddAccountClick} />
      </div>

      {/* カードセクション */}
      {linkedPaymentMethods.length > 0 && (
        <>
          <div
            className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
            style={{ top: 'calc(max(0px, env(safe-area-inset-top)) + 40px)' }}
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">カード</h3>
          </div>
          <div className="pt-2 pb-3 md:pb-4">
            <CardGridSection
              paymentMethods={linkedPaymentMethods}
              cardUnsettledList={allCardUnsettledList}
              onCardClick={onCardUnsettledSheetOpen || (() => {})}
              onAddClick={onAddCardClick}
            />
          </div>
        </>
      )}

      {/* 定期支出セクション */}
      <div
        className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
        style={{ top: 'calc(max(0px, env(safe-area-inset-top)) + 40px)' }}
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

      {/* 定期収入セクション */}
      <div
        className="sticky bg-white dark:bg-slate-900 z-10 p-2 border-b dark:border-gray-700"
        style={{ top: 'calc(max(0px, env(safe-area-inset-top)) + 40px)' }}
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
  );
};
