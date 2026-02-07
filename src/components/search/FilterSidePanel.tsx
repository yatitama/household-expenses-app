import { X, RotateCcw } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { MultiSelect } from './MultiSelect';
import { SortSelector } from './SortSelector';
import type { FilterOptions } from '../../hooks/useTransactionFilter';

interface FilterSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  filterType: 'type' | 'date' | 'member' | 'category' | 'account' | 'payment' | 'sort' | 'search' | null;
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  members: { id: string; name: string; color: string }[];
  categories: { id: string; name: string; color: string }[];
  accounts: { id: string; name: string }[];
  paymentMethods: { id: string; name: string }[];
}

export const FilterSidePanel = ({
  isOpen,
  onClose,
  filterType,
  filters,
  updateFilter,
  resetFilters,
  members,
  categories,
  accounts,
  paymentMethods,
}: FilterSidePanelProps) => {
  if (!isOpen || !filterType) return null;

  const getTitleAndContent = () => {
    switch (filterType) {
      case 'search':
        return {
          title: '検索',
          content: (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                placeholder="メモやカテゴリ名で検索"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          ),
        };

      case 'type':
        return {
          title: '取引種別',
          content: (
            <div className="space-y-2">
              {([
                ['all', 'すべて', 'bg-gray-500'],
                ['income', '収入', 'bg-green-500'],
                ['expense', '支出', 'bg-red-500'],
              ] as const).map(([value, label, colorClass]) => (
                <button
                  key={value}
                  onClick={() => updateFilter('transactionType', value)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    filters.transactionType === value
                      ? `${colorClass} text-white shadow-lg`
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ),
        };

      case 'date':
        return {
          title: '期間',
          content: (
            <DateRangePicker
              start={filters.dateRange.start}
              end={filters.dateRange.end}
              onStartChange={(v) => updateFilter('dateRange', { ...filters.dateRange, start: v })}
              onEndChange={(v) => updateFilter('dateRange', { ...filters.dateRange, end: v })}
            />
          ),
        };

      case 'member':
        return {
          title: 'メンバー',
          content: (
            <MultiSelect
              label=""
              options={members.map((m) => ({ id: m.id, name: m.name, color: m.color }))}
              selectedIds={filters.memberIds}
              onChange={(ids) => updateFilter('memberIds', ids)}
            />
          ),
        };

      case 'category':
        return {
          title: 'カテゴリ',
          content: (
            <MultiSelect
              label=""
              options={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
              selectedIds={filters.categoryIds}
              onChange={(ids) => updateFilter('categoryIds', ids)}
            />
          ),
        };

      case 'account':
        return {
          title: '口座',
          content: (
            <MultiSelect
              label=""
              options={accounts.map((a) => ({ id: a.id, name: a.name }))}
              selectedIds={filters.accountIds}
              onChange={(ids) => updateFilter('accountIds', ids)}
            />
          ),
        };

      case 'payment':
        return {
          title: '支払い方法',
          content: (
            <MultiSelect
              label=""
              options={paymentMethods.map((pm) => ({ id: pm.id, name: pm.name }))}
              selectedIds={filters.paymentMethodIds}
              onChange={(ids) => updateFilter('paymentMethodIds', ids)}
            />
          ),
        };

      case 'sort':
        return {
          title: '並び替え',
          content: (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                並び順
              </label>
              <SortSelector
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onSortByChange={(v) => updateFilter('sortBy', v)}
                onSortOrderChange={(v) => updateFilter('sortOrder', v)}
              />
            </div>
          ),
        };

      default:
        return { title: '', content: null };
    }
  };

  const { title, content } = getTitleAndContent();

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      {/* サイドパネル */}
      <div
        className={`fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="閉じる"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {content}
        </div>

        {/* フッター（リセットボタン） */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
          <button
            onClick={() => {
              resetFilters();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            <RotateCcw size={16} />
            すべてのフィルターをリセット
          </button>
        </div>
      </div>
    </>
  );
};
