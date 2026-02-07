import { Plus, RefreshCw, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { RecurringPayment, PaymentMethod, LinkedPaymentMethod } from '../../types';

interface RecurringAndLinkedListProps {
  recurringItems: RecurringPayment[];
  linkedItems: LinkedPaymentMethod[];
  onAddRecurring: () => void;
  onEditRecurring: (rp: RecurringPayment) => void;
  onToggleRecurring: (rp: RecurringPayment) => void;
  onAddLinked: () => void;
  onToggleLinked: (lpm: LinkedPaymentMethod) => void;
  onViewPM: (pm: PaymentMethod) => void;
  getCategory: (id: string) => { name: string; color: string; icon: string } | undefined;
  getPaymentMethod: (id: string) => PaymentMethod | undefined;
  getUnsettledAmount: (paymentMethodId: string) => number;
}

export const RecurringAndLinkedList = ({
  recurringItems, linkedItems,
  onAddRecurring, onEditRecurring, onToggleRecurring,
  onAddLinked, onToggleLinked,
  onViewPM,
  getCategory, getPaymentMethod, getUnsettledAmount,
}: RecurringAndLinkedListProps) => {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
      {/* 定期取引セクション */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
            <RefreshCw size={10} />
            定期取引
          </p>
          <button onClick={onAddRecurring} className="text-blue-500 hover:text-blue-700 dark:text-blue-400" aria-label="定期取引を追加">
            <Plus size={14} />
          </button>
        </div>
        {recurringItems.length === 0 ? (
          <p className="text-xs text-gray-300 dark:text-gray-600">定期取引なし</p>
        ) : (
          <div className="space-y-1.5">
            {recurringItems.map((rp) => {
              const category = getCategory(rp.categoryId);
              const freqLabel = rp.frequency === 'monthly'
                ? `毎月${rp.dayOfMonth}日`
                : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;
              return (
                <div key={rp.id} className={`flex items-center justify-between text-xs ${rp.isActive ? '' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button onClick={() => onToggleRecurring(rp)} className="flex-shrink-0">
                      {rp.isActive
                        ? <ToggleRight size={16} className="text-green-500" />
                        : <ToggleLeft size={16} className="text-gray-300 dark:text-gray-600" />
                      }
                    </button>
                    <button onClick={() => onEditRecurring(rp)} className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-70 transition-opacity">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                      >
                        {getCategoryIcon(category?.icon || '', 12)}
                      </div>
                      <span className="truncate text-gray-700 dark:text-gray-300">{rp.name}</span>
                      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{freqLabel}</span>
                    </button>
                  </div>
                  <span className={`font-medium flex-shrink-0 ml-2 ${rp.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {formatCurrency(rp.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 支払い手段セクション */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
            <CreditCard size={10} />
            支払い手段
          </p>
          <button onClick={onAddLinked} className="text-blue-500 hover:text-blue-700 dark:text-blue-400" aria-label="支払い手段を追加">
            <Plus size={14} />
          </button>
        </div>
        {linkedItems.length === 0 ? (
          <p className="text-xs text-gray-300 dark:text-gray-600">支払い手段なし</p>
        ) : (
          <div className="space-y-1.5">
            {linkedItems.map((lpm) => {
              const pm = getPaymentMethod(lpm.paymentMethodId);
              if (!pm) return null;
              const unsettledAmount = getUnsettledAmount(pm.id);
              const paymentLabel = pm.paymentDay ? `毎月${pm.paymentDay}日` : '支払日なし';
              return (
                <div key={lpm.id} className={`flex items-center justify-between text-xs ${lpm.isActive ? '' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button onClick={() => onToggleLinked(lpm)} className="flex-shrink-0">
                      {lpm.isActive
                        ? <ToggleRight size={16} className="text-green-500" />
                        : <ToggleLeft size={16} className="text-gray-300 dark:text-gray-600" />
                      }
                    </button>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${pm.color}20`, color: pm.color }}
                    >
                      <CreditCard size={12} />
                    </div>
                    <button onClick={() => onViewPM(pm)} className="truncate text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                      {pm.name}
                    </button>
                    <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{paymentLabel}</span>
                  </div>
                  <span className="font-medium text-red-600 dark:text-red-400 flex-shrink-0 ml-2">
                    {formatCurrency(unsettledAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
