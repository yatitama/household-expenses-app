import { Search, X } from 'lucide-react';

interface SearchBarProps {
 value: string;
 onChange: (value: string) => void;
 placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = '取引を検索...' }: SearchBarProps) => {
 return (
 <div className="relative">
 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 id="search-input"
 type="text"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 placeholder={placeholder}
 className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
 aria-label="取引を検索"
 />
 {value && (
 <button
 onClick={() => onChange('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
 aria-label="検索をクリア"
 >
 <X size={16} />
 </button>
 )}
 </div>
 );
};
