import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { PaymentMethod, Transaction, Category } from '../../types';

interface CardGridSectionProps {
  paymentMethods: PaymentMethod[];
  cardUnsettledList: Array<{
    paymentMethod: PaymentMethod;
    unsettledAmount: number;
    unsettledTransactions: Transaction[];
  }>;
  onCardClick: (paymentMethod: PaymentMethod, transactions: Transaction[]) => void;
  onAddClick?: () => void;
  viewMode?: 'card' | 'category';
  categories?: Category[];
}

export const CardGridSection = ({
  paymentMethods,
  cardUnsettledList,
  onCardClick,
  onAddClick,
  viewMode = 'category',
  categories = [],
}: CardGridSectionProps) => {
  const shouldShowGrid = paymentMethods.length > 0 || onAddClick;

  if (!shouldShowGrid) {
    return null;
  }

  if (viewMode === 'category') {
    const allTransactions = cardUnsettledList.flatMap((c) => c.unsettledTransactions);

    const grouped = allTransactions.reduce(
      (acc, t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const key = t.categoryId;
        if (!acc[key]) {
          acc[key] = { category: cat, amount: 0 };
        }
        acc[key].amount += t.type === 'expense' ? t.amount : -t.amount;
        return acc;
      },
      {} as Record<string, { category: Category | undefined; amount: number }>
    );

    const sortedEntries = Object.entries(grouped).sort((a, b) => b[1].amount - a[1].amount);

    if (sortedEntries.length === 0) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 md:p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">利用なし</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 md:p-4">
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {sortedEntries.map(([categoryId, { category, amount }]) => (
            <div
              key={categoryId}
              className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 h-24 md:h-28 flex flex-col justify-between"
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
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 md:p-4">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {paymentMethods.map((pm) => {
          const cardInfo = cardUnsettledList.find(c => c.paymentMethod.id === pm.id);
          const pendingAmount = cardInfo?.unsettledAmount || 0;

          return (
            <button
              key={pm.id}
              onClick={() => {
                onCardClick(pm, cardInfo?.unsettledTransactions || []);
              }}
              className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 hover:opacity-80 transition-opacity text-left h-24 md:h-28 flex flex-col justify-between"
            >
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {pm.name}
              </p>
              <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(pendingAmount)}
              </p>
            </button>
          );
        })}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 h-24 md:h-28 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus size={24} className="text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};
