import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { FilterSidePanel } from './FilterSidePanel';
import type { FilterOptions } from '../../hooks/useTransactionFilter';
import type { GroupByType } from '../../pages/TransactionsPage';

interface SimpleFilterBarProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  members: { id: string; name: string; color: string }[];
  categories: { id: string; name: string; color: string }[];
  accounts: { id: string; name: string }[];
  paymentMethods: { id: string; name: string }[];
  groupBy: GroupByType;
  groupOrder: 'asc' | 'desc';
  onGroupByChange: (groupBy: GroupByType) => void;
}

type FilterType = 'type' | 'date' | 'member' | 'category' | 'account' | 'payment';

export const SimpleFilterBar = ({
  filters,
  updateFilter,
  resetFilters,
  activeFilterCount,
  members,
  categories,
  accounts,
  paymentMethods,
  groupBy,
  groupOrder,
  onGroupByChange,
}: SimpleFilterBarProps) => {
  const [activePanel, setActivePanel] = useState<FilterType | null>(null);

  const filterChips: Array<{
    id: FilterType;
    label: string;
    isActive: boolean;
    onClear: () => void;
  }> = [
    {
      id: 'type',
      label: filters.transactionType === 'all' ? '種別' : filters.transactionType === 'income' ? '収入のみ' : '支出のみ',
      isActive: filters.transactionType !== 'all',
      onClear: () => updateFilter('transactionType', 'all'),
    },
    {
      id: 'date',
      label: '日付',
      isActive: filters.dateRange.start !== '' || filters.dateRange.end !== '',
      onClear: () => updateFilter('dateRange', { start: '', end: '' }),
    },
    {
      id: 'member',
      label: `メンバー${filters.memberIds.length > 0 ? ` (${filters.memberIds.length})` : ''}`,
      isActive: filters.memberIds.length > 0,
      onClear: () => updateFilter('memberIds', []),
    },
    {
      id: 'category',
      label: `カテゴリ${filters.categoryIds.length > 0 ? ` (${filters.categoryIds.length})` : ''}`,
      isActive: filters.categoryIds.length > 0,
      onClear: () => updateFilter('categoryIds', []),
    },
    {
      id: 'account',
      label: `口座${filters.accountIds.length > 0 ? ` (${filters.accountIds.length})` : ''}`,
      isActive: filters.accountIds.length > 0,
      onClear: () => updateFilter('accountIds', []),
    },
    {
      id: 'payment',
      label: `支払方法${filters.paymentMethodIds.length > 0 ? ` (${filters.paymentMethodIds.length})` : ''}`,
      isActive: filters.paymentMethodIds.length > 0,
      onClear: () => updateFilter('paymentMethodIds', []),
    },
  ];

  const handleChipClick = (chip: typeof filterChips[number]) => {
    if (chip.isActive) {
      // アクティブな場合は解除
      chip.onClear();
    } else {
      // 非アクティブな場合はパネルを開く
      setActivePanel(chip.id);
    }
  };

  return (
    <>
      {/* オーバーレイ（パネルが開いているときのみ） */}
      {activePanel !== null && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setActivePanel(null)}
        />
      )}

      <div className="space-y-3">
        {/* フィルターチップ */}
        <div className="flex items-center gap-2 overflow-x-auto py-3">
          <div className="flex gap-2 flex-nowrap">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 touch-action-manipulation ${
                  chip.isActive
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* リセットボタン */}
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex-shrink-0 p-2.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors active:scale-95 touch-action-manipulation"
              title="フィルターをリセット"
              aria-label="フィルターをリセット"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>

        {/* グループ化オプション */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600 dark:text-gray-400">グループ化:</span>
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as GroupByType)}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs transition-colors"
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
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs transition-colors"
          >
            <option value="desc">▼ 降順</option>
            <option value="asc">▲ 昇順</option>
          </select>
        </div>
      </div>

      {/* フィルターサイドパネル */}
      <FilterSidePanel
        isOpen={activePanel !== null}
        onClose={() => setActivePanel(null)}
        filterType={activePanel}
        filters={filters}
        updateFilter={updateFilter}
        members={members}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
      />
    </>
  );
};
