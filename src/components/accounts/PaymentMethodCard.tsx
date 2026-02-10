import { Link2 } from 'lucide-react';
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
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
}

export const PaymentMethodCard = ({
  paymentMethod, linkedAccountName, pendingAmount, recurringPayments,
  onView, onAddRecurring,
  onEditRecurring, onToggleRecurring,
}: PaymentMethodCardProps) => {
  const categories = categoryService.getAll();
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg md:rounded-xl shadow-sm p-3 md:p-4">
      <div className="flex items-start">
        <button onClick={onView} className="flex items-center gap-2 md:gap-3 flex-1 text-left" aria-label={`${paymentMethod.name}の詳細を表示`}>
          <div
            className="w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: paymentMethod.color }}
          >
            {PM_TYPE_ICONS[paymentMethod.type]}
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">{paymentMethod.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{PM_TYPE_LABELS[paymentMethod.type]} ・ {BILLING_TYPE_LABELS[paymentMethod.billingType]}</p>
            <div className="flex items-center gap-0.5 md:gap-1 mt-0.5">
              <Link2 size={10} className="md:w-3 md:h-3" style={{color: linkedAccountName ? '#9ca3af' : '#d97706'}} />
              <span className={`text-xs ${linkedAccountName ? 'text-gray-500 dark:text-gray-400' : 'text-amber-500 font-medium'}`}>
                {linkedAccountName || '引き落とし先未設定'}
              </span>
            </div>
          </div>
        </button>
      </div>
      {pendingAmount > 0 && (
        <div className="mt-1.5 md:mt-2 text-right">
          <p className="text-xs md:text-sm text-orange-600 dark:text-orange-400 font-medium">未精算: {formatCurrency(pendingAmount)}</p>
        </div>
      )}
      <RecurringPaymentsList
        items={recurringPayments}
        onAdd={onAddRecurring}
        onEdit={onEditRecurring}
        onToggle={onToggleRecurring}
        getCategory={getCategory}
      />
    </div>
  );
};
