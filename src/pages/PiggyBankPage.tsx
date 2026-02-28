import { useMemo } from 'react';
import { accountService, memberService, savingsGoalService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { calculateAccumulatedAmount, toYearMonth } from '../utils/savingsUtils';
import { PiggyBankVisualization } from '../components/PiggyBankVisualization';

export const PiggyBankPage = () => {

  const accounts = useMemo(() => accountService.getAll(), []);
  const savingsGoals = useMemo(() => savingsGoalService.getAll(), []);
  const members = useMemo(() => memberService.getAll(), []);

  const currentRealMonth = toYearMonth(new Date());

  // 全口座の合計
  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );

  // 全貯金目標の累計
  const totalSavings = useMemo(
    () => savingsGoals.reduce((sum, goal) => {
      return sum + calculateAccumulatedAmount(goal, currentRealMonth);
    }, 0),
    [savingsGoals, currentRealMonth]
  );

  // 合計（全口座 + 全貯金）
  const grandTotal = useMemo(
    () => totalBalance + totalSavings,
    [totalBalance, totalSavings]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center px-4 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          貯金箱
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          ご家族の貯蓄状況をご覧ください
        </p>
      </div>

      {/* 貯金箱ビジュアル */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <PiggyBankVisualization
          totalBalance={totalBalance}
          totalSavings={totalSavings}
          particleCount={0}
        />
      </div>

      {/* 金額情報 */}
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
        {/* 全口座残高 */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
              全口座残高
            </p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
              {accounts.length}口座
            </p>
            {accounts.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                平均 {formatCurrency(Math.floor(totalBalance / accounts.length))}
              </p>
            )}
          </div>
        </div>

        {/* 貯金目標累計 */}
        {savingsGoals.length > 0 && (
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                貯金目標累計
              </p>
              <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-500">
                {formatCurrency(totalSavings)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                {savingsGoals.length}目標
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                目標達成度
              </p>
            </div>
          </div>
        )}

        {/* 合計 */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
              合計資産
            </p>
            <p className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
              {formatCurrency(grandTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* 口座一覧 */}
      {accounts.length > 0 && (
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-4">
            口座別残高
          </h2>
          <div className="space-y-3">
            {accounts.map((account) => {
              const member = members.find((m) => m.id === account.memberId);
              const percentage = totalBalance > 0 ? (account.balance / totalBalance) * 100 : 0;

              return (
                <div key={account.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {account.name}
                      </span>
                      {member && (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          ({member.name})
                        </span>
                      )}
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: account.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
