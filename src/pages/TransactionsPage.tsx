import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt } from 'lucide-react';
import { useTransactionFilter } from '../hooks/useTransactionFilter';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { FloatingFilterMenu } from '../components/search/FloatingFilterMenu';
import { GroupingButton } from '../components/search/GroupingButton';
import { EditTransactionModal } from '../components/accounts/modals/EditTransactionModal';
import { categoryService, memberService, accountService, paymentMethodService, transactionService } from '../services/storage';
import { revertTransactionBalance, applyTransactionBalance } from '../components/accounts/balanceHelpers';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import type { Transaction, TransactionInput } from '../types';

export type GroupByType = 'date' | 'category' | 'member' | 'account' | 'payment';

export const TransactionsPage = () => {
  const [searchParams] = useSearchParams();
  const { filters, filteredTransactions, updateFilter, resetFilters, activeFilterCount } = useTransactionFilter();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByType>('date');
  const [isFilterMenuExpanded, setIsFilterMenuExpanded] = useState(false);
  useBodyScrollLock(!!editingTransaction);

  // URLパラメータからフィルターを初期化
  useEffect(() => {
    const accountId = searchParams.get('accountId');
    if (accountId) {
      updateFilter('accountIds', [accountId]);
    }
  }, [searchParams, updateFilter]);

  const members = useMemo(() => memberService.getAll(), []);
  const categories = useMemo(() => categoryService.getAll(), []);
  const accounts = useMemo(() => accountService.getAll(), []);
  const paymentMethods = useMemo(() => paymentMethodService.getAll(), []);

  const getCategoryName = useCallback((categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '不明';
  }, [categories]);

  const getCategoryColor = useCallback((categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '#9ca3af';
  }, [categories]);

  const getCategoryIconName = useCallback((categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.icon || 'MoreHorizontal';
  }, [categories]);

  const getAccountName = useCallback((accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || '';
  }, [accounts]);

  const getPaymentMethodName = useCallback((pmId: string) => {
    return paymentMethods.find((pm) => pm.id === pmId)?.name || '';
  }, [paymentMethods]);

  // Handlers
  const handleSaveEdit = (input: TransactionInput) => {
    if (!editingTransaction) return;

    const oldTransaction = editingTransaction;
    revertTransactionBalance(oldTransaction);
    const updatedTransaction = transactionService.update(editingTransaction.id, input);
    if (updatedTransaction) {
      applyTransactionBalance(updatedTransaction);
    }

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

  // Group transactions by selected groupBy type
  const groupedTransactions = useMemo(() => {
    // Get group key and label for a transaction
    const getGroupKeyAndLabel = (transaction: Transaction): { key: string; label: string } => {
      switch (groupBy) {
        case 'date':
          return { key: transaction.date, label: formatDate(transaction.date) };
        case 'category': {
          const categoryName = getCategoryName(transaction.categoryId);
          return { key: transaction.categoryId, label: categoryName };
        }
        case 'member': {
          const category = categories.find((c) => c.id === transaction.categoryId);
          const member = members.find((m) => m.id === category?.memberId);
          return { key: member?.id || 'unknown', label: member?.name || '不明' };
        }
        case 'account': {
          const accountName = getAccountName(transaction.accountId);
          return { key: transaction.accountId, label: accountName || '不明' };
        }
        case 'payment': {
          if (transaction.paymentMethodId) {
            const paymentName = getPaymentMethodName(transaction.paymentMethodId);
            return { key: transaction.paymentMethodId, label: paymentName || '不明' };
          }
          return { key: 'direct', label: '口座直接' };
        }
        default:
          return { key: transaction.date, label: formatDate(transaction.date) };
      }
    };

    const groups = new Map<string, { label: string; transactions: typeof filteredTransactions }>();
    for (const t of filteredTransactions) {
      const { key, label } = getGroupKeyAndLabel(t);
      const existing = groups.get(key);
      if (existing) {
        existing.transactions.push(t);
      } else {
        groups.set(key, { label, transactions: [t] });
      }
    }
    // Sort groups: for date, descending; for others, alphabetically
    const entries = Array.from(groups.entries());
    if (groupBy === 'date') {
      return entries.sort((a, b) => b[0].localeCompare(a[0]));
    } else {
      return entries.sort((a, b) => a[1].label.localeCompare(b[1].label));
    }
  }, [filteredTransactions, groupBy, categories, members, getCategoryName, getAccountName, getPaymentMethodName]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-3 pb-24">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">取引履歴</h2>

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
          {groupedTransactions.map(([key, { label, transactions }]) => {
            // グループ内の合計を計算
            const groupTotal = transactions.reduce((sum, t) => {
              return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);

            return (
              <div key={key} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                  <p className={`text-xs font-bold ${
                    groupTotal >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {groupTotal >= 0 ? '+' : ''}{formatCurrency(groupTotal)}
                  </p>
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
            );
          })}
        </div>
      )}

      {/* Grouping Button */}
      <GroupingButton
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        isFilterMenuExpanded={isFilterMenuExpanded}
      />

      {/* Floating Filter Menu */}
      <FloatingFilterMenu
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        members={members}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
        isExpanded={isFilterMenuExpanded}
        setIsExpanded={setIsFilterMenuExpanded}
      />

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
