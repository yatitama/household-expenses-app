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
}

export const AssetCard = ({
  groupedAccounts,
  paymentMethods = [],
  onRecurringDetailClick,
  onCardUnsettledSheetOpen,
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
    <div className="flex flex-col overflow-y-auto h-full px-1 md:px-2 lg:px-3 space-y-2 md:space-y-3">
      {/* 口座グリッド */}
      <AccountGridSection accounts={allAccountsList} />

      {/* カードグリッド */}
      {linkedPaymentMethods.length > 0 && (
        <CardGridSection
          paymentMethods={linkedPaymentMethods}
          cardUnsettledList={allCardUnsettledList}
          onCardClick={onCardUnsettledSheetOpen || (() => {})}
        />
      )}

      {/* 定期支出グリッド */}
      <RecurringItemGridSection
        title="定期支出"
        items={allUpcomingExpense}
        onItemClick={onRecurringDetailClick || (() => {})}
      />

      {/* 定期収入グリッド */}
      <RecurringItemGridSection
        title="定期収入"
        items={allUpcomingIncome}
        onItemClick={onRecurringDetailClick || (() => {})}
      />
    </div>
  );
};
