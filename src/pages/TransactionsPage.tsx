import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { Receipt, Sliders, ChevronDown, Calendar, LayoutGrid, Wallet, CreditCard, RefreshCw, X } from 'lucide-react';
import { useTransactionFilter } from '../hooks/useTransactionFilter';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { TransactionFilterSheet } from '../components/search/TransactionFilterSheet';
import { CardUnsettledDetailModal } from '../components/accounts/modals/CardUnsettledDetailModal';
import { EditTransactionModal } from '../components/accounts/modals/EditTransactionModal';
import { RecurringPaymentDetailModal } from '../components/accounts/modals/RecurringPaymentDetailModal';
import { RecurringPaymentModal } from '../components/accounts/modals/RecurringPaymentModal';
import { useAccountOperations } from '../hooks/accounts/useAccountOperations';
import { categoryService, accountService, paymentMethodService, transactionService, recurringPaymentService } from '../services/storage';
import { revertTransactionBalance, applyTransactionBalance } from '../components/accounts/balanceHelpers';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getRecurringOccurrencesInRange, type RecurringOccurrence } from '../utils/recurringOccurrences';
import { getEffectiveRecurringAmount } from '../utils/savingsUtils';
import type { Transaction, TransactionInput, RecurringPayment } from '../types';

export type GroupByType = 'date' | 'category' | 'account' | 'payment';

type DisplayItem =
  | { kind: 'transaction'; data: Transaction }
  | { kind: 'recurring'; data: RecurringOccurrence };

const getPeriodLabel = (payment: RecurringPayment): string => {
  if (payment.periodType === 'months') {
    return payment.periodValue === 1 ? '毎月' : `${payment.periodValue}ヶ月ごと`;
  }
  return payment.periodValue === 1 ? '毎日' : `${payment.periodValue}日ごと`;
};

