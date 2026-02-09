import { useState } from 'react';
import { ChevronDown, ChevronRight, CreditCard, Calendar, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { categoryService } from '../../services/storage';
import type { Transaction, RecurringPayment } from '../../types';

interface ScheduleSectionProps {
  unsettledTransactions: Transaction[];
  totalCardPending: number;
  upcomingExpense: RecurringPayment[];
  totalRecurringExpense: number;
  onViewUnsettled: () => void;
}

export const ScheduleSection = ({
  unsettledTransactions,
  totalCardPending,
  upcomingExpense,
  totalRecurringExpense,
  onViewUnsettled,
}: ScheduleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const categories = categoryService.getAll();

  const getCategory = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  // Sort unsettled transactions by date (newest first) and get recent ones
  const recentUnsettled = unsettledTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 md:p-4 border border-red-100 dark:border-red-900/30">
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
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* カード未精算 */}
          {totalCardPending > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={14} className="text-red-600 dark:text-red-400" />
                <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                  カード未精算
                </span>
                <span className="text-xs md:text-sm font-semibold text-red-600 dark:text-red-400 ml-auto">
                  {formatCurrency(totalCardPending)}
                </span>
              </div>

              {/* Recent unsettled transactions */}
              {recentUnsettled.length > 0 && (
                <div className="space-y-1.5 mb-2 ml-6">
                  {recentUnsettled.map((t) => {
                    const category = getCategory(t.categoryId);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-xs md:text-sm gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                          >
                            {getCategoryIcon(category?.icon || '', 12)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-gray-900 dark:text-gray-100">{category?.name || '不明'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.date)}</p>
                          </div>
                        </div>
                        <span className="text-red-600 dark:text-red-400 font-semibold flex-shrink-0">
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View all button */}
              {unsettledTransactions.length > 3 && (
                <button
                  onClick={onViewUnsettled}
                  className="w-full ml-6 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  <Eye size={14} />
                  すべて見る
                </button>
              )}
            </div>
          )}

          {/* 定期支出 */}
          {upcomingExpense.length > 0 && (
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
                {upcomingExpense.map((rp) => {
                  const category = getCategory(rp.categoryId);
                  const freqLabel = rp.frequency === 'monthly'
                    ? `毎月${rp.dayOfMonth}日`
                    : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;

                  return (
                    <div
                      key={rp.id}
                      className="flex items-center justify-between text-xs md:text-sm gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                        >
                          {getCategoryIcon(category?.icon || '', 12)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-gray-900 dark:text-gray-100">{rp.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{freqLabel}</p>
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
  );
};
