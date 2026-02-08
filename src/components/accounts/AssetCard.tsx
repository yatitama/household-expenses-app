import { useState } from 'react';
import { Wallet, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
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
  gradientFrom: string;
  gradientTo: string;
  onSaveGradient: (from: string, to: string) => void;
}

const PRESET_GRADIENTS = [
  { from: '#3b82f6', to: '#1e40af', label: 'Blue' },
  { from: '#8b5cf6', to: '#6d28d9', label: 'Purple' },
  { from: '#06b6d4', to: '#0369a1', label: 'Cyan' },
  { from: '#10b981', to: '#047857', label: 'Green' },
  { from: '#f59e0b', to: '#d97706', label: 'Amber' },
  { from: '#ef4444', to: '#991b1b', label: 'Red' },
];

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
  gradientFrom,
  gradientTo,
  onSaveGradient,
}: AssetCardProps) => {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  return (
    <div
      className="rounded-xl p-4 text-white relative"
      style={{ background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Wallet size={20} />
        <span className="text-sm opacity-90">総資産</span>
        <button
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
          className="ml-auto p-1 rounded-full hover:bg-white/20 transition-colors opacity-60 hover:opacity-100"
          title="背景色を変更"
        >
          <Palette size={16} />
        </button>
      </div>

      {/* インラインカラーピッカー */}
      {isColorPickerOpen && (
        <div className="absolute top-12 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">グラデーション色</h4>
          <div className="space-y-2">
            {PRESET_GRADIENTS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onSaveGradient(preset.from, preset.to);
                  setIsColorPickerOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div
                  className="w-6 h-6 rounded-md flex-shrink-0"
                  style={{ background: `linear-gradient(to right, ${preset.from}, ${preset.to})` }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
      {(totalExpense > 0 || totalIncome > 0) && (
        <div className="text-sm opacity-90 mt-2 space-y-0.5">
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
        <div className="mt-3 pt-3 border-t border-white/20">
          <button
            onClick={onToggleBreakdown}
            className="flex items-center gap-1 text-sm font-medium opacity-70 mb-2"
          >
            {isBreakdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            内訳
          </button>
          {isBreakdownOpen && (
            <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
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
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: member?.color || '#d1d5db' }} />
                        <span className="text-sm font-medium opacity-90">{member?.name || '不明'}</span>
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
