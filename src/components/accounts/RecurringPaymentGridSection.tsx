import { CreditCard, User } from 'lucide-react';
import { ACCOUNT_TYPE_ICONS_LG } from './AccountIcons';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import {
  groupRecurringByCategory,
  groupRecurringByPayment,
  groupRecurringByMember,
  getSortedCategoryEntries,
  getSortedPaymentEntries,
  getSortedMemberEntries,
} from '../../utils/recurringGroupingUtils';
import type { RecurringPayment, Category, PaymentMethod, Account, Member } from '../../types';

export type RecurringPaymentGridViewMode = 'category' | 'payment' | 'member';

interface RecurringPaymentGridSectionProps {
  recurringPayments: RecurringPayment[];
  categories: Category[];
  paymentMethods?: PaymentMethod[];
  members?: Member[];
  accounts?: Account[];
  viewMode?: RecurringPaymentGridViewMode;
  onItemClick?: (item: RecurringPayment) => void;
  emptyMessage?: string;
  month?: string; // yyyy-MM
  displayAbsoluteAmount?: boolean;
}

export const RecurringPaymentGridSection = ({
  recurringPayments,
  categories,
  paymentMethods = [],
  members = [],
  accounts = [],
  viewMode = 'category',
  onItemClick,
  emptyMessage = '利用なし',
  month = '',
  displayAbsoluteAmount = false,
}: RecurringPaymentGridSectionProps) => {
  // Group recurring payments by view mode
  const categoryGrouped = groupRecurringByCategory(recurringPayments, categories, month);
  const paymentGrouped = groupRecurringByPayment(recurringPayments, paymentMethods, accounts, month);
  const memberGrouped = groupRecurringByMember(recurringPayments, members, accounts, month);

  // Get sorted entries
  const sortedCategoryEntries = getSortedCategoryEntries(categoryGrouped, categories);
  const sortedPaymentEntries = getSortedPaymentEntries(paymentGrouped, paymentMethods);
  const sortedMemberEntries = getSortedMemberEntries(memberGrouped, members);

  // Check if there's any content to display
  const hasContent =
    viewMode === 'category'
      ? sortedCategoryEntries.length > 0
      : viewMode === 'payment'
      ? sortedPaymentEntries.length > 0
      : sortedMemberEntries.length > 0;

  if (!hasContent) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 md:p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {viewMode === 'category'
          ? sortedCategoryEntries.map(([, { category, items, totalAmount }]) => {
              const gaugeColor = category?.color || '#6b7280';
              return (
                <div
                  key={category?.id ?? '__none__'}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 md:p-3 flex flex-col gap-2 text-left relative overflow-hidden"
                >
                  {/* Background Icon */}
                  <div
                    className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                    style={{ color: gaugeColor }}
                  >
                    {getCategoryIcon(category?.icon || '', 80)}
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-2 px-1 py-0.5">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-900/50 px-1 rounded">
                      {category?.name || 'その他'}
                    </p>
                  </div>
                  <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(displayAbsoluteAmount ? Math.abs(totalAmount) : totalAmount)}
                  </p>
                  {items.length > 0 && (
                    <div className="relative z-10 mt-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onItemClick?.(item)}
                          className="w-full text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors px-1.5 py-1 rounded text-xs text-gray-600 dark:text-gray-300 truncate"
                        >
                          {item.name || 'Unnamed'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          : viewMode === 'payment'
          ? sortedPaymentEntries.map(([key, { account: entryAccount, name, items, totalAmount }]) => {
              const cardColor = entryAccount?.color || '#6b7280';
              return (
                <div
                  key={key}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 md:p-3 flex flex-col gap-2 text-left relative overflow-hidden"
                >
                  {/* Background Icon */}
                  <div
                    className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                    style={{ color: cardColor }}
                  >
                    {entryAccount ? ACCOUNT_TYPE_ICONS_LG[entryAccount.type] : <CreditCard size={80} />}
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-900/50 px-1 rounded">
                      {name}
                    </p>
                  </div>
                  <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(displayAbsoluteAmount ? Math.abs(totalAmount) : totalAmount)}
                  </p>
                  {items.length > 0 && (
                    <div className="relative z-10 mt-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onItemClick?.(item)}
                          className="w-full text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors px-1.5 py-1 rounded text-xs text-gray-600 dark:text-gray-300 truncate"
                        >
                          {item.name || 'Unnamed'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          : sortedMemberEntries.map(([key, { member, name, items, totalAmount }]) => {
              const memberColor = member?.color || '#6b7280';
              return (
                <div
                  key={key}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 md:p-3 flex flex-col gap-2 text-left relative overflow-hidden"
                >
                  {/* Background Icon */}
                  <div
                    className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none"
                    style={{ color: memberColor }}
                  >
                    {member?.icon ? getCategoryIcon(member.icon, 80) : <User size={80} />}
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate bg-white/50 dark:bg-slate-900/50 px-1 rounded">
                      {name}
                    </p>
                  </div>
                  <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(displayAbsoluteAmount ? Math.abs(totalAmount) : totalAmount)}
                  </p>
                  {items.length > 0 && (
                    <div className="relative z-10 mt-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onItemClick?.(item)}
                          className="w-full text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors px-1.5 py-1 rounded text-xs text-gray-600 dark:text-gray-300 truncate"
                        >
                          {item.name || 'Unnamed'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
};
