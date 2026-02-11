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
  members,
  categories,
  accounts,
  paymentMethods,
}: FilterSidePanelProps) => {
  if (!isOpen || !filterType) return null;

  // 個別のフィルターリセット関数
  const resetCurrentFilter = () => {
    switch (filterType) {
      case 'search':
        updateFilter('searchQuery', '');
        break;
      case 'type':
        updateFilter('transactionType', 'all');
        break;
      case 'date':
        updateFilter('dateRange', { start: '', end: '' });
        break;
      case 'member':
        updateFilter('memberIds', []);
        break;
      case 'category':
        updateFilter('categoryIds', []);
        break;
      case 'account':
        updateFilter('accountIds', []);
        break;
      case 'payment':
        updateFilter('paymentMethodIds', []);
        break;
      case 'sort':
        updateFilter('sortBy', 'date');
        updateFilter('sortOrder', 'desc');
        break;
    }
    onClose();
  };

  const getTitleAndContent = () => {
    switch (filterType) {
      case 'search':
        return {
          title: '検索',
          content: (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                placeholder="メモやカテゴリ名で検索"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
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
                ['all', 'すべて'],
                ['income', '収入'],
                ['expense', '支出'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => updateFilter('transactionType', value)}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    filters.transactionType === value
                      ? 'text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-slate-500'
                  }`}
                  style={filters.transactionType === value ? {
                    backgroundColor: value === 'income' ? '#22c55e' : value === 'expense' ? '#ef4444' : 'var(--theme-primary)',
                  } : undefined}
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
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
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
      {/* フローティングパネル */}
      <div
        className={`fixed bottom-44 left-4 right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-black/30 z-50 transition-opacity duration-300 border border-gray-200 dark:border-slate-600 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          maxHeight: 'calc(100vh - 10rem)',
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-600">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-danger-600 hover:bg-danger-700 transition-colors active:scale-95"
            aria-label="閉じる"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
          {content}
        </div>

        {/* フッター（リセットボタン） */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-b-2xl">
          <button
            onClick={resetCurrentFilter}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-gray-100 active:scale-95 transition-all text-sm font-medium border border-gray-200 dark:border-slate-500"
          >
            <RotateCcw size={14} />
            このフィルターをリセット
          </button>
        </div>
      </div>
    </>
  );
};
