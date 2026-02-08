import { useState, useEffect, useRef } from 'react';
import { Filter, Calendar, DollarSign, User, Tag, CreditCard, Wallet, ArrowUpDown, X, Search, RotateCcw } from 'lucide-react';
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
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  isGroupingPanelOpen: boolean;
}

type FilterType = 'type' | 'date' | 'member' | 'category' | 'account' | 'payment' | 'sort' | 'search';

interface FilterMenuItem {
  type: FilterType;
  icon: typeof Filter;
  label: string;
  color: string;
  isActive: boolean;
  activeCount: number;
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
  isExpanded,
  setIsExpanded,
  isGroupingPanelOpen,
}: FloatingFilterMenuProps) => {
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

  // 各フィルターのアクティブ数を計算
  const searchActiveCount = isSearchActive ? 1 : 0;
  const typeActiveCount = isTypeActive ? 1 : 0;
  const dateActiveCount = isDateActive ? 1 : 0;
  const memberActiveCount = filters.memberIds.length;
  const categoryActiveCount = filters.categoryIds.length;
  const accountActiveCount = filters.accountIds.length;
  const paymentActiveCount = filters.paymentMethodIds.length;
  const sortActiveCount = isSortActive ? 1 : 0;

  const filterMenuItems: FilterMenuItem[] = [
    { type: 'search', icon: Search, label: '検索', color: 'bg-purple-500', isActive: isSearchActive, activeCount: searchActiveCount },
    { type: 'type', icon: DollarSign, label: '種別', color: 'bg-blue-500', isActive: isTypeActive, activeCount: typeActiveCount },
    { type: 'date', icon: Calendar, label: '期間', color: 'bg-green-500', isActive: isDateActive, activeCount: dateActiveCount },
    { type: 'member', icon: User, label: 'メンバー', color: 'bg-orange-500', isActive: isMemberActive, activeCount: memberActiveCount },
    { type: 'category', icon: Tag, label: 'カテゴリ', color: 'bg-pink-500', isActive: isCategoryActive, activeCount: categoryActiveCount },
    { type: 'account', icon: Wallet, label: '口座', color: 'bg-teal-500', isActive: isAccountActive, activeCount: accountActiveCount },
    { type: 'payment', icon: CreditCard, label: '支払方法', color: 'bg-indigo-500', isActive: isPaymentActive, activeCount: paymentActiveCount },
    { type: 'sort', icon: ArrowUpDown, label: '並び替え', color: 'bg-gray-500', isActive: isSortActive, activeCount: sortActiveCount },
  ];

  // パネルが開いているときはメニューを閉じない
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // パネルが開いている場合は何もしない
      if (activePanel !== null) return;

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded, activePanel]);

  // パネルを開く
  const handleFilterClick = (type: FilterType) => {
    setActivePanel(type);
  };

  // パネルを閉じる
  const handleClosePanel = () => {
    setActivePanel(null);
  };

  // Hide when grouping panel is open
  if (isGroupingPanelOpen) {
    return null;
  }

  return (
    <>
      {/* オーバーレイ（パネルが開いているときのみ） */}
      {activePanel !== null && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => {
            setActivePanel(null);
          }}
        />
      )}

      {/* フローティングメニュー */}
      <div ref={menuRef} className="fixed bottom-20 right-3 sm:right-5 z-40">
        {/* 展開されたフィルターアイコン（横1列スクロール） */}
        {isExpanded && (
          <div
            className="absolute bottom-0 right-14 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full shadow-xl px-3 py-2 mr-2"
            style={{
              maxWidth: 'calc(100vw - 8rem)',
              width: 'max-content'
            }}
          >
            {/* 全フィルターリセットボタン */}
            <button
              onClick={() => {
                resetFilters();
              }}
              className="w-10 h-10 bg-gray-600 dark:bg-gray-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0"
              title="全てリセット"
              aria-label="全てリセット"
            >
              <RotateCcw size={18} />
            </button>

            {/* 区切り線 */}
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-600 flex-shrink-0" />

            {/* スクロール可能なフィルターボタン */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" style={{ maxWidth: 'calc(100vw - 12rem)' }}>
              {filterMenuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.type}
                    onClick={() => handleFilterClick(item.type)}
                    className={`w-10 h-10 ${item.color} text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 relative flex-shrink-0 ${
                      item.isActive ? 'ring-4 ring-white dark:ring-gray-300' : ''
                    }`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon size={18} />

                    {/* 各フィルターのアクティブ数バッジ */}
                    {item.activeCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white">
                        {item.activeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* メインフィルターボタン */}
        <button
          onClick={() => {
            if (isExpanded) {
              // メニューが展開されている場合は閉じる
              setIsExpanded(false);
              setActivePanel(null);
            } else {
              // メニューを展開する
              setIsExpanded(true);
            }
          }}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            isExpanded ? 'bg-red-500' : activeFilterCount > 0 ? 'bg-blue-600' : 'bg-gray-800 dark:bg-gray-700'
          } text-white active:scale-95 relative`}
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
        members={members}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
      />
    </>
  );
};
