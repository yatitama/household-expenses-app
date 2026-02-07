import { ArrowUpDown } from 'lucide-react';

interface SortSelectorProps {
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: 'date' | 'amount' | 'category') => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export const SortSelector = ({ sortBy, sortOrder, onSortByChange, onSortOrderChange }: SortSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value as 'date' | 'amount' | 'category')}
        className="border border-brand-200 dark:border-brand-700 rounded-lg px-3 py-2 text-sm text-brand-900 dark:text-brand-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-300"
        aria-label="並び替え基準"
      >
        <option value="date">日付</option>
        <option value="amount">金額</option>
        <option value="category">カテゴリ</option>
      </select>
      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="flex items-center gap-1 px-3 py-2 border border-brand-200 dark:border-brand-700 rounded-lg text-sm text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-400 dark:hover:border-brand-500 transition-all duration-300"
        aria-label={sortOrder === 'asc' ? '降順に変更' : '昇順に変更'}
      >
        <ArrowUpDown size={14} />
        {sortOrder === 'asc' ? '昇順' : '降順'}
      </button>
    </div>
  );
};
