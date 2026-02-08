import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AccountCard } from './AccountCard';
import type { Account, Member, RecurringPayment, PaymentMethod, LinkedPaymentMethod } from '../../types';

interface AccountsCarouselProps {
  accounts: Account[];
  members: Member[];
  paymentMethods: PaymentMethod[];
  linkedPaymentMethods: LinkedPaymentMethod[];
  recurringPayments: RecurringPayment[];
  pendingByAccount: Record<string, number>;
  pendingByPM: Record<string, number>;
  totalPendingByAccount: Record<string, {
    cardPending: number;
    recurringExpense: number;
    recurringIncome: number;
    totalPending: number;
  }>;
  onAddTransaction: (target: { accountId?: string; paymentMethodId?: string }) => void;
  onAddRecurring: (target: { accountId?: string; paymentMethodId?: string }) => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
  onAddLinkedPM: (target: { accountId: string }) => void;
  onToggleLinkedPM: (lpm: LinkedPaymentMethod) => void;
  onViewPM: (pm: PaymentMethod) => void;
}

export const AccountsCarousel = ({
  accounts,
  members,
  paymentMethods,
  linkedPaymentMethods,
  recurringPayments,
  pendingByAccount,
  pendingByPM,
  totalPendingByAccount,
  onAddTransaction,
  onAddRecurring,
  onEditRecurring,
  onToggleRecurring,
  onAddLinkedPM,
  onToggleLinkedPM,
  onViewPM,
}: AccountsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? accounts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === accounts.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStart - touchEnd > 50) {
      handleNext();
    }
    if (touchEnd - touchStart > 50) {
      handlePrev();
    }
  };

  if (accounts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          口座 ({currentIndex + 1}/{accounts.length})
        </h3>
        {accounts.length > 1 && (
          <div className="flex gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="前へ"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="次へ"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* カルーセルコンテナ */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden"
      >
        <div
          className="transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          <div className="flex gap-3">
            {accounts.map((account) => {
              const accountLinkedPMs = linkedPaymentMethods.filter((lpm) => lpm.accountId === account.id);
              const accountRecurrings = recurringPayments.filter(
                (rp) => rp.accountId === account.id && !rp.paymentMethodId
              );
              return (
                <div key={account.id} className="w-full flex-shrink-0">
                  <AccountCard
                    account={account}
                    member={getMember(account.memberId)}
                    pendingAmount={pendingByAccount[account.id] || 0}
                    totalPendingData={totalPendingByAccount[account.id]}
                    linkedPaymentMethodsData={accountLinkedPMs}
                    allPaymentMethods={paymentMethods}
                    pendingByPM={pendingByPM}
                    recurringPayments={accountRecurrings}
                    onAddTransaction={() => onAddTransaction({ accountId: account.id })}
                    onAddRecurring={() => onAddRecurring({ accountId: account.id })}
                    onEditRecurring={onEditRecurring}
                    onToggleRecurring={onToggleRecurring}
                    onAddLinkedPM={() => onAddLinkedPM({ accountId: account.id })}
                    onToggleLinkedPM={onToggleLinkedPM}
                    onViewPM={onViewPM}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ドット インジケーター */}
      {accounts.length > 1 && (
        <div className="flex justify-center gap-1">
          {accounts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary-600 w-5'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`口座 ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
