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
}

export const CardGridSection = ({
  paymentMethods,
  cardUnsettledList,
  onCardClick,
}: CardGridSectionProps) => {
  if (paymentMethods.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-3 md:p-4">
      <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        カード一覧
      </h3>
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
      </div>
    </div>
  );
};
