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
    new Set(['type', 'date', 'category', 'account'])
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
          <div className="px-0 py-2">
            {/* 取引種別セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <button
                onClick={() => toggleSection('type')}
                className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
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
                <div className="px-2 pb-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: 'all' as const, label: 'すべて' },
                      { value: 'expense' as const, label: '支出' },
                      { value: 'income' as const, label: '収入' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateFilter('transactionType', type.value)}
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                          filters.transactionType === type.value
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : ''
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {type.label}
                        </span>
                        {filters.transactionType === type.value && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 期間セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <button
                onClick={() => toggleSection('date')}
                className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
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
                <div className="px-2 pb-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                  <DateRangePicker
                    start={filters.dateRange.start}
                    end={filters.dateRange.end}
                    onChange={(start, end) =>
                      updateFilter('dateRange', { start, end })
                    }
                  />
                </div>
              )}
            </div>

            {/* カテゴリセクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <button
                onClick={() => toggleSection('category')}
                className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
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
                <div className="px-2 pb-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="grid grid-cols-3 gap-1.5">
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
                          className={`relative flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg transition-colors min-h-[60px] ${
                            filters.categoryIds.includes(category.id)
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : ''
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {getCategoryIcon(category.icon, 15)}
                          </div>
                          <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                            {category.name}
                          </span>
                          {filters.categoryIds.includes(category.id) && (
                            <div className="absolute -top-1 -right-1">
                              <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
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
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <button
                onClick={() => toggleSection('account')}
                className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
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
                <div className="px-2 pb-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="grid grid-cols-3 gap-1.5">
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
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                          filters.accountIds.includes(account.id)
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : ''
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${account.color || '#9ca3af'}20`, color: account.color || '#9ca3af' }}
                        >
                          <Wallet size={16} />
                        </div>
                        <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                          {account.name}
                        </span>
                        {filters.accountIds.includes(account.id) && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
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
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                          filters.paymentMethodIds.includes(pm.id)
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : ''
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${pm.color || '#9ca3af'}20`, color: pm.color || '#9ca3af' }}
                        >
                          <CreditCard size={16} />
                        </div>
                        <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                          {pm.name}
                        </span>
                        {filters.paymentMethodIds.includes(pm.id) && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-2 flex flex-row gap-2 -mb-2">
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
