import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { PaymentMethod, Transaction } from '../../types';

interface CardGridSectionProps {
  paymentMethods: PaymentMethod[];
  cardUnsettledList: Array<{
    paymentMethod: PaymentMethod;
    unsettledAmount: number;
    unsettledTransactions: Transaction[];
  }>;
  onCardClick: (paymentMethod: PaymentMethod, transactions: Transaction[]) => void;
  onAddClick?: () => void;
}

export const CardGridSection = ({
  paymentMethods,
  cardUnsettledList,
  onCardClick,
  onAddClick,
}: CardGridSectionProps) => {
  const shouldShowGrid = paymentMethods.length > 0 || onAddClick;

  if (!shouldShowGrid) {
    return null;
  }

  return (
    <div className="rounded-lg p-3 md:p-4">
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
            className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 h-24 md:h-28 flex items-center justify-center hover:bg-gray-50 dark:hover:transition-colors"
          >
            <Plus size={24} className="text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};
