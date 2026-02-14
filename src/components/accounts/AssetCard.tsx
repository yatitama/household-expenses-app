import { useState, useRef, useCallback } from 'react';
import { Wallet, Calendar, TrendingUp, ChevronDown, ChevronRight, CreditCard, ChevronLeft } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getUnsettledTransactions, getUpcomingRecurringPayments } from '../../utils/billingUtils';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { categoryService } from '../../services/storage';
import { RecurringPaymentDetailModal } from './modals/RecurringPaymentDetailModal';
import type { PaymentMethod, Account, Member, Transaction, RecurringPayment, Category } from '../../types';

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
  onCardUnsettledClick?: (paymentMethod: PaymentMethod) => void;
}

const SWIPE_THRESHOLD = 50;
const TOUCH_TIMEOUT = 500;

export const AssetCard = ({
  groupedAccounts,
  getMember,
  paymentMethods = [],
  onCardUnsettledClick,
}: AssetCardProps) => {
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [isAssetTransitioning, setIsAssetTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const assetContainerRef = useRef<HTMLDivElement>(null);
  const assetInnerRef = useRef<HTMLDivElement>(null);

  const categories = categoryService.getAll();
  const allUnsettledTransactions = getUnsettledTransactions();
  const allUpcomingRecurring = getUpcomingRecurringPayments(31);

  const getCategory = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

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

  const goToAssetSlide = useCallback((index: number) => {
    if (index !== currentAssetIndex) {
      setIsAssetTransitioning(true);
      setCurrentAssetIndex(index);
      setTimeout(() => setIsAssetTransitioning(false), 300);
    }
  }, [currentAssetIndex]);

  const handleAssetPrev = useCallback(() => {
    const newIndex = currentAssetIndex === 0 ? memberSlides.length - 1 : currentAssetIndex - 1;
    goToAssetSlide(newIndex);
  }, [currentAssetIndex, memberSlides.length, goToAssetSlide]);

  const handleAssetNext = useCallback(() => {
    const newIndex = currentAssetIndex === memberSlides.length - 1 ? 0 : currentAssetIndex + 1;
    goToAssetSlide(newIndex);
  }, [currentAssetIndex, memberSlides.length, goToAssetSlide]);

  const handleAssetTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const handleAssetTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const diffX = touchStartX.current - touchEndX;
      const diffY = Math.abs(touchStartY.current - touchEndY);
      const duration = touchEndTime - touchStartTime.current;

      const isSwipe = Math.abs(diffX) > SWIPE_THRESHOLD && diffY < SWIPE_THRESHOLD && duration < TOUCH_TIMEOUT;

      if (isSwipe) {
        e.preventDefault();
        if (diffX > 0) {
          handleAssetNext();
        } else {
          handleAssetPrev();
        }
      }
    },
    [handleAssetNext, handleAssetPrev]
  );

  return (
    <div className="-mx-3 md:mx-0 flex flex-col max-h-screen">
      {/* ナビゲーション */}
      {memberSlides.length > 1 && (
        <div className="flex items-center justify-center gap-3 mb-1">
            <button
              onClick={handleAssetPrev}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="前へ"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex justify-center gap-1">
              {memberSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToAssetSlide(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentAssetIndex
                      ? 'bg-gray-800 dark:bg-gray-300 w-5'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`スライド ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleAssetNext}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="次へ"
            >
              <ChevronRight size={18} />
            </button>
          </div>
      )}

      {/* メンバーカルーセル */}
      <div
        ref={assetContainerRef}
        onTouchStart={handleAssetTouchStart}
        onTouchEnd={handleAssetTouchEnd}
        className="relative overflow-hidden rounded-lg md:rounded-xl flex-1 min-h-0"
        style={{ touchAction: 'auto' }}
      >
        <div
          ref={assetInnerRef}
          className={`flex flex-nowrap transition-transform h-full ${isAssetTransitioning ? 'duration-300 ease-out' : ''}`}
          style={{
            transform: `translateX(-${currentAssetIndex * 100}%)`,
          }}
        >
          {memberSlides.map((slide) => (
            <div key={slide.id} className="w-full flex-shrink-0 min-w-0 min-h-0 h-full flex flex-col">
              <MemberAssetCard
                slide={slide}
                allUnsettledTransactions={allUnsettledTransactions}
                allUpcomingRecurring={allUpcomingRecurring}
                paymentMethods={paymentMethods}
                getCategory={getCategory}
                onCardUnsettledClick={onCardUnsettledClick}
              />
            </div>
          ))}
        </div>
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
  getCategory: (categoryId: string) => Category | undefined;
  onCardUnsettledClick?: (paymentMethod: PaymentMethod) => void;
}

const MemberAssetCard = ({
  slide,
  allUnsettledTransactions,
  allUpcomingRecurring,
  paymentMethods,
  getCategory,
  onCardUnsettledClick,
}: MemberAssetCardProps) => {
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isIncomeExpanded, setIsIncomeExpanded] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringPayment | null>(null);
  const [isRecurringDetailModalOpen, setIsRecurringDetailModalOpen] = useState(false);

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

  const memberCardPending = memberCardUnsettledList.reduce((sum: number, card: CardUnsettledInfo) => sum + card.unsettledAmount, 0);
  const memberRecurringExpense = memberUpcomingExpense.reduce((sum: number, rp: RecurringPayment) => sum + rp.amount, 0);
  const memberRecurringIncome = memberUpcomingIncome.reduce((sum: number, rp: RecurringPayment) => sum + rp.amount, 0);

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 transition-all duration-200 flex-1 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="flex gap-2 md:gap-2.5 mb-3 md:mb-4">
        <div className="flex-shrink-0 self-start">
          <div
            className="w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: slide.member?.color || 'var(--theme-primary)' }}
          >
            {slide.type === 'total' ? (
              <Wallet size={18} className="md:w-5 md:h-5" />
            ) : (
              <span className="text-sm md:text-base font-semibold">
                {slide.member?.name?.[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-0.5 md:space-y-1">
          <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {slide.name}
          </p>
        </div>
      </div>

      {/* 残高セクション */}
      <div className="space-y-0 flex-1 flex flex-col overflow-y-auto">
        <div className="bg-white rounded-lg p-3 md:p-4 mb-4" style={{
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

        {/* 振り込み予定セクション */}
        <div className="bg-white rounded-lg p-3 md:p-4 dark:border-gray-800/30">
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
              <TrendingUp size={16} className="text-gray-700 dark:text-gray-600" />
              <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
                振り込み予定
              </span>
            </div>
            <span className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-700">
              {formatCurrency(memberRecurringIncome)}
            </span>
          </button>

          {isIncomeExpanded && (
            <div className="border-t mt-4 pt-4 dark:border-gray-700">
              {memberUpcomingIncome.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  定期収入予定なし
                </p>
              ) : (
                <div className="space-y-1.5">
                  {memberUpcomingIncome.map((rp: RecurringPayment) => {
                    const category = getCategory(rp.categoryId);

                    return (
                      <button
                        key={rp.id}
                        onClick={() => {
                          setSelectedRecurring(rp);
                          setIsRecurringDetailModalOpen(true);
                        }}
                        className={`w-full flex items-center justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 rounded transition-colors text-left ${rp.isActive ? '' : 'opacity-40'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                          >
                            {getCategoryIcon(category?.icon || '', 12)}
                          </div>
                          <p className="truncate text-gray-900 dark:text-gray-100">{rp.name}</p>
                        </div>
                        <span className="text-gray-900 dark:text-gray-700 font-semibold flex-shrink-0">
                          {formatCurrency(rp.amount)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 引き落とし予定セクション */}
        <div className={`bg-white rounded-lg p-3 md:p-4 dark:border-gray-800/30 ${isIncomeExpanded ? '' : '-mt-3'}`}>
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
              <Calendar size={16} className="text-gray-900 dark:text-gray-700" />
              <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
                引き落とし予定
              </span>
            </div>
            <span className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-700">
              {formatCurrency(memberCardPending + memberRecurringExpense)}
            </span>
          </button>

          {isScheduleExpanded && (
            <div className="border-t mt-4 pt-4 dark:border-gray-700">
              {memberCardUnsettledList.length === 0 && memberUpcomingExpense.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  予定なし
                </p>
              ) : (
                <div className="space-y-1.5">
                  {memberCardUnsettledList
                    .filter(c => c.unsettledAmount > 0)
                    .map((cardInfo) => (
                        <button
                          key={cardInfo.paymentMethod.id}
                          onClick={() => onCardUnsettledClick?.(cardInfo.paymentMethod)}
                          className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 rounded transition-colors text-left min-w-0"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${cardInfo.paymentMethod.color}20`, color: cardInfo.paymentMethod.color }}
                            >
                              <CreditCard size={12} />
                            </div>
                            <p className="truncate text-gray-900 dark:text-gray-100">
                              {cardInfo.paymentMethod.name}
                            </p>
                          </div>
                          <div className="flex justify-end w-28">
                            <span className="text-gray-900 dark:text-gray-700 font-semibold">
                              {formatCurrency(cardInfo.unsettledAmount)}
                            </span>
                          </div>
                        </button>
                    ))}

                  {memberUpcomingExpense.map((rp: RecurringPayment) => {
                    const category = getCategory(rp.categoryId);

                    return (
                      <button
                        key={rp.id}
                        onClick={() => {
                          setSelectedRecurring(rp);
                          setIsRecurringDetailModalOpen(true);
                        }}
                        className={`w-full flex items-center justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 rounded transition-colors text-left ${rp.isActive ? '' : 'opacity-40'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                          >
                            {getCategoryIcon(category?.icon || '', 12)}
                          </div>
                          <p className="truncate text-gray-900 dark:text-gray-100">{rp.name}</p>
                        </div>
                        <span className="text-gray-900 dark:text-gray-700 font-semibold flex-shrink-0">
                          {formatCurrency(rp.amount)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 定期支払い詳細モーダル */}
      <RecurringPaymentDetailModal
        recurringPayment={selectedRecurring}
        isOpen={isRecurringDetailModalOpen}
        onClose={() => {
          setIsRecurringDetailModalOpen(false);
          setSelectedRecurring(null);
        }}
      />
    </div>
  );
};
