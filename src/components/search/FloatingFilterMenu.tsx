import { useState, useEffect, useRef } from 'react';
import { Filter, Calendar, DollarSign, User, Tag, CreditCard, Wallet, ArrowUpDown, X, Search } from 'lucide-react';
import { FilterSidePanel } from './FilterSidePanel';
import type { FilterOptions } from '../../hooks/useTransactionFilter';

interface FloatingFilterMenuProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  members: { id: string; name: string; color: string }[];
  categories: { id: string; name: string; color: string }[];
  accounts: { id: string; name: string }[];
  paymentMethods: { id: string; name: string }[];
}

type FilterType = 'type' | 'date' | 'member' | 'category' | 'account' | 'payment' | 'sort' | 'search';

interface FilterMenuItem {
  type: FilterType;
  icon: typeof Filter;
  label: string;
  color: string;
  isActive: boolean;
}

export const FloatingFilterMenu = ({
  filters,
  updateFilter,
  resetFilters,
  activeFilterCount,
  members,
  categories,
  accounts,
  paymentMethods,
}: FloatingFilterMenuProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<FilterType | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 各フィルターがアクティブかどうかを判定
  const isTypeActive = filters.transactionType !== 'all';
  const isDateActive = filters.dateRange.start !== '' || filters.dateRange.end !== '';
  const isMemberActive = filters.memberIds.length > 0;
  const isCategoryActive = filters.categoryIds.length > 0;
  const isAccountActive = filters.accountIds.length > 0;
  const isPaymentActive = filters.paymentMethodIds.length > 0;
  const isSortActive = filters.sortBy !== 'date' || filters.sortOrder !== 'desc';
  const isSearchActive = filters.searchQuery !== '';

  const filterMenuItems: FilterMenuItem[] = [
    { type: 'search', icon: Search, label: '検索', color: 'bg-purple-500', isActive: isSearchActive },
    { type: 'type', icon: DollarSign, label: '種別', color: 'bg-blue-500', isActive: isTypeActive },
    { type: 'date', icon: Calendar, label: '期間', color: 'bg-green-500', isActive: isDateActive },
    { type: 'member', icon: User, label: 'メンバー', color: 'bg-orange-500', isActive: isMemberActive },
    { type: 'category', icon: Tag, label: 'カテゴリ', color: 'bg-pink-500', isActive: isCategoryActive },
    { type: 'account', icon: Wallet, label: '口座', color: 'bg-teal-500', isActive: isAccountActive },
    { type: 'payment', icon: CreditCard, label: '支払方法', color: 'bg-indigo-500', isActive: isPaymentActive },
    { type: 'sort', icon: ArrowUpDown, label: '並び替え', color: 'bg-gray-500', isActive: isSortActive },
  ];

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setActivePanel(null);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // パネルを開く
  const handleFilterClick = (type: FilterType) => {
    setActivePanel(type);
  };

  // パネルを閉じる
  const handleClosePanel = () => {
    setActivePanel(null);
  };

  // メインボタンの角度計算（円形配置）
  const getItemPosition = (index: number, total: number) => {
    const radius = 80; // ボタンからの距離
    const startAngle = -90; // 上から開始
    const angleStep = 360 / total;
    const angle = (startAngle + angleStep * index) * (Math.PI / 180);

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  return (
    <>
      {/* フローティングメニュー */}
      <div ref={menuRef} className="fixed bottom-6 right-6 z-40">
        {/* 展開されたフィルターアイコン */}
        {isExpanded && (
          <div className="absolute bottom-0 right-0">
            {filterMenuItems.map((item, index) => {
              const pos = getItemPosition(index, filterMenuItems.length);
              const Icon = item.icon;

              return (
                <button
                  key={item.type}
                  onClick={() => handleFilterClick(item.type)}
                  className={`absolute w-12 h-12 ${item.color} text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    item.isActive ? 'ring-4 ring-white' : ''
                  }`}
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    opacity: isExpanded ? 1 : 0,
                  }}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
        )}

        {/* メインフィルターボタン */}
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (isExpanded) {
              setActivePanel(null);
            }
          }}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            isExpanded ? 'bg-red-500 rotate-180' : activeFilterCount > 0 ? 'bg-blue-600' : 'bg-gray-800 dark:bg-gray-700'
          } text-white hover:scale-110 relative`}
          aria-label={isExpanded ? 'フィルターを閉じる' : 'フィルターを開く'}
        >
          {isExpanded ? <X size={24} /> : <Filter size={24} />}

          {/* アクティブフィルター数のバッジ */}
          {!isExpanded && activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* フィルターサイドパネル */}
      <FilterSidePanel
        isOpen={activePanel !== null}
        onClose={handleClosePanel}
        filterType={activePanel}
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        members={members}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
      />
    </>
  );
};
