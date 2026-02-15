import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getUnsettledTransactions, getUpcomingRecurringPayments } from '../../utils/billingUtils';
import { ScheduleSection } from './ScheduleSection';
import { IncomeSection } from './IncomeSection';
import type { Account, PaymentMethod, RecurringPayment, Transaction } from '../../types';

interface AccountBalanceScheduleProps {
  account: Account;
  paymentMethods: PaymentMethod[];
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
}

export const AccountBalanceSchedule = ({
  account,
  paymentMethods,
  onEditRecurring,
  onToggleRecurring,
}: AccountBalanceScheduleProps) => {
  const navigate = useNavigate();

  // Get payment methods linked to this account (via linkedAccountId)
  const linkedPMs = paymentMethods.filter((pm) => pm.linkedAccountId === account.id);

  // Get unsettled transactions for all linked payment methods
  const allUnsettledTransactions = getUnsettledTransactions()
    .filter((t) => linkedPMs.some((pm) => pm.id === t.paymentMethodId));

  // Build card-by-card unsettled info (including cards with 0 unsettled)
  interface CardUnsettledInfo {
    paymentMethod: PaymentMethod;
    unsettledAmount: number;
    unsettledTransactions: Transaction[];
  }

  const cardUnsettledList: CardUnsettledInfo[] = linkedPMs.map((pm) => {
    const pmUnsettled = allUnsettledTransactions.filter((t) => t.paymentMethodId === pm.id);
    const amount = pmUnsettled.reduce((sum, t) => {
      return sum + (t.type === 'expense' ? t.amount : -t.amount);
    }, 0);
    return {
      paymentMethod: pm,
      unsettledAmount: amount,
      unsettledTransactions: pmUnsettled,
    };
  });

  // Get upcoming recurring payments for this account
  const upcomingRecurring = getUpcomingRecurringPayments(31)
    .filter((rp) => rp.accountId === account.id);

  // Separate into expense and income
  const upcomingExpense = upcomingRecurring.filter((rp) => rp.type === 'expense');
  const upcomingIncome = upcomingRecurring.filter((rp) => rp.type === 'income');

  // Calculate pending amounts
  const totalCardPending = cardUnsettledList.reduce((sum, card) => sum + card.unsettledAmount, 0);
  const totalRecurringExpense = upcomingExpense.reduce((sum, rp) => sum + rp.amount, 0);
  const totalRecurringIncome = upcomingIncome.reduce((sum, rp) => sum + rp.amount, 0);

  const handleViewUnsettled = (paymentMethodId: string) => {
    // Navigate to transactions page with unsettled filter for specific payment method
    navigate('/transactions', {
      state: {
        accountId: account.id,
        paymentMethodIds: [paymentMethodId],
        filterType: 'unsettled',
      },
    });
  };

  return (
    <div className="space-y-3">
      {/* 残高セクション */}
      <div className="rounded-lg p-3 md:p-4" style={{
        borderColor: 'var(--theme-primary)',
      }}>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
          口座残高
        </p>
        <p className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
          {formatCurrency(account.balance)}
        </p>
      </div>

      {/* 引き落とし予定セクション */}
      <ScheduleSection
        cardUnsettledList={cardUnsettledList}
        totalCardPending={totalCardPending}
        upcomingExpense={upcomingExpense}
        totalRecurringExpense={totalRecurringExpense}
        onViewUnsettled={handleViewUnsettled}
        onEditRecurring={onEditRecurring}
        onToggleRecurring={onToggleRecurring}
      />

      {/* 振り込み予定セクション */}
      <IncomeSection
        upcomingIncome={upcomingIncome}
        totalRecurringIncome={totalRecurringIncome}
        onEditRecurring={onEditRecurring}
        onToggleRecurring={onToggleRecurring}
      />
    </div>
  );
};
