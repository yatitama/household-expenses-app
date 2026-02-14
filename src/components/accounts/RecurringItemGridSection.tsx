import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { RecurringPayment, Category } from '../../types';

interface RecurringItemGridSectionProps {
  title: string;
  items: RecurringPayment[];
  getCategory: (categoryId: string) => Category | undefined;
  onItemClick: (recurringPayment: RecurringPayment) => void;
}

export const RecurringItemGridSection = ({
  title,
  items,
  getCategory,
  onItemClick,
}: RecurringItemGridSectionProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-3 md:p-4">
      <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {items.map((item) => {
          const category = getCategory(item.categoryId);

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className={`border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 hover:opacity-80 transition-opacity text-left h-24 md:h-28 flex flex-col justify-between ${
                item.isActive ? '' : 'opacity-40'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
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
                  {item.name}
                </p>
              </div>
              <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(item.amount)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
