import { RefreshCw, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { Transaction, Category, PaymentMethod } from '../../types';

export type CardGridViewMode = 'category' | 'payment';

interface RecurringGridItem {
  label: string;
  total: number;
  onClick: () => void;
}

interface CardGridSectionProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods?: PaymentMethod[];
  viewMode?: CardGridViewMode;
  onCategoryClick?: (category: Category | undefined, transactions: Transaction[]) => void;
  recurringItem?: RecurringGridItem;
  emptyMessage?: string;
}

export const CardGridSection = ({
  transactions,
  categories,
  paymentMethods = [],
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

  const sortedCategoryEntries = Object.entries(categoryGrouped).sort((a, b) => b[1].amount - a[1].amount);
  const sortedPaymentEntries = Object.entries(paymentGrouped).sort((a, b) => b[1].amount - a[1].amount);

  const hasContent =
    viewMode === 'category'
      ? sortedCategoryEntries.length > 0 || !!recurringItem
      : sortedPaymentEntries.length > 0 || !!recurringItem;

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
        {/* 定期アイテムは常に表示 */}
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
          : sortedPaymentEntries.map(([key, { name, amount, transactions: pmTransactions }]) => (
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
            ))}
      </div>
    </div>
  );
};
