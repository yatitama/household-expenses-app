import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt } from 'lucide-react';
import { useTransactionFilter } from '../hooks/useTransactionFilter';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { SimpleFilterBar } from '../components/search/SimpleFilterBar';
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
  const [groupOrder, setGroupOrder] = useState<'asc' | 'desc'>('desc');
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

  // Handle grouping change with order toggle
  const handleGroupByChange = (newGroupBy: GroupByType) => {
    if (newGroupBy === groupBy) {
      // Toggle order if same grouping is selected
      setGroupOrder(groupOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new grouping with default descending order
      setGroupBy(newGroupBy);
      setGroupOrder('desc');
    }
  };

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
  };

  const handleDelete = (id: string) => {
    const transaction = transactionService.getAll().find((t) => t.id === id);
    if (!transaction) return;

    revertTransactionBalance(transaction);
    transactionService.delete(id);

    toast.success('取引を削除しました');
    setEditingTransaction(null);
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
    // Sort groups based on groupOrder
    const entries = Array.from(groups.entries());
    if (groupBy === 'date') {
      return groupOrder === 'desc'
        ? entries.sort((a, b) => b[0].localeCompare(a[0]))
        : entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else {
      return groupOrder === 'desc'
        ? entries.sort((a, b) => b[1].label.localeCompare(a[1].label))
        : entries.sort((a, b) => a[1].label.localeCompare(b[1].label));
    }
  }, [filteredTransactions, groupBy, groupOrder, categories, members, getCategoryName, getAccountName, getPaymentMethodName]);

  return (
    <div className="pb-20">
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-30 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8">
        <SimpleFilterBar
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
          members={members}
          categories={categories}
          accounts={accounts}
          paymentMethods={paymentMethods}
          groupBy={groupBy}
          groupOrder={groupOrder}
          onGroupByChange={handleGroupByChange}
        />
      </div>

      {/* Transaction list */}
      <div className="p-4 md:p-6 lg:p-8">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 text-center">
            <Receipt size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">取引がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedTransactions.map(([key, { label, transactions }], groupIndex) => {
              // グループ内の合計を計算
              const groupTotal = transactions.reduce((sum, t) => {
                return sum + (t.type === 'income' ? t.amount : -t.amount);
              }, 0);

              return (
                <div key={key}>
                  {groupIndex === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 px-4 mb-3">{filteredTransactions.length}件の取引</p>
                  )}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                    <p className={`text-sm font-bold ${
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
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {groupBy !== 'date' && `${formatDate(t.date)} - `}{source}{t.memo ? ` - ${t.memo}` : ''}
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
                </div>
              );
            })}
          </div>
        )}
      </div>

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
