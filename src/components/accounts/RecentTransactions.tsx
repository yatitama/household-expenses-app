import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Receipt } from 'lucide-react';
import { transactionService, categoryService, accountService, paymentMethodService, linkedPaymentMethodService } from '../../services/storage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface RecentTransactionsProps {
  accountId?: string;
}

export const RecentTransactions = ({ accountId }: RecentTransactionsProps) => {
  const navigate = useNavigate();

  const transactions = useMemo(() => {
    const allTransactions = transactionService.getAll();
    let filtered = allTransactions;

    if (accountId) {
      // 口座でフィルター（直接取引 + 紐づけられた支払い手段の取引）
      const linkedPMs = linkedPaymentMethodService.getAll()
        .filter(lpm => lpm.accountId === accountId && lpm.isActive)
        .map(lpm => lpm.paymentMethodId);

      filtered = allTransactions.filter(t =>
        t.accountId === accountId ||
        (t.paymentMethodId && linkedPMs.includes(t.paymentMethodId))
      );
    }

    return filtered
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [accountId]);

  const categories = useMemo(() => categoryService.getAll(), []);
  const accounts = useMemo(() => accountService.getAll(), []);
  const paymentMethods = useMemo(() => paymentMethodService.getAll(), []);

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '不明';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '#9ca3af';
  };

  const getCategoryIconName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.icon || 'MoreHorizontal';
  };

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || '';
  };

  const getPaymentMethodName = (pmId: string) => {
    return paymentMethods.find((pm) => pm.id === pmId)?.name || '';
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof transactions>();
    for (const t of transactions) {
      const existing = groups.get(t.date);
      if (existing) {
        existing.push(t);
      } else {
        groups.set(t.date, [t]);
      }
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  const handleViewAll = () => {
    if (accountId) {
      navigate(`/transactions?accountId=${accountId}`);
    } else {
      navigate('/transactions');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">最近の取引</h3>
        <button
          onClick={handleViewAll}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
        >
          すべて見る
          <ChevronRight size={16} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 text-center">
          <Receipt size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">取引がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedTransactions.map(([date, transactionsForDate]) => (
            <div key={date} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{formatDate(date)}</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {transactionsForDate.map((t) => {
                  const color = getCategoryColor(t.categoryId);
                  const source = t.paymentMethodId
                    ? getPaymentMethodName(t.paymentMethodId)
                    : getAccountName(t.accountId);

                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {getCategoryIcon(getCategoryIconName(t.categoryId), 18)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                          {getCategoryName(t.categoryId)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {source}{t.memo ? ` - ${t.memo}` : ''}
                        </p>
                      </div>
                      <p className={`text-sm font-bold shrink-0 ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
