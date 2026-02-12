import { useState } from 'react';
import { Calendar, TrendingUp, ChevronDown, ChevronRight, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../hooks/useTheme';
import { getThemeGradient } from '../../utils/themes';
import { getUnsettledTransactions, getUpcomingRecurringPayments, calculateRecurringNextDate } from '../../utils/billingUtils';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { categoryService } from '../../services/storage';
import type { PaymentMethod, Account, Member } from '../../types';

interface TotalPendingData {
  cardPending: number;
  recurringExpense: number;
  recurringIncome: number;
  totalPending: number;
}

interface AssetCardProps {
  totalBalance: number;
  totalExpense: number;
  totalIncome: number;
  netPending: number;
  accounts: Account[];
  groupedAccounts: Record<string, Account[]>;
  totalPendingByAccount: Record<string, TotalPendingData>;
  getMember: (memberId: string) => Member | undefined;
  isBreakdownOpen: boolean;
  onToggleBreakdown: () => void;
  paymentMethods?: PaymentMethod[];
}


export const AssetCard = ({
  totalBalance,
  paymentMethods = [],
}: AssetCardProps) => {
  const { currentTheme } = useTheme();
  const gradient = getThemeGradient(currentTheme);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isIncomeExpanded, setIsIncomeExpanded] = useState(false);
  const categories = categoryService.getAll();

  // Get all payment methods and their unsettled amounts
  const allUnsettledTransactions = getUnsettledTransactions();
  const linkedPMs = paymentMethods.filter((pm) => pm.linkedAccountId);

  const cardUnsettledList = linkedPMs.map((pm) => {
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

  // Get all upcoming recurring payments
  const allUpcomingRecurring = getUpcomingRecurringPayments(31);
  const allUpcomingExpense = allUpcomingRecurring.filter((rp) => rp.type === 'expense');
  const allUpcomingIncome = allUpcomingRecurring.filter((rp) => rp.type === 'income');

  const totalCardPending = cardUnsettledList.reduce((sum, card) => sum + card.unsettledAmount, 0);
  const totalRecurringExpense = allUpcomingExpense.reduce((sum, rp) => sum + rp.amount, 0);
  const totalRecurringIncome = allUpcomingIncome.reduce((sum, rp) => sum + rp.amount, 0);

  const getCategory = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  return (
    <div
      className="rounded-lg md:rounded-xl p-3 md:p-4 space-y-3 relative"
      style={{ background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})` }}
    >
      {/* 残高セクション */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 md:p-4 border" style={{
        borderColor: 'var(--theme-primary)',
      }}>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
          総資産
        </p>
        <p className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
          {formatCurrency(totalBalance)}
        </p>
      </div>

      {/* 引き落とし予定セクション */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 md:p-4 border border-red-100 dark:border-red-900/30">
        {/* ヘッダー */}
        <button
          onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            {isScheduleExpanded ? (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
            )}
            <Calendar size={16} className="text-red-600 dark:text-red-400" />
            <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
              引き落とし予定
            </span>
          </div>
          <span className="text-base md:text-lg font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalCardPending + totalRecurringExpense)}
          </span>
        </button>

        {/* 展開時のコンテンツ */}
        {isScheduleExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* カード未精算 */}
            {cardUnsettledList.length > 0 && cardUnsettledList.some(c => c.unsettledAmount > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={14} className="text-red-600 dark:text-red-400" />
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    カード未精算
                  </span>
                </div>

                <div className="space-y-1.5 ml-6">
                  {cardUnsettledList
                    .filter(c => c.unsettledAmount > 0)
                    .map((cardInfo) => (
                    <div
                      key={cardInfo.paymentMethod.id}
                      className="w-full flex items-start justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${cardInfo.paymentMethod.color}20`, color: cardInfo.paymentMethod.color }}
                        >
                          <CreditCard size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-gray-900 dark:text-gray-100">
                            {cardInfo.paymentMethod.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          {formatCurrency(cardInfo.unsettledAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 定期支出 */}
            {allUpcomingExpense.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    定期支出
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-orange-600 dark:text-orange-400 ml-auto">
                    {formatCurrency(totalRecurringExpense)}
                  </span>
                </div>

                <div className="space-y-1.5 ml-6">
                  {allUpcomingExpense.map((rp) => {
                    const category = getCategory(rp.categoryId);
                    const nextDate = calculateRecurringNextDate(rp);
                    let dateLabel = '';
                    if (nextDate) {
                      if (rp.paymentMethodId) {
                        dateLabel = `${nextDate.getMonth() + 1}月${nextDate.getDate()}日引き落とし`;
                      } else {
                        dateLabel = rp.frequency === 'monthly'
                          ? `毎月${rp.dayOfMonth}日`
                          : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;
                      }
                    } else {
                      dateLabel = rp.frequency === 'monthly'
                        ? `毎月${rp.dayOfMonth}日`
                        : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;
                    }

                    return (
                      <div
                        key={rp.id}
                        className={`flex items-center justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors ${rp.isActive ? '' : 'opacity-40'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                          >
                            {getCategoryIcon(category?.icon || '', 12)}
                          </div>
                          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                            <p className="truncate text-gray-900 dark:text-gray-100">{rp.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{dateLabel}</p>
                          </div>
                        </div>
                        <span className="text-red-600 dark:text-red-400 font-semibold flex-shrink-0">
                          {formatCurrency(rp.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 振り込み予定セクション */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 md:p-4 border border-green-100 dark:border-green-900/30">
        {/* ヘッダー */}
        <button
          onClick={() => setIsIncomeExpanded(!isIncomeExpanded)}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            {isIncomeExpanded ? (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
            )}
            <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
              振り込み予定
            </span>
          </div>
          <span className="text-base md:text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalRecurringIncome)}
          </span>
        </button>

        {/* 展開時のコンテンツ */}
        {isIncomeExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {allUpcomingIncome.length === 0 ? (
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                定期収入予定なし
              </p>
            ) : (
              <div className="space-y-1.5">
                {allUpcomingIncome.map((rp) => {
                  const category = getCategory(rp.categoryId);
                  const freqLabel = rp.frequency === 'monthly'
                    ? `毎月${rp.dayOfMonth}日`
                    : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;

                  return (
                    <div
                      key={rp.id}
                      className={`flex items-center justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors ${rp.isActive ? '' : 'opacity-40'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                        >
                          {getCategoryIcon(category?.icon || '', 12)}
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                          <p className="truncate text-gray-900 dark:text-gray-100">{rp.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{freqLabel}</p>
                        </div>
                      </div>
                      <span className="text-green-600 dark:text-green-400 font-semibold flex-shrink-0">
                        {formatCurrency(rp.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
