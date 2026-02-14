import { X, RotateCcw, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import { MultiSelect } from './MultiSelect';
import type { FilterOptions } from '../../hooks/useTransactionFilter';
import type { GroupByType } from '../../pages/TransactionsPage';

interface TransactionFilterSheetProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  members: { id: string; name: string; color: string }[];
  categories: { id: string; name: string; color: string }[];
  accounts: { id: string; name: string }[];
  paymentMethods: { id: string; name: string }[];
  groupBy: GroupByType;
  groupOrder: 'asc' | 'desc';
  onGroupByChange: (groupBy: GroupByType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionFilterSheet = ({
  filters,
  updateFilter,
  resetFilters,
  members,
  categories,
  accounts,
  paymentMethods,
  groupBy,
  groupOrder,
  onGroupByChange,
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

  const activeFilterCount =
    (filters.transactionType !== 'all' ? 1 : 0) +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    (filters.memberIds.length > 0 ? 1 : 0) +
    (filters.categoryIds.length > 0 ? 1 : 0) +
    (filters.accountIds.length > 0 ? 1 : 0) +
    (filters.paymentMethodIds.length > 0 ? 1 : 0) +
    (filters.unsettled ? 1 : 0);

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
            フィルター & グループ化
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2 p-3 sm:p-4">
            {/* グループ化セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
              <button
                onClick={() => toggleSection('grouping')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform text-gray-600 dark:text-gray-400 ${
                      isExpanded('grouping') ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    グループ化
                  </span>
                </div>
              </button>

              {isExpanded('grouping') && (
                <div className="px-3 pb-3 space-y-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      グループ化方法
                    </label>
                    <select
                      value={groupBy}
                      onChange={(e) => onGroupByChange(e.target.value as GroupByType)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-200 dark:border-gray-600 transition-colors"
                    >
                      <option value="date">日付</option>
                      <option value="category">カテゴリ</option>
                      <option value="member">メンバー</option>
                      <option value="account">口座</option>
                      <option value="payment">支払方法</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      並び順
                    </label>
                    <select
                      value={groupOrder}
                      onChange={() => onGroupByChange(groupBy)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-200 dark:border-gray-600 transition-colors"
                    >
                      <option value="desc">▼ 降順</option>
                      <option value="asc">▲ 昇順</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 取引種別セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
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
                <div className="px-3 pb-3 space-y-2 border-t border-gray-200 dark:border-gray-700">
                  {(['all', 'income', 'expense'] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => updateFilter('transactionType', value)}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                        filters.transactionType === value
                          ? 'text-white'
                          : 'bg-white dark:bg-slate-600 text-gray-800 dark:text-gray-100'
                      }`}
                      style={
                        filters.transactionType === value
                          ? { backgroundColor: 'var(--theme-primary)' }
                          : undefined
                      }
                    >
                      {value === 'all' ? 'すべて' : value === 'income' ? '収入' : '支出'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 期間セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
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
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
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

            {/* メンバーセクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
              <button
                onClick={() => toggleSection('member')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform text-gray-600 dark:text-gray-400 ${
                      isExpanded('member') ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    メンバー
                  </span>
                  {filters.memberIds.length > 0 && (
                    <span className="ml-auto text-xs font-medium text-primary-600 dark:text-primary-400">
                      {filters.memberIds.length}件選択中
                    </span>
                  )}
                </div>
              </button>

              {isExpanded('member') && (
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
                  <MultiSelect
                    label=""
                    options={members.map((m) => ({ id: m.id, name: m.name, color: m.color }))}
                    selectedIds={filters.memberIds}
                    onChange={(ids) => updateFilter('memberIds', ids)}
                  />
                </div>
              )}
            </div>

            {/* カテゴリセクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
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
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
                  <MultiSelect
                    label=""
                    options={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
                    selectedIds={filters.categoryIds}
                    onChange={(ids) => updateFilter('categoryIds', ids)}
                  />
                </div>
              )}
            </div>

            {/* 口座セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
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
                    口座
                  </span>
                  {filters.accountIds.length > 0 && (
                    <span className="ml-auto text-xs font-medium text-primary-600 dark:text-primary-400">
                      {filters.accountIds.length}件選択中
                    </span>
                  )}
                </div>
              </button>

              {isExpanded('account') && (
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
                  <MultiSelect
                    label=""
                    options={accounts.map((a) => ({ id: a.id, name: a.name }))}
                    selectedIds={filters.accountIds}
                    onChange={(ids) => updateFilter('accountIds', ids)}
                  />
                </div>
              )}
            </div>

            {/* 支払方法セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
              <button
                onClick={() => toggleSection('payment')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 transition-transform text-gray-600 dark:text-gray-400 ${
                      isExpanded('payment') ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    支払方法
                  </span>
                  {filters.paymentMethodIds.length > 0 && (
                    <span className="ml-auto text-xs font-medium text-primary-600 dark:text-primary-400">
                      {filters.paymentMethodIds.length}件選択中
                    </span>
                  )}
                </div>
              </button>

              {isExpanded('payment') && (
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
                  <MultiSelect
                    label=""
                    options={paymentMethods.map((pm) => ({ id: pm.id, name: pm.name }))}
                    selectedIds={filters.paymentMethodIds}
                    onChange={(ids) => updateFilter('paymentMethodIds', ids)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 active:scale-95 transition-all text-sm font-medium"
            >
              <RotateCcw size={16} />
              フィルターをリセット
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-white font-medium active:scale-95 transition-all text-sm"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            完了
          </button>
        </div>
      </div>
    </>
  );
};
