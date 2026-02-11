import { Wallet, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../hooks/useTheme';
import { getThemeGradient } from '../../utils/themes';
import { Tooltip } from '../feedback/Tooltip';
import { ACCOUNT_TYPE_ICONS_SM } from './AccountIcons';
import type { Account, Member } from '../../types';

interface TotalPendingData {
  cardPending: number;
  recurringExpense: number;
  recurringIncome: number;
  totalPending: number;
}

interface AssetCardProps {
  totalBalance: number;
  totalExpense: number;
  totalIncome: number;
  netPending: number;
  accounts: Account[];
  groupedAccounts: Record<string, Account[]>;
  totalPendingByAccount: Record<string, TotalPendingData>;
  getMember: (memberId: string) => Member | undefined;
  isBreakdownOpen: boolean;
  onToggleBreakdown: () => void;
}


export const AssetCard = ({
  totalBalance,
  totalExpense,
  totalIncome,
  netPending,
  accounts,
  groupedAccounts,
  totalPendingByAccount,
  getMember,
  isBreakdownOpen,
  onToggleBreakdown,
}: AssetCardProps) => {
  const { currentTheme } = useTheme();
  const gradient = getThemeGradient(currentTheme);

  return (
    <div
      className="rounded-lg md:rounded-xl p-3 md:p-4 text-white relative"
      style={{ background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})` }}
    >
      <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
        <Wallet size={16} className="md:w-5 md:h-5" />
        <span className="text-xs md:text-sm opacity-90">総資産</span>
      </div>
      <p className="text-xl md:text-2xl font-bold">{formatCurrency(totalBalance)}</p>
      {(totalExpense > 0 || totalIncome > 0) && (
        <div className="text-xs md:text-sm opacity-90 mt-1.5 md:mt-2 space-y-0.5">
          {totalExpense > 0 && (
            <p className="flex justify-between">
              <span className="opacity-80">使う予定:</span>
              <span className="font-medium">-{formatCurrency(totalExpense)}</span>
            </p>
          )}
          {totalIncome > 0 && (
            <p className="flex justify-between">
              <span className="opacity-80">入る予定:</span>
              <span className="font-medium">+{formatCurrency(totalIncome)}</span>
            </p>
          )}
          <p className="flex justify-between items-center pt-1 border-t border-white/20">
            <span className="opacity-80 flex items-center gap-1">
              実質残高
              <Tooltip
                label="実質残高について"
                text="カード請求や定期支払などを考慮した、実際に使用可能な残高です"
                position="bottom"
              />
            </span>
            <span className="font-bold">{formatCurrency(totalBalance - netPending)}</span>
          </p>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20">
          <button
            onClick={onToggleBreakdown}
            className="flex items-center gap-1 text-xs md:text-sm font-medium opacity-70 mb-1.5 md:mb-2"
          >
            {isBreakdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            内訳
          </button>
          {isBreakdownOpen && (
            <div className="space-y-1.5 md:space-y-2.5 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              {Object.entries(groupedAccounts).map(([memberId, memberAccounts]) => {
                const member = getMember(memberId);
                const memberTotal = memberAccounts.reduce((sum, a) => sum + a.balance, 0);
                const memberExpense = memberAccounts.reduce(
                  (sum, a) => sum + (totalPendingByAccount[a.id]?.cardPending || 0) + (totalPendingByAccount[a.id]?.recurringExpense || 0),
                  0
                );
                const memberIncome = memberAccounts.reduce((sum, a) => sum + (totalPendingByAccount[a.id]?.recurringIncome || 0), 0);
                const memberNetPending = memberExpense - memberIncome;
                return (
                  <div key={memberId}>
                    <div className="flex items-center justify-between mb-0.5 md:mb-1">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full" style={{ backgroundColor: member?.color || '#d1d5db' }} />
                        <span className="text-xs md:text-sm font-medium opacity-90">{member?.name || '不明'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{formatCurrency(memberTotal)}</span>
                        {(memberExpense > 0 || memberIncome > 0) && (
                          <span className="text-sm opacity-70 ml-1">（実質: {formatCurrency(memberTotal - memberNetPending)}）</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 pl-3.5">
                      {memberAccounts.map((account) => {
                        const pendingData = totalPendingByAccount[account.id];
                        const hasExpense = pendingData && (pendingData.cardPending > 0 || pendingData.recurringExpense > 0);
                        const hasIncome = pendingData && pendingData.recurringIncome > 0;
                        return (
                          <div key={account.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center">
                                {ACCOUNT_TYPE_ICONS_SM[account.type]}
                              </div>
                              <span className="text-sm opacity-90">{account.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium text-sm">{formatCurrency(account.balance)}</span>
                              {(hasExpense || hasIncome) && pendingData && (
                                <p className="text-sm opacity-60">実質: {formatCurrency(account.balance - pendingData.totalPending)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
