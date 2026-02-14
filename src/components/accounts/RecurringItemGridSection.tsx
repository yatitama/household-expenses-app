import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { RecurringPayment } from '../../types';

interface RecurringItemGridSectionProps {
  title: string;
  items: RecurringPayment[];
  onItemClick: (recurringPayment: RecurringPayment) => void;
  onAddClick?: () => void;
}

export const RecurringItemGridSection = ({
  title,
  items,
  onItemClick,
  onAddClick,
}: RecurringItemGridSectionProps) => {
  const shouldShowGrid = items.length > 0 || onAddClick;

  if (!shouldShowGrid) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-3 md:p-4">
      <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {items.map((item) => {
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 hover:opacity-80 transition-opacity text-left h-24 md:h-28 flex flex-col justify-between"
            >
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {item.name}
              </p>
              <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(item.amount)}
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
