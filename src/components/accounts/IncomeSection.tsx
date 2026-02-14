import { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { categoryService } from '../../services/storage';
import type { RecurringPayment } from '../../types';

interface IncomeSectionProps {
 upcomingIncome: RecurringPayment[];
 totalRecurringIncome: number;
 onEditRecurring: (rp: RecurringPayment) => void;
 onToggleRecurring: (rp: RecurringPayment) => void;
}

export const IncomeSection = ({
 upcomingIncome,
 totalRecurringIncome,
 onEditRecurring,
 onToggleRecurring,
}: IncomeSectionProps) => {
 const [isExpanded, setIsExpanded] = useState(false);
 const categories = categoryService.getAll();

 const getCategory = (categoryId: string) => {
 return categories.find((c) => c.id === categoryId);
 };

 return (
 <div className="bg-white dark:bg-slate-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-gray-800/30">
 {/* ヘッダー */}
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
 >
 <div className="flex items-center gap-2">
 {isExpanded ? (
 <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
 ) : (
 <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
 )}
 <TrendingUp size={16} className="text-gray-700 dark:text-gray-600" />
 <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
 振り込み予定
 </span>
 </div>
 <span className="text-base md:text-lg font-bold text-gray-700 dark:text-gray-600">
 {formatCurrency(totalRecurringIncome)}
 </span>
 </button>

 {/* 展開時のコンテンツ */}
 {isExpanded && (
 <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
 {upcomingIncome.length === 0 ? (
 <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
 定期収入予定なし
 </p>
 ) : (
 <div className="space-y-1.5">
 {upcomingIncome.map((rp) => {
 const category = getCategory(rp.categoryId);
 const freqLabel = rp.frequency === 'monthly'
 ? `毎月${rp.dayOfMonth}日`
 : `毎年${rp.monthOfYear}月${rp.dayOfMonth}日`;

 return (
 <div
 key={rp.id}
 className={`flex items-center justify-between text-xs md:text-sm gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors ${rp.isActive ? '' : 'opacity-40'}`}
 >
 <div className="flex items-center gap-2 min-w-0 flex-1">
 <button
 onClick={() => onToggleRecurring(rp)}
 className="flex-shrink-0 hover:opacity-70 transition-opacity"
 >
 {rp.isActive
 ? <ToggleRight size={16} className="text-gray-600" />
 : <ToggleLeft size={16} className="text-gray-300 dark:text-gray-600" />
 }
 </button>
 <div
 className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
 style={{ backgroundColor: `${category?.color || '#8b7355'}20`, color: category?.color || '#8b7355' }}
 >
 {getCategoryIcon(category?.icon || '', 12)}
 </div>
 <button
 onClick={() => onEditRecurring(rp)}
 className="flex-1 flex flex-col gap-0.5 min-w-0 hover:opacity-70 transition-opacity text-left"
 >
 <p className="truncate text-gray-900 dark:text-gray-100">{rp.name}</p>
 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{freqLabel}</p>
 </button>
 </div>
 <span className="text-gray-700 dark:text-gray-600 font-semibold flex-shrink-0">
 {formatCurrency(rp.amount)}
 </span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}
 </div>
 );
};
