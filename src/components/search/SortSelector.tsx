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
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="並び替え基準"
      >
        <option value="date">日付</option>
        <option value="amount">金額</option>
        <option value="category">カテゴリ</option>
      </select>
      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50"
        aria-label={sortOrder === 'asc' ? '降順に変更' : '昇順に変更'}
      >
        <ArrowUpDown size={14} />
        {sortOrder === 'asc' ? '昇順' : '降順'}
      </button>
    </div>
  );
};
