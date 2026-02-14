import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import { categoryService } from '../../../services/storage';
import type { PaymentMethod, Transaction } from '../../../types';

type GroupByType = 'date' | 'category';

interface CardUnsettledListModalProps {
  paymentMethod: PaymentMethod | null;
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

export const CardUnsettledListModal = ({
  paymentMethod,
  transactions,
  isOpen,
  onClose,
  onTransactionClick,
}: CardUnsettledListModalProps) => {
  const [groupBy, setGroupBy] = useState<GroupByType>('category');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (!isOpen || !paymentMethod) return null;

  const categories = categoryService.getAll();
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  // グループ化ロジック
  const getGroupKeyAndLabel = (transaction: Transaction): { key: string; label: string } => {
    if (groupBy === 'date') {
      return { key: transaction.date, label: formatDate(transaction.date) };
    } else {
      const category = getCategory(transaction.categoryId);
      return { key: transaction.categoryId, label: category?.name || 'その他' };
    }
  };

  // グループ化（日付またはカテゴリごと）
  const groupedTransactions = transactions.reduce(
    (acc, transaction) => {
      const { key, label } = getGroupKeyAndLabel(transaction);
      if (!acc[key]) {
        acc[key] = { label, transactions: [] };
      }
      acc[key].transactions.push(transaction);
      return acc;
    },
    {} as Record<string, { label: string; transactions: Transaction[] }>
  );

  // ソート
  const sortedKeys = Object.keys(groupedTransactions).sort((a, b) => {
    if (groupBy === 'date') {
      return b.localeCompare(a); // 日付は新しい順
    } else {
      return groupedTransactions[a].label.localeCompare(groupedTransactions[b].label, 'ja');
    }
  });

  const total = transactions.reduce((sum, t) => {
    return sum + (t.type === 'expense' ? t.amount : -t.amount);
  }, 0);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* 固定ヘッダー */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-3 sm:p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{paymentMethod.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (expandedGroups.size === sortedKeys.length) {
                      setExpandedGroups(new Set());
                    } else {
                      setExpandedGroups(new Set(sortedKeys));
                    }
                  }}
                  className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  {expandedGroups.size === sortedKeys.length ? '全て閉じる' : '全て開く'}
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setGroupBy('category');
                  setExpandedGroups(new Set(sortedKeys));
                }}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition-colors ${
                  groupBy === 'category'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                カテゴリ
              </button>
              <button
                onClick={() => {
                  setGroupBy('date');
                  setExpandedGroups(new Set(sortedKeys));
                }}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition-colors ${
                  groupBy === 'date'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                日付
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 p-3 sm:p-4">
              {transactions.length === 0 ? (
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                明細なし
              </p>
            ) : (
              sortedKeys.map((groupKey) => {
                const groupData = groupedTransactions[groupKey];
                const groupTotal = groupData.transactions.reduce((sum, t) => {
                  return sum + (t.type === 'expense' ? t.amount : -t.amount);
                }, 0);
                const isExpanded = expandedGroups.has(groupKey);

                return (
                  <div key={groupKey} className="space-y-0">
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="sticky top-0 w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-left bg-white dark:bg-gray-800 z-10"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ChevronDown
                          size={16}
                          className={`flex-shrink-0 transition-transform text-gray-600 dark:text-gray-400 ${
                            isExpanded ? '' : '-rotate-90'
                          }`}
                        />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {groupData.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-700 flex-shrink-0">
                        {formatCurrency(groupTotal)}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 pl-6 mb-2">
                        {[...groupData.transactions].sort((a, b) => b.amount - a.amount).map((transaction) => {
                          const category = getCategory(transaction.categoryId);
                          return (
                            <button
                              key={transaction.id}
                              onClick={() => onTransactionClick?.(transaction)}
                              className="w-full flex items-center justify-between text-xs md:text-sm gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-left"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${category?.color || '#6b7280'}20`, color: category?.color || '#6b7280' }}
                                >
                                  {getCategoryIcon(category?.icon || '', 12)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-gray-900 dark:text-gray-100">{category?.name || 'その他'}</p>
                                  {groupBy === 'category' && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {transaction.date}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-gray-900 dark:text-gray-700 font-semibold flex-shrink-0">
                                {formatCurrency(transaction.amount)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-end">
          <div className="text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">合計</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
