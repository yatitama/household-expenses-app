import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AccountCard } from './AccountCard';
import type { Account, Member, RecurringPayment, PaymentMethod } from '../../types';

interface AccountsCarouselProps {
  accounts: Account[];
  members: Member[];
  paymentMethods: PaymentMethod[];
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
}

const SWIPE_THRESHOLD = 50; // 最小スワイプ距離（px）
const TOUCH_TIMEOUT = 500; // タップ判定時間（ms）

export const AccountsCarousel = ({
  accounts,
  members,
  paymentMethods,
  onEditRecurring,
  onToggleRecurring,
}: AccountsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const goToSlide = useCallback((index: number) => {
    if (index !== currentIndex) {
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    const newIndex = currentIndex === 0 ? accounts.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  }, [currentIndex, accounts.length, goToSlide]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === accounts.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  }, [currentIndex, accounts.length, goToSlide]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
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
        // スワイプの場合、クリックイベントを防止
        e.preventDefault();
        if (diffX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    },
    [handleNext, handlePrev]
  );

  if (accounts.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* インジケーターとナビゲーションボタン */}
      {accounts.length > 1 && (
        <div className="flex flex-col items-center gap-1 mb-1">
          <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
            口座 ({currentIndex + 1}/{accounts.length})
          </h3>

          <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePrev}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="前へ"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex justify-center gap-1">
            {accounts.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-gray-800 dark:bg-gray-300 w-5'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`口座 ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="次へ"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        </div>
      )}
      {accounts.length === 1 && (
        <h3 className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
          口座 ({currentIndex + 1}/{accounts.length})
        </h3>
      )}

      {/* カルーセルコンテナ */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden rounded-xl"
        style={{ touchAction: 'auto' }}
      >
        <div
          ref={innerRef}
          className={`flex flex-nowrap transition-transform ${isTransitioning ? 'duration-300 ease-out' : ''}`}
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {accounts.map((account) => {
            return (
              <div key={account.id} className="w-full flex-shrink-0 min-w-0">
                <AccountCard
                  account={account}
                  member={getMember(account.memberId)}
                  allPaymentMethods={paymentMethods}
                  onEditRecurring={onEditRecurring}
                  onToggleRecurring={onToggleRecurring}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
