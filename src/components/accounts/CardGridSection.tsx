import { formatCurrency } from '../../utils/formatters';
import { PM_TYPE_ICONS } from './AccountIcons';
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
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: pm.color }}
                >
                  {PM_TYPE_ICONS[pm.type]}
                </div>
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {pm.name}
                </p>
              </div>
              {pendingAmount > 0 && (
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  引落予定: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(pendingAmount)}</span>
                </p>
              )}
              {pendingAmount === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  引落予定なし
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
