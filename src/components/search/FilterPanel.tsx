import { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { MultiSelect } from './MultiSelect';
import { SortSelector } from './SortSelector';
import type { FilterOptions } from '../../hooks/useTransactionFilter';

interface FilterPanelProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  members: { id: string; name: string; color: string }[];
  categories: { id: string; name: string; color: string }[];
  accounts: { id: string; name: string }[];
  paymentMethods: { id: string; name: string }[];
}

export const FilterPanel = ({
  filters,
  updateFilter,
  resetFilters,
  activeFilterCount,
  members,
  categories,
  accounts,
  paymentMethods,
}: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-controls="filter-panel"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          <span>フィルタ</span>
          {activeFilterCount > 0 && (
            <span className="text-white text-sm rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div id="filter-panel" className="p-3 pt-0 space-y-4">
          {/* Transaction type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">種別</label>
            <div className="flex rounded-lg overflow-hidden">
              {([['all', 'すべて'], ['income', '収入'], ['expense', '支出']] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => updateFilter('transactionType', value)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    filters.transactionType === value
                      ? value === 'income' ? 'bg-gray-600 text-white'
                        : value === 'expense' ? 'text-white'
                        : 'text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <DateRangePicker
            start={filters.dateRange.start}
            end={filters.dateRange.end}
            onStartChange={(v) => updateFilter('dateRange', { ...filters.dateRange, start: v })}
            onEndChange={(v) => updateFilter('dateRange', { ...filters.dateRange, end: v })}
          />

          {/* Members */}
          <MultiSelect
            label="メンバー"
            options={members.map((m) => ({ id: m.id, name: m.name, color: m.color }))}
            selectedIds={filters.memberIds}
            onChange={(ids) => updateFilter('memberIds', ids)}
          />

          {/* Categories */}
          <MultiSelect
            label="カテゴリ"
            options={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
            selectedIds={filters.categoryIds}
            onChange={(ids) => updateFilter('categoryIds', ids)}
          />

          {/* Accounts */}
          {accounts.length > 0 && (
            <MultiSelect
              label="口座"
              options={accounts.map((a) => ({ id: a.id, name: a.name }))}
              selectedIds={filters.accountIds}
              onChange={(ids) => updateFilter('accountIds', ids)}
            />
          )}

          {/* Payment methods */}
          {paymentMethods.length > 0 && (
            <MultiSelect
              label="支払い手段"
              options={paymentMethods.map((pm) => ({ id: pm.id, name: pm.name }))}
              selectedIds={filters.paymentMethodIds}
              onChange={(ids) => updateFilter('paymentMethodIds', ids)}
            />
          )}

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">並び替え</label>
            <SortSelector
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSortByChange={(v) => updateFilter('sortBy', v)}
              onSortOrderChange={(v) => updateFilter('sortOrder', v)}
            />
          </div>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={14} />
              フィルタをリセット
            </button>
          )}
        </div>
      )}
    </div>
  );
};
