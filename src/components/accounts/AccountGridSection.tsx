import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ACCOUNT_TYPE_ICONS_LG } from './AccountIcons';
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
    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 md:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => onAccountClick?.(account)}
            className="border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 text-left flex flex-col gap-2 hover:opacity-80 transition-all relative overflow-hidden"
          >
            {/* Background Icon */}
            <div
              className="absolute -left-2 -bottom-2 opacity-10 dark:opacity-20 pointer-events-none blur-sm"
              style={{
                color: account.color,
              }}
            >
              {ACCOUNT_TYPE_ICONS_LG[account.type]}
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center gap-1.5">
              <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {account.name}
              </p>
            </div>
            <p className="relative z-10 text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(account.balance)}
            </p>
          </button>
        ))}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="border border-gray-200 dark:border-gray-700 p-2.5 md:p-3 flex items-center justify-center hover:opacity-80 dark:hover:opacity-80 transition-all"
          >
            <Plus size={24} className="text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};
