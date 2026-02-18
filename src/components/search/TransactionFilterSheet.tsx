import { X, RotateCcw, ChevronDown, Check, Wallet, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { FilterOptions } from '../../hooks/useTransactionFilter';

interface TransactionFilterSheetProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  categories: { id: string; name: string; color: string; icon: string }[];
  accounts: { id: string; name: string; color?: string }[];
  paymentMethods: { id: string; name: string; color?: string }[];
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionFilterSheet = ({
  filters,
  updateFilter,
  resetFilters,
  categories,
  accounts,
  paymentMethods,
  isOpen,
  onClose,
}: TransactionFilterSheetProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[999]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl z-[1000] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 dark:border-gray-700 z-10 p-3 sm:p-4 border-b flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            フィルター
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 sm:p-4">
            {/* 取引種別セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
              <button
                onClick={() => toggleSection('type')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform text-gray-600 dark:text-gray-400 ${
                      isExpanded('type') ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    取引種別
                  </span>
                  {filters.transactionType !== 'all' && (
                    <span className="ml-auto text-xs font-medium text-primary-600 dark:text-primary-400">
                      適用中
                    </span>
                  )}
                </div>
              </button>

              {isExpanded('type') && (
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <select
                    value={filters.transactionType}
                    onChange={(e) => updateFilter('transactionType', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <option value="all">すべて</option>
                    <option value="income">収入</option>
                    <option value="expense">支出</option>
                  </select>
                </div>
              )}
            </div>

            {/* 期間セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
              <button
                onClick={() => toggleSection('date')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform text-gray-600 dark:text-gray-400 ${
                      isExpanded('date') ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    期間
                  </span>
                  {(filters.dateRange.start || filters.dateRange.end) && (
                    <span className="ml-auto text-xs font-medium text-primary-600 dark:text-primary-400">
                      適用中
                    </span>
                  )}
                </div>
              </button>

              {isExpanded('date') && (
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <DateRangePicker
                    start={filters.dateRange.start}
                    end={filters.dateRange.end}
                    onStartChange={(v) =>
                      updateFilter('dateRange', { ...filters.dateRange, start: v })
                    }
                    onEndChange={(v) =>
                      updateFilter('dateRange', { ...filters.dateRange, end: v })
                    }
                  />
                </div>
              )}
            </div>

            {/* カテゴリセクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
              <button
                onClick={() => toggleSection('category')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform text-gray-600 dark:text-gray-400 ${
                      isExpanded('category') ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    カテゴリ
                  </span>
                  {filters.categoryIds.length > 0 && (
                    <span className="ml-auto text-xs font-medium text-primary-600 dark:text-primary-400">
                      {filters.categoryIds.length}件選択中
                    </span>
                  )}
                </div>
              </button>

              {isExpanded('category') && (
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((category) => {
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            const newIds = filters.categoryIds.includes(category.id)
                              ? filters.categoryIds.filter((id) => id !== category.id)
                              : [...filters.categoryIds, category.id];
                            updateFilter('categoryIds', newIds);
                          }}
                          className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                            filters.categoryIds.includes(category.id)
                              ? 'bg-primary-50 dark:bg-primary-900/30'
                              : ''
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {getCategoryIcon(category.icon, 14)}
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                            {category.name}
                          </span>
                          {filters.categoryIds.includes(category.id) && (
                            <div className="absolute -top-1 -right-1">
                              <Check size={16} className="text-primary-500" strokeWidth={2} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 口座・支払方法セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
              <button
                onClick={() => toggleSection('account')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform text-gray-600 dark:text-gray-400 ${
                      isExpanded('account') ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    口座・支払方法
                  </span>
                  {(filters.accountIds.length > 0 || filters.paymentMethodIds.length > 0) && (
                    <span className="ml-auto text-xs font-medium text-primary-600 dark:text-primary-400">
                      {filters.accountIds.length + filters.paymentMethodIds.length}件選択中
                    </span>
                  )}
                </div>
              </button>

              {isExpanded('account') && (
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="grid grid-cols-4 gap-2">
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => {
                          const newIds = filters.accountIds.includes(account.id)
                            ? filters.accountIds.filter((id) => id !== account.id)
                            : [...filters.accountIds, account.id];
                          updateFilter('accountIds', newIds);
                        }}
                        className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                          filters.accountIds.includes(account.id)
                            ? 'bg-primary-50 dark:bg-primary-900/30'
                            : ''
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${account.color || '#9ca3af'}20`, color: account.color || '#9ca3af' }}
                        >
                          <Wallet size={16} />
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                          {account.name}
                        </span>
                        {filters.accountIds.includes(account.id) && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={16} className="text-primary-500" strokeWidth={2} />
                          </div>
                        )}
                      </button>
                    ))}
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          const newIds = filters.paymentMethodIds.includes(pm.id)
                            ? filters.paymentMethodIds.filter((id) => id !== pm.id)
                            : [...filters.paymentMethodIds, pm.id];
                          updateFilter('paymentMethodIds', newIds);
                        }}
                        className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                          filters.paymentMethodIds.includes(pm.id)
                            ? 'bg-primary-50 dark:bg-primary-900/30'
                            : ''
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${pm.color || '#9ca3af'}20`, color: pm.color || '#9ca3af' }}
                        >
                          <CreditCard size={16} />
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                          {pm.name}
                        </span>
                        {filters.paymentMethodIds.includes(pm.id) && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={16} className="text-primary-500" strokeWidth={2} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-3 sm:p-4 flex flex-row gap-2 -mx-3 -mb-3 sm:-mx-4 sm:-mb-4">
              <button
                onClick={resetFilters}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 active:scale-95 transition-all text-sm font-medium"
              >
                <RotateCcw size={16} />
                リセット
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-white font-medium active:scale-95 transition-all text-sm"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                完了
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
