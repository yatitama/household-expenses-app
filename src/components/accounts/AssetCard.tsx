import { useState, useRef, useCallback } from 'react';
import { Wallet, Calendar, TrendingUp, ChevronDown, ChevronRight, CreditCard, ChevronLeft } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
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


const SWIPE_THRESHOLD = 50; // 最小スワイプ距離（px）
const TOUCH_TIMEOUT = 500; // タップ判定時間（ms）

export const AssetCard = ({
  totalBalance,
  groupedAccounts,
  getMember,
  paymentMethods = [],
}: AssetCardProps) => {
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [isAssetTransitioning, setIsAssetTransitioning] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isIncomeExpanded, setIsIncomeExpanded] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const assetContainerRef = useRef<HTMLDivElement>(null);
  const assetInnerRef = useRef<HTMLDivElement>(null);

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

  // カルーセル用データ準備
  const assetSlides = [
    // 全メンバー合計
    {
      type: 'total',
      id: 'total',
      name: '全メンバー合計',
      balance: totalBalance,
      member: null,
    },
    // メンバーごと
    ...Object.entries(groupedAccounts).map(([memberId, memberAccounts]) => {
      const member = getMember(memberId);
      const memberTotal = memberAccounts.reduce((sum, a) => sum + a.balance, 0);
      return {
        type: 'member',
        id: memberId,
        name: member?.name || '不明',
        balance: memberTotal,
        member,
      };
    }),
  ];

  const goToAssetSlide = useCallback((index: number) => {
    if (index !== currentAssetIndex) {
      setIsAssetTransitioning(true);
      setCurrentAssetIndex(index);
      setTimeout(() => setIsAssetTransitioning(false), 300);
    }
  }, [currentAssetIndex]);

  const handleAssetPrev = useCallback(() => {
    const newIndex = currentAssetIndex === 0 ? assetSlides.length - 1 : currentAssetIndex - 1;
    goToAssetSlide(newIndex);
  }, [currentAssetIndex, assetSlides.length, goToAssetSlide]);

  const handleAssetNext = useCallback(() => {
    const newIndex = currentAssetIndex === assetSlides.length - 1 ? 0 : currentAssetIndex + 1;
    goToAssetSlide(newIndex);
  }, [currentAssetIndex, assetSlides.length, goToAssetSlide]);

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

      // タップかスワイプか判定
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
    <div className="bg-white dark:bg-slate-800 rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm transition-all duration-200">
      {/* ヘッダー: アイコン + 名前 */}
      <div className="flex gap-2 md:gap-2.5 mb-3 md:mb-4">
        {/* アイコン */}
        <div className="flex-shrink-0 self-start">
          <div
            className="w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <Wallet size={18} className="md:w-5 md:h-5" />
          </div>
        </div>

        {/* 名前 */}
        <div className="flex-1 min-w-0 space-y-0.5 md:space-y-1">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">総資産</p>
            </div>
          </div>
        </div>
      </div>

      {/* 残高・引き落とし・振り込みセクション */}
      <div className="mt-3 md:mt-4 space-y-3">
        {/* 残高カルーセルセクション */}
        {assetSlides.length > 0 && (
          <div className="space-y-3">
            {assetSlides.length > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleAssetPrev}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="前へ"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex justify-center gap-1">
                  {assetSlides.map((_, index) => (
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
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="次へ"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* カルーセルコンテナ */}
            <div
              ref={assetContainerRef}
              onTouchStart={handleAssetTouchStart}
              onTouchEnd={handleAssetTouchEnd}
              className="relative overflow-hidden rounded-lg"
              style={{ touchAction: 'auto' }}
            >
              <div
                ref={assetInnerRef}
                className={`flex flex-nowrap transition-transform ${isAssetTransitioning ? 'duration-300 ease-out' : ''}`}
                style={{
                  transform: `translateX(-${currentAssetIndex * 100}%)`,
                }}
              >
                {assetSlides.map((slide) => (
                  <div key={slide.id} className="w-full flex-shrink-0 min-w-0">
                    <div className="rounded-lg p-3 md:p-4 border dark:bg-slate-700/50" style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      borderColor: 'var(--theme-primary)',
                    }}>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                        {slide.name}
                      </p>
                      <p className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                        {formatCurrency(slide.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 引き落とし予定セクション */}
        <div className="rounded-lg p-3 md:p-4 border border-red-100 dark:border-red-900/30" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        }}>
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
        <div className="rounded-lg p-3 md:p-4 border border-green-100 dark:border-green-900/30" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        }}>
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
    </div>
  );
};
