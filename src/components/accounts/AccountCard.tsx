import { PlusCircle, GripHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
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
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
  onAddLinkedPM: () => void;
  onToggleLinkedPM: (lpm: LinkedPaymentMethod) => void;
  onViewPM: (pm: PaymentMethod) => void;
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
  onView, onAddTransaction, onAddRecurring,
  onEditRecurring, onToggleRecurring,
  onAddLinkedPM, onToggleLinkedPM,
  onViewPM,
  isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onTouchStart, onTouchMove, onTouchEnd, onTouchCancel,
}: AccountCardProps) => {
  const [isPendingDetailsOpen, setIsPendingDetailsOpen] = useState(false);
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
      {/* 並び替えアイコン - 上部中央 */}
      <div className="flex justify-center -mt-2 mb-2">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          className="cursor-grab active:cursor-grabbing p-1 min-w-[44px] min-h-[32px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
          style={{ touchAction: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
          title="ドラッグして並び替え"
        >
          <GripHorizontal size={20} />
        </button>
      </div>

      {/* 口座情報 */}
      <div className="flex items-start gap-3">
        <button onClick={onView} className="flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: account.color }}
          >
            {ACCOUNT_TYPE_ICONS[account.type]}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          {/* メンバーバッジとプラスボタン */}
          <div className="flex justify-between items-center mb-0.5">
            {member && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: member.color }}
              >
                {member.name}
              </span>
            )}
            <button onClick={onAddTransaction} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 -mr-2" title="取引追加" aria-label="取引を追加">
              <PlusCircle size={18} />
            </button>
          </div>
          {/* 口座名 */}
          <button onClick={onView} className="text-left w-full mb-1">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{account.name}</p>
          </button>
          {/* 銀行タイプと金額 */}
          <div className="flex justify-between items-center gap-2">
            <button onClick={onView} className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{ACCOUNT_TYPE_LABELS[account.type]}</p>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              {((totalPendingData && (totalPendingData.cardPending > 0 || totalPendingData.recurringExpense > 0 || totalPendingData.recurringIncome > 0)) || pendingAmount > 0) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPendingDetailsOpen(!isPendingDetailsOpen); }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title={isPendingDetailsOpen ? "詳細を閉じる" : "詳細を表示"}
                  aria-label={isPendingDetailsOpen ? "詳細を閉じる" : "詳細を表示"}
                >
                  {isPendingDetailsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
              )}
              <button onClick={onView} className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(account.balance)}</p>
              </button>
            </div>
          </div>
        </div>
      </div>
      {isPendingDetailsOpen && (
        <div className="mt-2 text-right text-xs text-gray-500 dark:text-gray-400 space-y-0.5 pr-2">
          {totalPendingData ? (
            <>
              {(totalPendingData.cardPending > 0 || totalPendingData.recurringExpense > 0) && (
                <p>使う予定: -{formatCurrency(totalPendingData.cardPending + totalPendingData.recurringExpense)}</p>
              )}
              {totalPendingData.recurringIncome > 0 && (
                <p>入る予定: +{formatCurrency(totalPendingData.recurringIncome)}</p>
              )}
              <p className="font-medium text-gray-700 dark:text-gray-300">実質: {formatCurrency(account.balance - totalPendingData.totalPending)}</p>
            </>
          ) : pendingAmount > 0 ? (
            <p>引落後: {formatCurrency(account.balance - pendingAmount)}</p>
          ) : null}
        </div>
      )}
      <RecurringAndLinkedList
        recurringItems={recurringPayments}
        linkedItems={linkedPaymentMethodsData}
        onAddRecurring={onAddRecurring}
        onEditRecurring={onEditRecurring}
        onToggleRecurring={onToggleRecurring}
        onAddLinked={onAddLinkedPM}
        onToggleLinked={onToggleLinkedPM}
        onViewPM={onViewPM}
        getCategory={getCategory}
        getPaymentMethod={getPaymentMethod}
        getUnsettledAmount={getUnsettledAmount}
      />
    </div>
  );
};
