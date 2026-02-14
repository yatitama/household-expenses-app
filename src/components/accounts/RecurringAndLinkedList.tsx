import { Plus, RefreshCw, CreditCard, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
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
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isLinkedOpen, setIsLinkedOpen] = useState(false);

  return (
 <div className="mt-3 pt-3 space-y-3">       {/* 定期取引セクション */}
      <div>
 <div className="flex justify-between items-center mb-1.5">           <button
            onClick={() => setIsRecurringOpen(!isRecurringOpen)}
 className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200"           >
            {isRecurringOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <RefreshCw size={12} />
            定期取引
          </button>
 <button onClick={onAddRecurring} className="text-gray-700 hover:text-gray-800 dark:text-gray-600" aria-label="定期取引を追加">             <Plus size={16} />
          </button>
        </div>
        {isRecurringOpen && (
          <>
            {recurringItems.length === 0 ? (
 <p className="text-xs md:text-sm text-gray-300 dark:text-gray-600">定期取引なし</p>             ) : (
 <div className="space-y-2">                 {recurringItems.map((rp) => {
                  const category = getCategory(rp.categoryId);
                  const freqLabel = rp.frequency === 'monthly'
                    ? `毎月${rp.dayOfMonth}日`
                    : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;
                  return (
 <div key={rp.id} className={`flex items-center justify-between text-xs md:text-sm ${rp.isActive ? '' : 'opacity-40'}`}>  <div className="flex items-center gap-2 min-w-0 flex-1">  <button onClick={() => onToggleRecurring(rp)} className="flex-shrink-0">                           {rp.isActive
 ? <ToggleRight size={18} className="text-gray-600" />  : <ToggleLeft size={18} className="text-gray-300 dark:text-gray-600" />                           }
                        </button>
 <button onClick={() => onEditRecurring(rp)} className="flex items-center gap-2 min-w-0 flex-1 text-left hover:opacity-70 transition-opacity">                           <div
 className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"                             style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                          >
                            {getCategoryIcon(category?.icon || '', 14)}
                          </div>
 <span className="truncate text-gray-900 dark:text-gray-200">{rp.name}</span>  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 text-sm">{freqLabel}</span>                         </button>
                      </div>
 <span className={`font-medium flex-shrink-0 ml-2 ${rp.type === 'expense' ? 'text-gray-900 dark:text-gray-700' : 'text-gray-700 dark:text-gray-600'}`}>                         {formatCurrency(rp.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* 支払い手段セクション */}
      <div>
 <div className="flex justify-between items-center mb-1.5">           <button
            onClick={() => setIsLinkedOpen(!isLinkedOpen)}
 className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200"           >
            {isLinkedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <CreditCard size={12} />
            支払い手段
          </button>
 <button onClick={onAddLinked} className="text-gray-700 hover:text-gray-800 dark:text-gray-600" aria-label="支払い手段を追加">             <Plus size={16} />
          </button>
        </div>
        {isLinkedOpen && (
          <>
            {linkedItems.length === 0 ? (
 <p className="text-xs md:text-sm text-gray-300 dark:text-gray-600">支払い手段なし</p>             ) : (
 <div className="space-y-2">                 {linkedItems.map((lpm) => {
                  const pm = getPaymentMethod(lpm.paymentMethodId);
                  if (!pm) return null;
                  const unsettledAmount = getUnsettledAmount(pm.id);
                  const paymentLabel = pm.paymentDay ? `毎月${pm.paymentDay}日` : '支払日なし';
                  return (
 <div key={lpm.id} className={`flex items-center justify-between text-xs md:text-sm ${lpm.isActive ? '' : 'opacity-40'}`}>  <div className="flex items-center gap-2 min-w-0 flex-1">  <button onClick={() => onToggleLinked(lpm)} className="flex-shrink-0">                           {lpm.isActive
 ? <ToggleRight size={18} className="text-gray-600" />  : <ToggleLeft size={18} className="text-gray-300 dark:text-gray-600" />                           }
                        </button>
                        <div
 className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"                           style={{ backgroundColor: `${pm.color}20`, color: pm.color }}
                        >
                          <CreditCard size={14} />
                        </div>
 <button onClick={() => onViewPM(pm)} className="truncate text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">                           {pm.name}
                        </button>
 <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 text-sm">{paymentLabel}</span>                       </div>
 <span className="font-medium text-gray-900 dark:text-gray-700 flex-shrink-0 ml-2">                         {formatCurrency(unsettledAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
