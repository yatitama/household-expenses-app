import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = '取引を検索...' }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 dark:text-brand-500" />
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 premium-card border border-brand-200 dark:border-brand-700/50 rounded-lg text-sm text-brand-900 dark:text-brand-100 placeholder:text-brand-400 dark:placeholder:text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-300"
        aria-label="取引を検索"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 dark:text-brand-500 dark:hover:text-brand-400 transition-colors"
          aria-label="検索をクリア"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
