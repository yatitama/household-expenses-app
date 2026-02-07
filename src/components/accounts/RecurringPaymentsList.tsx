import { Plus, Edit2, Trash2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { RecurringPayment } from '../../types';

interface RecurringPaymentsListProps {
  items: RecurringPayment[];
  onAdd: () => void;
  onEdit: (rp: RecurringPayment) => void;
  onDelete: (id: string) => void;
  onToggle: (rp: RecurringPayment) => void;
  getCategory: (id: string) => { name: string; color: string; icon: string } | undefined;
}

export const RecurringPaymentsList = ({ items, onAdd, onEdit, onDelete, onToggle, getCategory }: RecurringPaymentsListProps) => {
  return (
    <div className="mt-3 pt-3 border-t border-brand-100 dark:border-brand-800">
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-xs text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1">
          <RefreshCw size={10} />
          定期取引
        </p>
        <button onClick={onAdd} className="text-brand-500 hover:text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-all duration-300">
          <Plus size={14} />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-brand-300 dark:text-brand-700">定期取引なし</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((rp) => {
            const category = getCategory(rp.categoryId);
            const freqLabel = rp.frequency === 'monthly'
              ? `毎月${rp.dayOfMonth}日`
              : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;
            return (
              <div key={rp.id} className={`flex items-center justify-between text-xs ${rp.isActive ? '' : 'opacity-40'}`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button onClick={() => onToggle(rp)} className="flex-shrink-0">
                    {rp.isActive
                      ? <ToggleRight size={16} className="text-green-500" />
                      : <ToggleLeft size={16} className="text-gray-300 dark:text-gray-600" />
                    }
                  </button>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                  >
                    {getCategoryIcon(category?.icon || '', 12)}
                  </div>
                  <span className="truncate text-brand-700 dark:text-brand-300">{rp.name}</span>
                  <span className="text-brand-400 dark:text-brand-500 flex-shrink-0">{freqLabel}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <span className={`font-medium ${rp.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {formatCurrency(rp.amount)}
                  </span>
                  <button onClick={() => onEdit(rp)} className="p-1 text-brand-300 hover:text-brand-500 dark:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-all duration-300">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => onDelete(rp.id)} className="p-1 text-brand-300 hover:text-red-500 dark:text-brand-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-300">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
