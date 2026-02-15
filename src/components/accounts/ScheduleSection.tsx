import { useState } from 'react';
import { ChevronDown, ChevronRight, CreditCard, Calendar, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { calculateRecurringNextDate } from '../../utils/billingUtils';
import { categoryService } from '../../services/storage';
import type { Transaction, RecurringPayment, PaymentMethod } from '../../types';

interface CardUnsettledInfo {
  paymentMethod: PaymentMethod;
  unsettledAmount: number;
  unsettledTransactions: Transaction[];
}

interface ScheduleSectionProps {
  cardUnsettledList: CardUnsettledInfo[];
  upcomingExpense: RecurringPayment[];
  totalCardPending: number;
  totalRecurringExpense: number;
  onViewUnsettled: (paymentMethodId: string) => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
}

export const ScheduleSection = ({
  cardUnsettledList,
  upcomingExpense,
  totalCardPending,
  totalRecurringExpense,
  onViewUnsettled,
  onEditRecurring,
  onToggleRecurring,
}: ScheduleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const categories = categoryService.getAll();

  const getCategory = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  return (
    <div className="rounded-lg p-3 md:p-4 dark:border-gray-800/30">
      {/* ヘッダー */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
          )}
          <Calendar size={16} className="text-gray-900 dark:text-gray-700" />
          <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            引き落とし予定
          </span>
        </div>
        <div className="flex justify-end w-28">
          <span className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-700 font-mono">
            {formatCurrency(totalCardPending + totalRecurringExpense)}
          </span>
        </div>
      </button>

      {/* 展開時のコンテンツ */}
      {isExpanded && (
        <div className="mt-3 pt-3 dark:border-gray-700">
          {cardUnsettledList.length === 0 && upcomingExpense.length === 0 ? (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              予定なし
            </p>
          ) : (
            <div className="space-y-1.5">
              {/* カード未精算の明細 */}
              {cardUnsettledList.map((cardInfo) => (
                <button
                  key={cardInfo.paymentMethod.id}
                  onClick={() => onViewUnsettled(cardInfo.paymentMethod.id)}
                  className="w-full flex items-start justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 rounded transition-colors text-left min-w-0"
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
                    <div className="flex justify-end w-28">
                      <span className="text-gray-900 dark:text-gray-700 font-semibold font-mono">
                        {formatCurrency(cardInfo.unsettledAmount)}
                      </span>
                    </div>
                    {cardInfo.unsettledTransactions.length > 0 && (
                      <ArrowRight size={14} className="text-gray-400" />
                    )}
                  </div>
                </button>
              ))}

              {/* 定期支出の明細 */}
              {upcomingExpense.map((rp) => {
                const category = getCategory(rp.categoryId);

                // カード紐付けの場合は次回引き落とし日、そうでなければ次回実行日を表示
                let dateLabel = '';
                const nextDate = calculateRecurringNextDate(rp);
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
                    className={`flex items-center justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 rounded transition-colors ${rp.isActive ? '' : 'opacity-40'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleRecurring(rp)}
                        className="flex-shrink-0 hover:opacity-70 transition-opacity"
                      >
                        {rp.isActive
                          ? <ToggleRight size={16} className="text-gray-600" />
                          : <ToggleLeft size={16} className="text-gray-300 dark:text-gray-600" />
                        }
                      </button>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                      >
                        {getCategoryIcon(category?.icon || '', 12)}
                      </div>
                      <button
                        onClick={() => onEditRecurring(rp)}
                        className="flex-1 flex flex-col gap-0.5 min-w-0 hover:opacity-70 transition-opacity text-left"
                      >
                        <p className="truncate text-gray-900 dark:text-gray-100">{rp.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{dateLabel}</p>
                      </button>
                    </div>
                    <div className="flex justify-end w-28">
                      <span className="text-gray-900 dark:text-gray-700 font-semibold font-mono">
                        {formatCurrency(rp.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
