import { formatCurrency } from '../../utils/formatters';
import type { Account } from '../../types';

interface AccountGridSectionProps {
  accounts: Account[];
}

export const AccountGridSection = ({ accounts }: AccountGridSectionProps) => {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-3 md:p-4">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="border border-gray-200 dark:border-gray-700 p-3 md:p-4 text-left h-24 md:h-28 flex flex-col justify-between"
          >
            <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {account.name}
            </p>
            <p className="text-right text-sm md:text-base font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(account.balance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
