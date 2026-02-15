import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Account } from '../../types';

interface AccountGridSectionProps {
  accounts: Account[];
  onAddClick?: () => void;
  onAccountClick?: (account: Account) => void;
}

export const AccountGridSection = ({ accounts, onAddClick, onAccountClick }: AccountGridSectionProps) => {
  const shouldShowGrid = accounts.length > 0 || onAddClick;

  if (!shouldShowGrid) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-3 md:p-4">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => onAccountClick?.(account)}
            className="p-3 md:p-4 text-left h-24 md:h-28 flex flex-col justify-between hover:opacity-80 transition-opacity"
            style={{
              borderTop: '2px solid #d1d5db',
              borderLeft: '2px solid #d1d5db',
              borderBottom: '3px solid #6b7280',
              borderRight: '3px solid #6b7280',
            }}
          >
            <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {account.name}
            </p>
            <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(account.balance)}
            </p>
          </button>
        ))}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="p-3 md:p-4 h-24 md:h-28 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            style={{
              borderTop: '2px solid #d1d5db',
              borderLeft: '2px solid #d1d5db',
              borderBottom: '3px solid #6b7280',
              borderRight: '3px solid #6b7280',
            }}
          >
            <Plus size={24} className="text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};