export const TransactionsPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { filters, filteredTransactions, updateFilter, resetFilters, activeFilterCount } = useTransactionFilter();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByType>('date');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringPayment | null>(null);
  const [isRecurringDetailOpen, setIsRecurringDetailOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringPayment | null>(null);
  const { handleSaveRecurring, handleDeleteRecurring } = useAccountOperations();
  useBodyScrollLock(!!editingTransaction || isDetailOpen || isFilterSheetOpen || isRecurringDetailOpen || !!editingRecurring);

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

  // グループ化タイプを循環
  const groupByOptions: GroupByType[] = ['date', 'category', 'account', 'payment'];
  const handleCycleGroupBy = () => {
    const currentIndex = groupByOptions.indexOf(groupBy);
    const nextIndex = (currentIndex + 1) % groupByOptions.length;
    setGroupBy(groupByOptions[nextIndex]);
  };

  // グループ化タイプのラベルとアイコンを取得
  const getGroupByLabel = (type: GroupByType) => {
    switch (type) {
      case 'date':
        return { label: '日付', icon: <Calendar size={16} /> };
      case 'category':
        return { label: 'カテゴリ', icon: <LayoutGrid size={16} /> };
      case 'account':
        return { label: '口座', icon: <Wallet size={16} /> };
      case 'payment':
        return { label: '支払方法', icon: <CreditCard size={16} /> };
      default:
        return { label: '', icon: null };
    }
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
  };

  const handleDelete = (id: string) => {
    const transaction = transactionService.getAll().find((t) => t.id === id);
    if (!transaction) return;

    revertTransactionBalance(transaction);
    transactionService.delete(id);

    toast.success('取引を削除しました');
    setEditingTransaction(null);
  };

  // 表示対象の日付範囲（フィルターが未設定の場合は今月）
  const displayRange = useMemo(() => {
    if (filters.dateRange.start && filters.dateRange.end) {
      return { start: filters.dateRange.start, end: filters.dateRange.end };
    }
    const today = new Date();
    return {
      start: format(startOfMonth(today), 'yyyy-MM-dd'),
      end: format(endOfMonth(today), 'yyyy-MM-dd'),
    };
  }, [filters.dateRange]);

  // 定期取引の発生日一覧（フィルター適用済み）
  const recurringOccurrences = useMemo(() => {
    // 未精算フィルター時は定期取引を非表示
    if (filters.unsettled) return [];

    const allRecurring = recurringPaymentService.getAll();
    const occurrences = getRecurringOccurrencesInRange(allRecurring, displayRange.start, displayRange.end);

    return occurrences.filter((occ) => {
      const p = occ.payment;

      // 種別フィルター
      if (filters.transactionType !== 'all' && p.type !== filters.transactionType) return false;

      // キーワード検索（名称）
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(query)) return false;
      }

      // カテゴリフィルター
      if (filters.categoryIds.length > 0) {
        if (!p.categoryId || !filters.categoryIds.includes(p.categoryId)) return false;
      }

      // 口座フィルター
      if (filters.accountIds.length > 0) {
        if (!p.accountId || !filters.accountIds.includes(p.accountId)) return false;
      }

      // 支払方法フィルター
      if (filters.paymentMethodIds.length > 0) {
        if (!p.paymentMethodId || !filters.paymentMethodIds.includes(p.paymentMethodId)) return false;
      }

      return true;
    });
  }, [filters, displayRange]);

  // Group transactions and recurring occurrences by selected groupBy type
  const groupedItems = useMemo(() => {
    // 通常取引と定期取引を統合
    const transactionItems: DisplayItem[] = filteredTransactions.map((t) => ({ kind: 'transaction', data: t }));
    const recurringItems: DisplayItem[] = recurringOccurrences.map((occ) => ({ kind: 'recurring', data: occ }));
    const allItems: DisplayItem[] = [...transactionItems, ...recurringItems];

    const getGroupKeyAndLabel = (item: DisplayItem): { key: string; label: string } => {
      if (item.kind === 'transaction') {
        const t = item.data;
        switch (groupBy) {
          case 'date':
            return { key: t.date, label: formatDate(t.date) };
          case 'category': {
            const categoryName = getCategoryName(t.categoryId);
            return { key: t.categoryId, label: categoryName };
          }
          case 'account': {
            const accountName = getAccountName(t.accountId);
            return { key: t.accountId, label: accountName || '不明' };
          }
          case 'payment': {
            if (t.paymentMethodId) {
              const paymentName = getPaymentMethodName(t.paymentMethodId);
              return { key: t.paymentMethodId, label: paymentName || '不明' };
            }
            return { key: 'direct', label: '口座直接' };
          }
          default:
            return { key: t.date, label: formatDate(t.date) };
        }
      } else {
        const { payment, date } = item.data;
        switch (groupBy) {
          case 'date':
            return { key: date, label: formatDate(date) };
          case 'category': {
            if (payment.categoryId) {
              return { key: payment.categoryId, label: getCategoryName(payment.categoryId) };
            }
            return { key: 'recurring-none', label: '未設定' };
          }
          case 'account': {
            if (payment.accountId) {
              return { key: payment.accountId, label: getAccountName(payment.accountId) || '不明' };
            }
            return { key: 'recurring-none', label: '不明' };
          }
          case 'payment': {
            if (payment.paymentMethodId) {
              return { key: payment.paymentMethodId, label: getPaymentMethodName(payment.paymentMethodId) || '不明' };
            }
            return { key: 'direct', label: '口座直接' };
          }
          default:
            return { key: date, label: formatDate(date) };
        }
      }
    };

    const groups = new Map<string, { label: string; items: DisplayItem[] }>();
    for (const item of allItems) {
      const { key, label } = getGroupKeyAndLabel(item);
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(key, { label, items: [item] });
      }
    }

    const entries = Array.from(groups.entries());
    if (groupBy === 'date') {
      return entries.sort((a, b) => b[0].localeCompare(a[0]));
    } else {
      return entries.sort((a, b) => b[1].label.localeCompare(a[1].label));
    }
  }, [filteredTransactions, recurringOccurrences, groupBy, getCategoryName, getAccountName, getPaymentMethodName]);

  // 合計を計算（定期取引を含む）
  const totalNet = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const recurringIncome = recurringOccurrences
      .filter((occ) => occ.payment.type === 'income')
      .reduce((sum, occ) => {
        const month = occ.date.slice(0, 7); // yyyy-MM形式で抽出
        const effectiveAmount = getEffectiveRecurringAmount(occ.payment, month);
        return sum + effectiveAmount;
      }, 0);
    const recurringExpense = recurringOccurrences
      .filter((occ) => occ.payment.type === 'expense')
      .reduce((sum, occ) => {
        const month = occ.date.slice(0, 7); // yyyy-MM形式で抽出
        const effectiveAmount = getEffectiveRecurringAmount(occ.payment, month);
        return sum + effectiveAmount;
      }, 0);
    return income - expense + recurringIncome - recurringExpense;
  }, [filteredTransactions, recurringOccurrences]);

  const totalItemCount = filteredTransactions.length + recurringOccurrences.length;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      {/* Transaction list */}
      <div className="flex-1 overflow-clip pb-32">
        <div className="p-2 md:p-4 lg:p-6">
        {groupedItems.length === 0 ? (
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-8 text-center">
            <Receipt size={40} className="md:w-12 md:h-12 mx-auto text-primary-600 mb-2 md:mb-3" />
            <p className="text-xs md:text-sm text-primary-600">取引がありません</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {groupedItems.map(([key, { label, items }]) => {
              // グループ内の合計を計算
              const groupTotal = items.reduce((sum, item) => {
                if (item.kind === 'transaction') {
                  return sum + (item.data.type === 'income' ? item.data.amount : -item.data.amount);
                } else {
                  const month = item.data.date.slice(0, 7); // yyyy-MM形式で抽出
                  const effectiveAmount = getEffectiveRecurringAmount(item.data.payment, month);
                  return sum + (item.data.payment.type === 'income' ? effectiveAmount : -effectiveAmount);
                }
              }, 0);

              const isExpanded = expandedGroups.has(key);
              return (
                <div key={key} className="mb-3">
                  <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg">
                    <button
                      onClick={() => toggleGroupExpanded(key)}
                      className={`sticky w-full px-4 py-3 bg-white dark:bg-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left z-10 rounded-t-lg ${isExpanded ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                      style={{ top: 'max(0px, env(safe-area-inset-top))' }}
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
                      <div className="px-0 pb-0 pt-0 divide-y divide-gray-50 dark:divide-gray-700">
                        {items.map((item, idx) => {
                          if (item.kind === 'transaction') {
                            const t = item.data;
                            const color = getCategoryColor(t.categoryId);
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setSelectedTransaction(t);
                                  setIsDetailOpen(true);
                                }}
                                className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${color}20`, color }}
                                  >
                                    {getCategoryIcon(getCategoryIconName(t.categoryId), 12)}
                                  </div>
                                  <p className="truncate text-gray-900 dark:text-gray-100 font-medium">
                                    {getCategoryName(t.categoryId)}
                                  </p>
                                </div>
                                <span className={`text-gray-900 dark:text-gray-200 font-semibold flex-shrink-0 ${
                                  t.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </span>
                              </button>
                            );
                          } else {
                            const occ = item.data;
                            const p = occ.payment;
                            const color = p.categoryId ? getCategoryColor(p.categoryId) : '#9ca3af';
                            const month = occ.date.slice(0, 7); // yyyy-MM形式で抽出
                            const effectiveAmount = getEffectiveRecurringAmount(p, month);
                            const hasOverride = (p.monthlyOverrides ?? {})[month] !== undefined;
                            return (
                              <button
                                key={`recurring-${p.id}-${occ.date}-${idx}`}
                                onClick={() => {
                                  setSelectedRecurring(occ.payment);
                                  setIsRecurringDetailOpen(true);
                                }}
                                className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${color}20`, color }}
                                  >
                                    {p.categoryId
                                      ? getCategoryIcon(getCategoryIconName(p.categoryId), 12)
                                      : <RefreshCw size={10} />
                                    }
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-gray-900 dark:text-gray-100 font-medium">
                                      {p.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <RefreshCw size={10} />
                                      {getPeriodLabel(p)}
                                    </p>
                                  </div>
                                </div>
                                <div className={`font-semibold flex-shrink-0 flex flex-col items-end ${
                                  p.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  <span>
                                    {p.type === 'income' ? '+' : '-'}{formatCurrency(effectiveAmount)}
                                  </span>
                                  {hasOverride && (
                                    <span className="text-xs text-gray-400 line-through">
                                      {p.type === 'income' ? '+' : '-'}{formatCurrency(p.amount)}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          }
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
      </div>

      {/* Fixed Footer with Summary */}
      <div className="fixed left-0 right-0 z-20 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-1.5 fixed-above-bottom-nav">
        <div className="max-w-7xl mx-auto px-1 md:px-2 lg:px-3 flex items-center justify-between gap-2">
          {/* Left: GroupBy, Filter Button and Count */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* GroupBy Button */}
            <button
              onClick={handleCycleGroupBy}
              className="px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 flex-shrink-0 flex items-center gap-1 text-xs font-medium"
              aria-label="グループ化を変更"
            >
              {getGroupByLabel(groupBy).icon}
              <span>{getGroupByLabel(groupBy).label}</span>
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterSheetOpen(true)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 relative flex-shrink-0"
              aria-label="フィルター設定を開く"
            >
              <Sliders size={18} />
              {activeFilterCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Active filter badge */}
            {activeFilterCount > 0 ? (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300 font-medium flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="フィルターをリセット"
              >
                <span>{activeFilterCount}件の条件</span>
                <X size={12} />
              </button>
            ) : (
              /* Transaction Count */
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex-shrink-0">
                {totalItemCount}件
              </p>
            )}
          </div>

          {/* Right: Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-1.5 text-right flex-shrink-0" style={{
            borderColor: 'var(--theme-primary)',
          }}>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">
              合計
            </p>
            <p className="text-lg md:text-xl font-bold" style={{ color: 'var(--theme-primary)' }}>
              {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <CardUnsettledDetailModal
        transaction={selectedTransaction}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(transaction) => {
          setSelectedTransaction(transaction);
          setEditingTransaction(transaction);
        }}
      />

      {/* Recurring Detail Modal */}
      <RecurringPaymentDetailModal
        recurringPayment={selectedRecurring}
        isOpen={isRecurringDetailOpen}
        onClose={() => setIsRecurringDetailOpen(false)}
        onEdit={(rp) => {
          setIsRecurringDetailOpen(false);
          setEditingRecurring(rp);
        }}
      />

      {/* Recurring Edit Modal */}
      {editingRecurring && (
        <RecurringPaymentModal
          recurringPayment={editingRecurring}
          onSave={(input) => {
            handleSaveRecurring(input, editingRecurring);
            setEditingRecurring(null);
          }}
          onClose={() => setEditingRecurring(null)}
          onDelete={handleDeleteRecurring}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          accounts={accounts}
          paymentMethods={paymentMethods}
          categories={categories}
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
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
      />
    </div>
  );
};
