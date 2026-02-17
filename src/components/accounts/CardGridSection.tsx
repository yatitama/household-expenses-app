import { RefreshCw, CreditCard, User } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { Transaction, Category, PaymentMethod, Member, Account } from '../../types';

export type CardGridViewMode = 'category' | 'payment' | 'member';

interface RecurringGridItem {
  label: string;
  total: number;
  onClick: () => void;
}

interface CardGridSectionProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods?: PaymentMethod[];
  members?: Member[];
  accounts?: Account[];
  viewMode?: CardGridViewMode;
  onCategoryClick?: (category: Category | undefined, transactions: Transaction[]) => void;
  recurringItem?: RecurringGridItem;
  emptyMessage?: string;
}

export const CardGridSection = ({
  transactions,
  categories,
  paymentMethods = [],
  members = [],
  accounts = [],
  viewMode = 'category',
  onCategoryClick,
  recurringItem,
  emptyMessage = '利用なし',
}: CardGridSectionProps) => {
  // カテゴリ別グルーピング
  const categoryGrouped = transactions.reduce(
    (acc, t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const key = t.categoryId || '__none__';
      if (!acc[key]) {
        acc[key] = { category: cat, amount: 0, transactions: [] };
      }
      acc[key].amount += t.type === 'expense' ? t.amount : -t.amount;
      acc[key].transactions.push(t);
      return acc;
    },
    {} as Record<string, { category: Category | undefined; amount: number; transactions: Transaction[] }>
  );

  // 支払い元別グルーピング
  const paymentGrouped = transactions.reduce(
    (acc, t) => {
      const key = t.paymentMethodId || '__cash__';
      const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
      if (!acc[key]) {
        acc[key] = { paymentMethod: pm, name: pm?.name ?? '現金', amount: 0, transactions: [] };
      }
      acc[key].amount += t.type === 'expense' ? t.amount : -t.amount;
      acc[key].transactions.push(t);
      return acc;
    },
    {} as Record<string, { paymentMethod: PaymentMethod | undefined; name: string; amount: number; transactions: Transaction[] }>
  );

  // メンバー別グルーピング（accountId → account.memberId → member）
  const memberGrouped = transactions.reduce(
    (acc, t) => {
      const account = accounts.find((a) => a.id === t.accountId);
      const memberId = account?.memberId || '__unknown__';
      const member = members.find((m) => m.id === memberId);
      if (!acc[memberId]) {
        acc[memberId] = { member, name: member?.name ?? '不明', amount: 0, transactions: [] };
      }
      acc[memberId].amount += t.type === 'expense' ? t.amount : -t.amount;
      acc[memberId].transactions.push(t);
      return acc;
    },
    {} as Record<string, { member: Member | undefined; name: string; amount: number; transactions: Transaction[] }>
  );

  const sortedCategoryEntries = Object.entries(categoryGrouped).sort((a, b) => {
    const aIdx = categories.findIndex((c) => c.id === a[1].category?.id);
    const bIdx = categories.findIndex((c) => c.id === b[1].category?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  const sortedPaymentEntries = Object.entries(paymentGrouped).sort((a, b) => {
    const aIdx = paymentMethods.findIndex((p) => p.id === a[1].paymentMethod?.id);
    const bIdx = paymentMethods.findIndex((p) => p.id === b[1].paymentMethod?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  const sortedMemberEntries = Object.entries(memberGrouped).sort((a, b) => {
    const aIdx = members.findIndex((m) => m.id === a[1].member?.id);
    const bIdx = members.findIndex((m) => m.id === b[1].member?.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const hasContent =
    viewMode === 'category'
      ? sortedCategoryEntries.length > 0 || !!recurringItem
      : viewMode === 'payment'
      ? sortedPaymentEntries.length > 0 || !!recurringItem
      : sortedMemberEntries.length > 0 || !!recurringItem;

  if (!hasContent) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 md:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 md:p-4">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {viewMode === 'category'
          ? sortedCategoryEntries.map(([, { category, amount, transactions: catTransactions }]) => (
              <button
                key={category?.id ?? '__none__'}
                onClick={() => onCategoryClick?.(category, catTransactions)}
                className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 h-24 md:h-28 flex flex-col justify-between hover:opacity-80 transition-opacity text-left"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${category?.color || '#6b7280'}20`,
                      color: category?.color || '#6b7280',
                    }}
                  >
                    {getCategoryIcon(category?.icon || '', 12)}
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {category?.name || 'その他'}
                  </p>
                </div>
                <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(amount)}
                </p>
              </button>
            ))
          : viewMode === 'payment'
          ? sortedPaymentEntries.map(([key, { name, amount, transactions: pmTransactions }]) => (
              <button
                key={key}
                onClick={() => onCategoryClick?.(undefined, pmTransactions)}
                className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 h-24 md:h-28 flex flex-col justify-between hover:opacity-80 transition-opacity text-left"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <CreditCard size={12} />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {name}
                  </p>
                </div>
                <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(amount)}
                </p>
              </button>
            ))
          : sortedMemberEntries.map(([key, { member, name, amount, transactions: memberTransactions }]) => (
              <button
                key={key}
                onClick={() => onCategoryClick?.(undefined, memberTransactions)}
                className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 h-24 md:h-28 flex flex-col justify-between hover:opacity-80 transition-opacity text-left"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${member?.color || '#6b7280'}20`,
                      color: member?.color || '#6b7280',
                    }}
                  >
                    <User size={12} />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {name}
                  </p>
                </div>
                <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(amount)}
                </p>
              </button>
            ))}

        {/* 定期アイテムは末尾に表示 */}
        {recurringItem && (
          <button
            onClick={recurringItem.onClick}
            className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 h-24 md:h-28 flex flex-col justify-between hover:opacity-80 transition-opacity text-left"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <RefreshCw size={12} />
              </div>
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {recurringItem.label}
              </p>
            </div>
            <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(recurringItem.total)}
            </p>
          </button>
        )}
      </div>
    </div>
  );
};
