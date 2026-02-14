import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt, Sliders, ChevronDown } from 'lucide-react';
import { useTransactionFilter } from '../hooks/useTransactionFilter';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { TransactionFilterSheet } from '../components/search/TransactionFilterSheet';
import { EditTransactionModal } from '../components/accounts/modals/EditTransactionModal';
import { categoryService, memberService, accountService, paymentMethodService, transactionService } from '../services/storage';
import { revertTransactionBalance, applyTransactionBalance } from '../components/accounts/balanceHelpers';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import type { Transaction, TransactionInput } from '../types';

export type GroupByType = 'date' | 'category' | 'member' | 'account' | 'payment';

export const TransactionsPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { filters, filteredTransactions, updateFilter, resetFilters, activeFilterCount } = useTransactionFilter();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByType>('date');
  const [groupOrder, setGroupOrder] = useState<'asc' | 'desc'>('desc');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  useBodyScrollLock(!!editingTransaction || isFilterSheetOpen);

  const toggleGroupExpanded = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };


  // URLパラメータと状態からフィルターを初期化
  useEffect(() => {
    const accountId = searchParams.get('accountId');
    if (accountId) {
      updateFilter('accountIds', [accountId]);
    }

    // state からの遷移時にフィルターを設定
    const state = location.state as { accountId?: string; paymentMethodIds?: string[]; filterType?: string } | undefined;
    if (state?.filterType === 'unsettled') {
      if (state.accountId) {
        updateFilter('accountIds', [state.accountId]);
      }
      if (state.paymentMethodIds) {
        updateFilter('paymentMethodIds', state.paymentMethodIds);
      }
      updateFilter('unsettled', true);
    } else if (state?.filterType === 'payment' && state.paymentMethodIds) {
      updateFilter('paymentMethodIds', state.paymentMethodIds);
    }
  }, [searchParams, location, updateFilter]);

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
      {/* Transaction list */}
      <div className="p-2 md:p-4 lg:p-6">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-8 text-center">
            <Receipt size={40} className="md:w-12 md:h-12 mx-auto text-primary-600 mb-2 md:mb-3" />
            <p className="text-xs md:text-sm text-primary-600">取引がありません</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {groupedTransactions.map(([key, { label, transactions }], groupIndex) => {
              // グループ内の合計を計算
              const groupTotal = transactions.reduce((sum, t) => {
                return sum + (t.type === 'income' ? t.amount : -t.amount);
              }, 0);

              const isExpanded = expandedGroups.has(key);
              return (
                <div key={key} className="mb-3">
                  {groupIndex === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 px-4 mb-3">{filteredTransactions.length}件の取引</p>
                  )}
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => toggleGroupExpanded(key)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <ChevronDown size={16} className={`text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                        <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 text-left">{label}</p>
                      </div>
                      <p className={`text-xs md:text-sm font-bold flex-shrink-0 ${
                        groupTotal >= 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {groupTotal >= 0 ? '+' : ''}{formatCurrency(groupTotal)}
                      </p>
                    </button>
                    {isExpanded && (
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
                              className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${color}20`, color }}
                                >
                                  {getCategoryIcon(getCategoryIconName(t.categoryId), 12)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-gray-900 dark:text-gray-100 font-medium">
                                    {getCategoryName(t.categoryId)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {formatDate(t.date)} {source}{t.memo ? ` - ${t.memo}` : ''}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-gray-900 dark:text-gray-200 font-semibold flex-shrink-0 ${
                                t.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter & Grouping Button (FAB) */}
      <button
        onClick={() => setIsFilterSheetOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow active:scale-95 flex items-center justify-center text-white font-semibold z-40"
        style={{ backgroundColor: 'var(--theme-primary)' }}
        aria-label="フィルター設定を開く"
      >
        <Sliders size={24} />
        {activeFilterCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

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

      {/* Transaction Filter Sheet */}
      <TransactionFilterSheet
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        members={members}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
        groupBy={groupBy}
        groupOrder={groupOrder}
        onGroupByChange={handleGroupByChange}
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
      />
    </div>
  );
};
