import { Edit2, Trash2, PlusCircle, Link2 } from 'lucide-react';
import { categoryService } from '../../services/storage';
import { formatCurrency } from '../../utils/formatters';
import { PM_TYPE_ICONS } from './AccountIcons';
import { PM_TYPE_LABELS, BILLING_TYPE_LABELS } from './constants';
import { RecurringPaymentsList } from './RecurringPaymentsList';
import type { PaymentMethod, RecurringPayment } from '../../types';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  linkedAccountName?: string;
  pendingAmount: number;
  recurringPayments: RecurringPayment[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
}

export const PaymentMethodCard = ({
  paymentMethod, linkedAccountName, pendingAmount, recurringPayments,
  onView, onEdit, onDelete, onAddTransaction, onAddRecurring,
  onEditRecurring, onDeleteRecurring, onToggleRecurring,
}: PaymentMethodCardProps) => {
  const categories = categoryService.getAll();
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start">
        <button onClick={onView} className="flex items-center gap-3 flex-1 text-left">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: paymentMethod.color }}
          >
            {PM_TYPE_ICONS[paymentMethod.type]}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100">{paymentMethod.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{PM_TYPE_LABELS[paymentMethod.type]} ・ {BILLING_TYPE_LABELS[paymentMethod.billingType]}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Link2 size={12} className={linkedAccountName ? 'text-gray-400' : 'text-amber-500'} />
              <span className={`text-xs ${linkedAccountName ? 'text-gray-400 dark:text-gray-500' : 'text-amber-500 font-medium'}`}>
                {linkedAccountName || '引き落とし先未設定'}
              </span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onAddTransaction} className="p-2 text-purple-500 hover:text-purple-700 dark:text-purple-400" title="取引追加" aria-label="取引を追加">
            <PlusCircle size={18} />
          </button>
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" aria-label="支払い手段を編集">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400" aria-label="支払い手段を削除">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {pendingAmount > 0 && (
        <div className="mt-2 text-right">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">未精算: {formatCurrency(pendingAmount)}</p>
        </div>
      )}
      <RecurringPaymentsList
        items={recurringPayments}
        onAdd={onAddRecurring}
        onEdit={onEditRecurring}
        onDelete={onDeleteRecurring}
        onToggle={onToggleRecurring}
        getCategory={getCategory}
      />
    </div>
  );
};
