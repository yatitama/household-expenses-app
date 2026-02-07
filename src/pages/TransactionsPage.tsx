import { useMemo, useState } from 'react';
import { Receipt, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTransactionFilter } from '../hooks/useTransactionFilter';
import { SearchBar } from '../components/search/SearchBar';
import { FilterPanel } from '../components/search/FilterPanel';
import { categoryService, memberService, accountService, paymentMethodService, transactionService } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import { AddTransactionModal } from '../components/accounts/modals/AddTransactionModal';
import { EditTransactionModal } from '../components/accounts/modals/EditTransactionModal';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { revertTransactionBalance, applyTransactionBalance } from '../components/accounts/balanceHelpers';
import type { Transaction, TransactionInput } from '../types';

export const TransactionsPage = () => {
  const { filters, filteredTransactions, updateFilter, resetFilters, activeFilterCount, refreshTransactions } = useTransactionFilter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; transaction: Transaction | null }>({
    isOpen: false,
    transaction: null,
  });

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

  const handleDelete = (transaction: Transaction) => {
    setDeleteConfirm({ isOpen: true, transaction });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.transaction) return;
    revertTransactionBalance(deleteConfirm.transaction);
    transactionService.delete(deleteConfirm.transaction.id);
    refreshTransactions();
    toast.success('取引を削除しました');
    setDeleteConfirm({ isOpen: false, transaction: null });
  };

  const handleSaveEdit = (input: TransactionInput) => {
    if (!editingTransaction) return;
    revertTransactionBalance(editingTransaction);
    applyTransactionBalance(input);
    transactionService.update(editingTransaction.id, {
      ...input,
      settledAt: undefined,
    });
    refreshTransactions();
    setEditingTransaction(null);
    toast.success('取引を更新しました');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-400 dark:to-accent-400">
          取引履歴
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">取引追加</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 md:-mx-8 md:px-8 glass-card">
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
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        {filteredTransactions.length}件の取引
      </p>

      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <div className="premium-card p-12 text-center animate-fade-in">
          <Receipt size={56} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-base text-gray-500 dark:text-gray-400 font-medium">取引がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map(([date, transactions]) => (
            <div key={date} className="premium-card overflow-hidden animate-fade-in">
              <div className="px-5 py-3 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-950 dark:to-accent-950 border-b border-brand-100 dark:border-brand-800">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">{formatDate(date)}</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {transactions.map((t) => {
                  const color = getCategoryColor(t.categoryId);
                  const source = t.paymentMethodId
                    ? getPaymentMethodName(t.paymentMethodId)
                    : getAccountName(t.accountId);

                  return (
                    <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {getCategoryIcon(getCategoryIconName(t.categoryId), 20)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {getCategoryName(t.categoryId)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {source}{t.memo ? ` - ${t.memo}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className={`text-base font-bold ${
                          t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingTransaction(t)}
                            className="p-2 text-gray-400 hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-400 transition-colors rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20"
                            aria-label="編集"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            aria-label="削除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {showAddModal && (
        <AddTransactionModal
          onSaved={() => {
            refreshTransactions();
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          accounts={accounts}
          paymentMethods={paymentMethods}
          categories={categories}
          members={members}
          onSave={handleSaveEdit}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, transaction: null })}
        onConfirm={confirmDelete}
        title="取引を削除"
        message="この取引を削除してもよろしいですか？この操作は取り消せません。"
        confirmText="削除"
        confirmVariant="danger"
      />
    </div>
  );
};
