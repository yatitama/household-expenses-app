import { Tag, CreditCard, Users } from 'lucide-react';
import type { RecurringPaymentGridViewMode } from './RecurringPaymentGridSection';

interface RecurringGroupingHeaderProps {
  viewMode: RecurringPaymentGridViewMode;
  onViewModeChange: (mode: RecurringPaymentGridViewMode) => void;
}

export const RecurringGroupingHeader = ({
  viewMode,
  onViewModeChange,
}: RecurringGroupingHeaderProps) => {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onViewModeChange('category')}
        className={`p-1 rounded transition-colors ${
          viewMode === 'category'
            ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-slate-700'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
        }`}
        title="カテゴリ別"
      >
        <Tag size={13} />
      </button>
      <button
        onClick={() => onViewModeChange('payment')}
        className={`p-1 rounded transition-colors ${
          viewMode === 'payment'
            ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-slate-700'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
        }`}
        title="支払い元別"
      >
        <CreditCard size={13} />
      </button>
      <button
        onClick={() => onViewModeChange('member')}
        className={`p-1 rounded transition-colors ${
          viewMode === 'member'
            ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-slate-700'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
        }`}
        title="メンバー別"
      >
        <Users size={13} />
      </button>
    </div>
  );
};
