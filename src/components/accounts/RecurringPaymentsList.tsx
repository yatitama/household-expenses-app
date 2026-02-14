import { Plus, RefreshCw, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { RecurringPayment } from '../../types';

interface RecurringPaymentsListProps {
  items: RecurringPayment[];
  onAdd: () => void;
  onEdit: (rp: RecurringPayment) => void;
  onToggle: (rp: RecurringPayment) => void;
  getCategory: (id: string) => { name: string; color: string; icon: string } | undefined;
}

export const RecurringPaymentsList = ({ items, onAdd, onEdit, onToggle, getCategory }: RecurringPaymentsListProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 pt-3 dark:border-gray-700">
      <div className="flex justify-between items-center mb-1.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <RefreshCw size={12} />
          定期取引
        </button>
        <button onClick={onAdd} className="text-gray-700 hover:text-gray-800 dark:text-gray-600">
          <Plus size={16} />
        </button>
      </div>
      {isOpen && (
        <>
          {items.length === 0 ? (
            <p className="text-sm text-gray-300 dark:text-gray-600">定期取引なし</p>
          ) : (
            <div className="space-y-2">
              {items.map((rp) => {
                const category = getCategory(rp.categoryId);
                const freqLabel = rp.frequency === 'monthly'
                  ? `毎月${rp.dayOfMonth}日`
                  : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;
                return (
                  <div key={rp.id} className={`flex items-center justify-between text-sm ${rp.isActive ? '' : 'opacity-40'}`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button onClick={() => onToggle(rp)} className="flex-shrink-0">
                        {rp.isActive
                          ? <ToggleRight size={18} className="text-gray-600" />
                          : <ToggleLeft size={18} className="text-gray-300 dark:text-gray-600" />
                        }
                      </button>
                      <button onClick={() => onEdit(rp)} className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-70 transition-opacity">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                        >
                          {getCategoryIcon(category?.icon || '', 14)}
                        </div>
                        <span className="truncate text-gray-900 dark:text-gray-200">{rp.name}</span>
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 text-sm">{freqLabel}</span>
                      </button>
                    </div>
                    <div className="flex justify-end w-28 ml-2">
                      <span className={`font-medium font-mono ${rp.type === 'expense' ? 'text-gray-900 dark:text-gray-700' : 'text-gray-700 dark:text-gray-600'}`}>
                        {formatCurrency(rp.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
