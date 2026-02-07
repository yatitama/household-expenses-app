import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Receipt } from 'lucide-react';
import { useTransactionFilter } from '../hooks/useTransactionFilter';
import { SearchBar } from '../components/search/SearchBar';
import { FilterPanel } from '../components/search/FilterPanel';
import { EditTransactionModal } from '../components/accounts/modals/EditTransactionModal';
import { categoryService, memberService, accountService, paymentMethodService, transactionService } from '../services/storage';
import { revertTransactionBalance, applyTransactionBalance } from '../components/accounts/balanceHelpers';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import type { Transaction, TransactionInput } from '../types';

export const TransactionsPage = () => {
  const { filters, filteredTransactions, updateFilter, resetFilters, activeFilterCount } = useTransactionFilter();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const members = useMemo(() => memberService.getAll(), []);
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

  // Handlers
  const handleSaveEdit = (input: TransactionInput) => {
    if (!editingTransaction) return;

    const oldTransaction = editingTransaction;
    revertTransactionBalance(oldTransaction);
    transactionService.update(editingTransaction.id, input);
    applyTransactionBalance({ ...input, id: editingTransaction.id, settledAt: editingTransaction.settledAt });

    toast.success('取引を更新しました');
    setEditingTransaction(null);
    window.location.reload(); // Refresh to update the list
  };

  const handleDelete = (id: string) => {
    const transaction = transactionService.getAll().find((t) => t.id === id);
    if (!transaction) return;

    revertTransactionBalance(transaction);
    transactionService.delete(id);

    toast.success('取引を削除しました');
    setEditingTransaction(null);
    window.location.reload(); // Refresh to update the list
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, typeof filteredTransactions>();
    for (const t of filteredTransactions) {
      const existing = groups.get(t.date);
      if (existing) {
        existing.push(t);
      } else {
        groups.set(t.date, [t]);
      }
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-3">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">取引履歴</h2>

      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900 -mx-4 px-4 py-2 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <SearchBar
          value={filters.searchQuery}
          onChange={(v) => updateFilter('searchQuery', v)}
        />
      </div>

      {/* Filter panel */}
      <FilterPanel
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        members={members}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
      />

      {/* Results count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">{filteredTransactions.length}件の取引</p>

      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 text-center">
          <Receipt size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">取引がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedTransactions.map(([date, transactions]) => (
            <div key={date} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{formatDate(date)}</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {transactions.map((t) => {
                  const color = getCategoryColor(t.categoryId);
                  const source = t.paymentMethodId
                    ? getPaymentMethodName(t.paymentMethodId)
                    : getAccountName(t.accountId);

                  return (
                    <button
                      key={t.id}
                      onClick={() => setEditingTransaction(t)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
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
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          accounts={accounts}
          paymentMethods={paymentMethods}
          categories={categories}
          members={members}
          onSave={handleSaveEdit}
          onClose={() => setEditingTransaction(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
