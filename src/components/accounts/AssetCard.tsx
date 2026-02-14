import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getUnsettledTransactions, getUpcomingRecurringPayments } from '../../utils/billingUtils';
import { CardGridSection } from './CardGridSection';
import { RecurringItemGridSection } from './RecurringItemGridSection';
import type { PaymentMethod, Account, Member, Transaction, RecurringPayment } from '../../types';

interface TotalPendingData {
  cardPending: number;
  recurringExpense: number;
  recurringIncome: number;
  totalPending: number;
}

interface CardUnsettledInfo {
  paymentMethod: PaymentMethod;
  unsettledAmount: number;
  unsettledTransactions: Transaction[];
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
  onRecurringDetailClick?: (recurringPayment: RecurringPayment) => void;
  onCardUnsettledSheetOpen?: (paymentMethod: PaymentMethod, transactions: Transaction[]) => void;
}

export const AssetCard = ({
  groupedAccounts,
  getMember,
  paymentMethods = [],
  onRecurringDetailClick,
  onCardUnsettledSheetOpen,
}: AssetCardProps) => {
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);

  const allUnsettledTransactions = getUnsettledTransactions();
  const allUpcomingRecurring = getUpcomingRecurringPayments(31);

  // メンバーカルーセル用データ構築
  const memberSlides = Object.entries(groupedAccounts).map(([memberId, memberAccounts]) => {
    const member = getMember(memberId) || null;
    const memberTotal = memberAccounts.reduce((sum, a) => sum + a.balance, 0);
    return {
      type: 'member',
      id: memberId,
      name: member?.name || '不明',
      balance: memberTotal,
      member,
      memberAccounts,
      memberId,
    };
  });

  const goToAssetSlide = (index: number) => {
    setCurrentAssetIndex(index);
  };

  return (
    <div className="flex flex-col">
      {/* メンバー選択セクション */}
      {memberSlides.length > 0 && (
        <div className="px-1 md:px-2 lg:px-3 pt-2 md:pt-4 lg:pt-6 pb-3 md:pb-4">
          <div className="flex flex-wrap gap-2">
            {memberSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToAssetSlide(index)}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  index === currentAssetIndex
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {slide.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* メンバーコンテンツ */}
      <div className="flex-1 min-h-0 px-1 md:px-2 lg:px-3">
        {memberSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`h-full overflow-hidden ${index === currentAssetIndex ? '' : 'hidden'}`}
          >
            <MemberAssetCard
              slide={slide}
              allUnsettledTransactions={allUnsettledTransactions}
              allUpcomingRecurring={allUpcomingRecurring}
              paymentMethods={paymentMethods}
              onRecurringDetailClick={onRecurringDetailClick}
              onCardUnsettledSheetOpen={onCardUnsettledSheetOpen}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

interface MemberSlide {
  type: string;
  id: string;
  name: string;
  balance: number;
  member: Member | null;
  memberAccounts: Account[];
  memberId: string;
}

interface MemberAssetCardProps {
  slide: MemberSlide;
  allUnsettledTransactions: Transaction[];
  allUpcomingRecurring: RecurringPayment[];
  paymentMethods: PaymentMethod[];
  onRecurringDetailClick?: (recurringPayment: RecurringPayment) => void;
  onCardUnsettledSheetOpen?: (paymentMethod: PaymentMethod, transactions: Transaction[]) => void;
}

const MemberAssetCard = ({
  slide,
  allUnsettledTransactions,
  allUpcomingRecurring,
  paymentMethods,
  onRecurringDetailClick,
  onCardUnsettledSheetOpen,
}: MemberAssetCardProps) => {
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true);

  // このメンバーのアカウントIDリスト
  const memberAccountIds = slide.memberAccounts.map((a) => a.id);

  // このメンバーのカード未精算
  const memberLinkedPMs = paymentMethods.filter(
    (pm) => pm.linkedAccountId && memberAccountIds.includes(pm.linkedAccountId)
  );

  const memberCardUnsettledList: CardUnsettledInfo[] = memberLinkedPMs.map((pm) => {
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

  // このメンバーの定期支出・収入
  const memberUpcomingExpense = allUpcomingRecurring.filter(
    (rp: RecurringPayment) => rp.type === 'expense' && memberAccountIds.includes(rp.accountId)
  );
  const memberUpcomingIncome = allUpcomingRecurring.filter(
    (rp: RecurringPayment) => rp.type === 'income' && memberAccountIds.includes(rp.accountId)
  );

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* 残高セクション */}
      <div className="space-y-2 md:space-y-3">
        <div className="bg-white rounded-lg p-3 md:p-4 mb-1" style={{
          borderColor: 'var(--theme-primary)',
        }}>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
            残高
          </p>

          {/* 口座ごとの内訳 */}
          {slide.memberAccounts.length > 0 ? (
            <>
              <button
                onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
                className={`w-full flex items-center justify-between hover:opacity-80 transition-opacity ${isBreakdownExpanded ? 'mb-3' : ''}`}
              >
                <p className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                  {formatCurrency(slide.balance)}
                </p>
                {isBreakdownExpanded ? (
                  <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {isBreakdownExpanded && (
                <div className="border-t mt-4 pt-4 dark:border-gray-700 space-y-2">
                  {slide.memberAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{account.name}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--theme-primary)' }}>
              {formatCurrency(slide.balance)}
            </p>
          )}
        </div>


        {/* カードグリッド */}
        {memberLinkedPMs.length > 0 && (
          <CardGridSection
            paymentMethods={memberLinkedPMs}
            cardUnsettledList={memberCardUnsettledList}
            onCardClick={onCardUnsettledSheetOpen || (() => {})}
          />
        )}

        {/* 定期支出グリッド */}
        <RecurringItemGridSection
          title="定期支出"
          items={memberUpcomingExpense}
          onItemClick={onRecurringDetailClick || (() => {})}
        />

        {/* 定期収入グリッド */}
        <RecurringItemGridSection
          title="定期収入"
          items={memberUpcomingIncome}
          onItemClick={onRecurringDetailClick || (() => {})}
        />
      </div>

    </div>
  );
};
