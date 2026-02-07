import { Edit2, Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { categoryService } from '../../services/storage';
import { formatCurrency } from '../../utils/formatters';
import { ACCOUNT_TYPE_ICONS } from './AccountIcons';
import { ACCOUNT_TYPE_LABELS } from './constants';
import { RecurringAndLinkedList } from './RecurringAndLinkedList';
import type { Account, Member, RecurringPayment, PaymentMethod, LinkedPaymentMethod } from '../../types';

interface AccountCardProps {
  account: Account;
  member?: Member;
  pendingAmount: number;
  totalPendingData?: {
    cardPending: number;
    recurringExpense: number;
    recurringIncome: number;
    totalPending: number;
  };
  linkedPaymentMethodsData: LinkedPaymentMethod[];
  allPaymentMethods: PaymentMethod[];
  pendingByPM: Record<string, number>;
  recurringPayments: RecurringPayment[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
  onAddLinkedPM: () => void;
  onToggleLinkedPM: (lpm: LinkedPaymentMethod) => void;
  onViewPM: (pm: PaymentMethod) => void;
  onEditPM: (pm: PaymentMethod) => void;
  onDeletePM: (pmId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
}

export const AccountCard = ({
  account, member, pendingAmount, totalPendingData, linkedPaymentMethodsData, allPaymentMethods, pendingByPM, recurringPayments,
  onView, onEdit, onDelete, onAddTransaction, onAddRecurring,
  onEditRecurring, onDeleteRecurring, onToggleRecurring,
  onAddLinkedPM, onToggleLinkedPM,
  onViewPM, onEditPM, onDeletePM,
  isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onTouchStart, onTouchMove, onTouchEnd, onTouchCancel,
}: AccountCardProps) => {
  const categories = categoryService.getAll();
  const getPaymentMethod = (id: string) => allPaymentMethods.find((pm) => pm.id === id);
  const getUnsettledAmount = (paymentMethodId: string) => pendingByPM[paymentMethodId] || 0;
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  return (
    <div
      data-account-id={account.id}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        userSelect: isDragging ? 'none' : 'auto',
        WebkitUserSelect: isDragging ? 'none' : 'auto',
      }}
      className={`bg-white dark:bg-slate-800 rounded-xl p-4 transition-all duration-200 ${
        isDragging ? 'opacity-70 shadow-lg scale-[1.02] ring-2 ring-blue-400 z-10 relative' : 'shadow-sm'
      } ${isDragOver ? 'border-2 border-blue-400 bg-blue-50/60 dark:bg-blue-900/20' : 'border-2 border-transparent'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 flex-1">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchCancel}
            className="cursor-grab active:cursor-grabbing p-2 -ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
            style={{ touchAction: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
            title="ドラッグして並び替え"
          >
            <GripVertical size={20} />
          </button>
          <button onClick={onView} className="flex items-center gap-3 flex-1 text-left">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: account.color }}
            >
              {ACCOUNT_TYPE_ICONS[account.type]}
            </div>
            <div className="flex-1 min-w-0">
              {member && (
                <div className="mb-0.5">
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name}
                  </span>
                </div>
              )}
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{account.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{ACCOUNT_TYPE_LABELS[account.type]}</p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onAddTransaction} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400" title="取引追加">
            <PlusCircle size={18} />
          </button>
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <button onClick={onView} className="mt-3 text-right w-full">
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(account.balance)}</p>
        {totalPendingData && (totalPendingData.cardPending > 0 || totalPendingData.recurringExpense > 0 || totalPendingData.recurringIncome > 0) ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
            {(totalPendingData.cardPending > 0 || totalPendingData.recurringExpense > 0) && (
              <p>使う予定: -{formatCurrency(totalPendingData.cardPending + totalPendingData.recurringExpense)}</p>
            )}
            {totalPendingData.recurringIncome > 0 && (
              <p>入る予定: +{formatCurrency(totalPendingData.recurringIncome)}</p>
            )}
            <p className="font-medium text-gray-700 dark:text-gray-300">実質: {formatCurrency(account.balance - totalPendingData.totalPending)}</p>
          </div>
        ) : pendingAmount > 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            引落後: {formatCurrency(account.balance - pendingAmount)}
          </p>
        ) : null}
      </button>
      <RecurringAndLinkedList
        recurringItems={recurringPayments}
        linkedItems={linkedPaymentMethodsData}
        onAddRecurring={onAddRecurring}
        onEditRecurring={onEditRecurring}
        onDeleteRecurring={onDeleteRecurring}
        onToggleRecurring={onToggleRecurring}
        onAddLinked={onAddLinkedPM}
        onToggleLinked={onToggleLinkedPM}
        onViewPM={onViewPM}
        onEditPM={onEditPM}
        onDeletePM={onDeletePM}
        getCategory={getCategory}
        getPaymentMethod={getPaymentMethod}
        getUnsettledAmount={getUnsettledAmount}
      />
    </div>
  );
};
