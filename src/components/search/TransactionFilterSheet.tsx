import { X, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import { MultiSelect } from './MultiSelect';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { FilterOptions } from '../../hooks/useTransactionFilter';
import type { GroupByType } from '../../pages/TransactionsPage';

interface TransactionFilterSheetProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  members: { id: string; name: string; color: string }[];
  categories: { id: string; name: string; color: string; icon: string; memberId: string }[];
  accounts: { id: string; name: string; color?: string }[];
  paymentMethods: { id: string; name: string; color?: string }[];
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
          <div className="p-3 sm:p-4">
            {/* グループ化セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
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
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3 flex gap-2">
                  <select
                    value={groupBy}
                    onChange={(e) => onGroupByChange(e.target.value as GroupByType)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <option value="date">日付</option>
                    <option value="category">カテゴリ</option>
                    <option value="member">メンバー</option>
                    <option value="account">口座</option>
                    <option value="payment">支払方法</option>
                  </select>

                  <select
                    value={groupOrder}
                    onChange={() => onGroupByChange(groupBy)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <option value="desc">▼ 降順</option>
                    <option value="asc">▲ 昇順</option>
                  </select>
                </div>
              )}
            </div>

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

            {/* メンバーセクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
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
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
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
                      const member = members.find((m) => m.id === category.memberId);
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
                          className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                            filters.categoryIds.includes(category.id)
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                              : 'border border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {getCategoryIcon(category.icon, 14)}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-200 truncate w-full text-center leading-tight">
                            {category.name}
                          </span>
                          {member && member.id !== 'common' && (
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-none">{member.name}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 口座セクション */}
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
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="grid grid-cols-2 gap-2">
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
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          filters.accountIds.includes(account.id)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: account.color || '#9ca3af' }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">{account.name}</span>
                        </div>
                        {filters.accountIds.includes(account.id) && <Check size={14} className="text-primary-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 支払方法セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
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
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="grid grid-cols-2 gap-2">
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
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          filters.paymentMethodIds.includes(pm.id)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pm.color || '#9ca3af' }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">{pm.name}</span>
                        </div>
                        {filters.paymentMethodIds.includes(pm.id) && <Check size={14} className="text-primary-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
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
