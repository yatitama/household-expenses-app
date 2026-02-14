import { getUnsettledTransactions, getUpcomingRecurringPayments } from '../../utils/billingUtils';
import { AccountGridSection } from './AccountGridSection';
import { CardGridSection } from './CardGridSection';
import { RecurringItemGridSection } from './RecurringItemGridSection';
import type { PaymentMethod, Account, Member, Transaction, RecurringPayment } from '../../types';

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
  groupedAccounts: Record<string, Account[]>;
  getMember: (memberId: string) => Member | undefined;
  isBreakdownOpen?: boolean;
  onToggleBreakdown?: () => void;
  paymentMethods?: PaymentMethod[];
  onRecurringDetailClick?: (recurringPayment: RecurringPayment) => void;
  onCardUnsettledSheetOpen?: (paymentMethod: PaymentMethod, transactions: Transaction[]) => void;
}

export const AssetCard = ({
  totalBalance,
  totalExpense,
  totalIncome,
  netPending,
  groupedAccounts,
  getMember,
  paymentMethods = [],
  onRecurringDetailClick,
  onCardUnsettledSheetOpen,
}: AssetCardProps) => {
  const allUnsettledTransactions = getUnsettledTransactions();
  const allUpcomingRecurring = getUpcomingRecurringPayments(31);

  // メンバー別データ構築
  const memberSlidesData = Object.entries(groupedAccounts).map(([memberId, memberAccounts]) => {
    const member = getMember(memberId) || null;
    const memberBalance = memberAccounts.reduce((sum, a) => sum + a.balance, 0);
    return {
      type: 'member',
      id: memberId,
      name: member?.name || '不明',
      balance: memberBalance,
      member,
      memberAccounts,
      memberId,
    };
  });

  return (
    <div className="flex flex-col px-1 md:px-2 lg:px-3 pt-2 md:pt-4 lg:pt-6 pb-3 md:pb-4 space-y-4 md:space-y-6">
      {/* 総資産サマリー */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-4 md:p-6 text-white shadow-lg">
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div>
            <p className="text-xs md:text-sm font-medium opacity-90">総資産</p>
            <p className="text-lg md:text-2xl font-bold mt-1">¥{totalBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm font-medium opacity-90">差引</p>
            <p className={`text-lg md:text-2xl font-bold mt-1 ${netPending > 0 ? 'text-red-200' : 'text-green-200'}`}>
              ¥{netPending.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs md:text-sm font-medium opacity-90">未払・定期支出</p>
            <p className="text-lg md:text-2xl font-bold mt-1">¥{totalExpense.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm font-medium opacity-90">定期収入</p>
            <p className="text-lg md:text-2xl font-bold mt-1">¥{totalIncome.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* メンバー別コンテンツ */}
      {memberSlidesData.map((slide) => (
        <div key={slide.id} className="space-y-3 md:space-y-4">
          <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white px-1">
            {slide.name}
          </h2>

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
      <div className="space-y-2 md:space-y-3">
        {/* 口座グリッド */}
        <AccountGridSection accounts={slide.memberAccounts} />

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
