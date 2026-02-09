import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getUnsettledTransactions, getUpcomingRecurringPayments } from '../../utils/billingUtils';
import { ScheduleSection } from './ScheduleSection';
import { IncomeSection } from './IncomeSection';
import type { Account, PaymentMethod, LinkedPaymentMethod } from '../../types';

interface AccountBalanceScheduleProps {
  account: Account;
  linkedPaymentMethods: LinkedPaymentMethod[];
  paymentMethods: PaymentMethod[];
}

export const AccountBalanceSchedule = ({
  account,
  linkedPaymentMethods,
  paymentMethods,
}: AccountBalanceScheduleProps) => {
  const navigate = useNavigate();

  // Get payment methods linked to this account
  const linkedPMs = linkedPaymentMethods
    .filter((lpm) => lpm.isActive)
    .map((lpm) => paymentMethods.find((pm) => pm.id === lpm.paymentMethodId))
    .filter((pm) => pm !== undefined) as PaymentMethod[];

  // Get unsettled transactions for linked payment methods
  const unsettledTransactions = getUnsettledTransactions()
    .filter((t) => linkedPMs.some((pm) => pm.id === t.paymentMethodId));

  // Get upcoming recurring payments for this account
  const upcomingRecurring = getUpcomingRecurringPayments(31)
    .filter((rp) => rp.accountId === account.id);

  // Separate into expense and income
  const upcomingExpense = upcomingRecurring.filter((rp) => rp.type === 'expense');
  const upcomingIncome = upcomingRecurring.filter((rp) => rp.type === 'income');

  // Calculate pending amounts
  const totalCardPending = unsettledTransactions.reduce((sum, t) => {
    return sum + (t.type === 'expense' ? t.amount : -t.amount);
  }, 0);

  const totalRecurringExpense = upcomingExpense.reduce((sum, rp) => sum + rp.amount, 0);
  const totalRecurringIncome = upcomingIncome.reduce((sum, rp) => sum + rp.amount, 0);

  const handleViewUnsettled = () => {
    // Navigate to transactions page with unsettled filter
    navigate('/transactions', {
      state: {
        accountId: account.id,
        paymentMethodIds: linkedPMs.map((pm) => pm.id),
        filterType: 'unsettled',
      },
    });
  };

  return (
    <div className="space-y-3">
      {/* 残高セクション */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 md:p-4">
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
          口座残高
        </p>
        <p className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">
          {formatCurrency(account.balance)}
        </p>
      </div>

      {/* 引き落とし予定セクション */}
      {(totalCardPending > 0 || totalRecurringExpense > 0) && (
        <ScheduleSection
          unsettledTransactions={unsettledTransactions}
          totalCardPending={totalCardPending}
          upcomingExpense={upcomingExpense}
          totalRecurringExpense={totalRecurringExpense}
          onViewUnsettled={handleViewUnsettled}
        />
      )}

      {/* 振り込み予定セクション */}
      {totalRecurringIncome > 0 && (
        <IncomeSection
          upcomingIncome={upcomingIncome}
          totalRecurringIncome={totalRecurringIncome}
        />
      )}
    </div>
  );
};
