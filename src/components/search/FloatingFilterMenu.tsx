import { useState, useEffect, useRef } from 'react';
import { Filter, Calendar, DollarSign, User, Tag, CreditCard, Wallet, ArrowUpDown, X, Search, RotateCcw, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import { FilterSidePanel } from './FilterSidePanel';
import type { FilterOptions } from '../../hooks/useTransactionFilter';
import type { GroupByType } from '../../pages/TransactionsPage';

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
  groupBy: GroupByType;
  groupOrder: 'asc' | 'desc';
  onGroupByChange: (groupBy: GroupByType) => void;
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
  groupBy,
  groupOrder,
  onGroupByChange,
}: FloatingFilterMenuProps) => {
  const [activePanel, setActivePanel] = useState<FilterType | null>(null);
  const [isGroupingPanelOpen, setIsGroupingPanelOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Grouping helpers
  const getGroupingInfo = (type: GroupByType) => {
    switch (type) {
      case 'date': return { icon: Calendar, label: '日付', color: 'bg-green-500' };
      case 'category': return { icon: Tag, label: 'カテゴリ', color: 'bg-pink-500' };
      case 'member': return { icon: User, label: 'メンバー', color: 'bg-orange-500' };
      case 'account': return { icon: Wallet, label: '口座', color: 'bg-teal-500' };
      case 'payment': return { icon: CreditCard, label: '支払い方法', color: 'bg-indigo-500' };
    }
  };

  const currentGrouping = getGroupingInfo(groupBy);

  const groupingOptions: Array<{ value: GroupByType; label: string }> = [
    { value: 'date', label: '日付' },
    { value: 'category', label: 'カテゴリ' },
    { value: 'member', label: 'メンバー' },
    { value: 'account', label: '口座' },
    { value: 'payment', label: '支払い方法' },
  ];

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
    { type: 'type', icon: DollarSign, label: '種別', color: 'bg-blue-600', isActive: isTypeActive, activeCount: typeActiveCount },
    { type: 'date', icon: Calendar, label: '期間', color: 'bg-green-500', isActive: isDateActive, activeCount: dateActiveCount },
    { type: 'member', icon: User, label: 'メンバー', color: 'bg-orange-500', isActive: isMemberActive, activeCount: memberActiveCount },
    { type: 'category', icon: Tag, label: 'カテゴリ', color: 'bg-pink-500', isActive: isCategoryActive, activeCount: categoryActiveCount },
    { type: 'account', icon: Wallet, label: '口座', color: 'bg-teal-500', isActive: isAccountActive, activeCount: accountActiveCount },
    { type: 'payment', icon: CreditCard, label: '支払方法', color: 'bg-indigo-500', isActive: isPaymentActive, activeCount: paymentActiveCount },
  ];

  // パネルが開いているときはメニューを閉じない
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activePanel !== null || isGroupingPanelOpen) return;

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded, activePanel, isGroupingPanelOpen]);

  const handleFilterClick = (type: FilterType) => {
    setActivePanel(activePanel === type ? null : type);
    setIsGroupingPanelOpen(false);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  return (
    <>
      {/* オーバーレイ（パネルが開いているときのみ） */}
      {(activePanel !== null || isGroupingPanelOpen) && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => {
            setActivePanel(null);
            setIsGroupingPanelOpen(false);
          }}
        />
      )}

      {/* グループ化パネル */}
      {isGroupingPanelOpen && (
        <div
          className="fixed bottom-40 left-4 right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-black/30 z-50 border border-gray-200 dark:border-slate-600"
          style={{ maxHeight: 'calc(100vh - 10rem)' }}
        >
          <div className="p-3 border-b border-gray-200 dark:border-slate-600">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">グループ化</h3>
          </div>
          <div className="p-3 space-y-2">
            {groupingOptions.map((option) => {
              const info = getGroupingInfo(option.value);
              const OptionIcon = info.icon;
              const isSelected = groupBy === option.value;
              const OrderIcon = groupOrder === 'desc' ? ArrowDown : ArrowUp;

              return (
                <button
                  key={option.value}
                  onClick={() => onGroupByChange(option.value)}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all active:scale-95 flex items-center gap-2 ${
                    isSelected
                      ? `${info.color} text-white shadow-lg`
                      : 'bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-slate-500'
                  }`}
                >
                  <OptionIcon size={16} />
                  <span className="flex-1 text-left">{option.label}</span>
                  {isSelected && <OrderIcon size={16} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* フローティングメニュー */}
      <div ref={menuRef} className="fixed right-3 sm:right-5 bottom-20 z-40 flex flex-col items-end gap-3">
        {/* メインボタン行（横メニュー + フィルターボタン） */}
        <div className="relative">
          {/* 展開されたフィルターアイコン（横1列スクロール） */}
          {isExpanded && (
            <div
              className="absolute bottom-0 right-14 flex items-center gap-3 bg-gray-200 dark:bg-gray-700 rounded-full shadow-2xl shadow-black/50 px-6 mr-2 border border-white/10"
              style={{
                maxWidth: 'calc(100vw - 5rem)',
                width: 'max-content',
                height: '3.5rem',
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
              <div className="w-px h-8 bg-gray-400 dark:bg-gray-500 flex-shrink-0" />

              {/* スクロール可能なボタン（フィルター・ソート・グルーピング） */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 flex-1 min-w-0 px-3">
                {filterMenuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.type}
                      onClick={() => handleFilterClick(item.type)}
                      className={`min-w-[44px] h-11 ${item.color} text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 relative flex-shrink-0 ${
                        item.isActive ? 'ring-2 ring-white opacity-100' : 'opacity-75 hover:opacity-100'
                      }`}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <Icon size={18} />

                      {/* 各フィルターのアクティブ数バッジ */}
                      {item.activeCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white dark:border-slate-800">
                          {item.activeCount}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* 並び替えボタン */}
                <button
                  onClick={() => handleFilterClick('sort')}
                  className={`min-w-[44px] h-11 bg-amber-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 relative flex-shrink-0 ${
                    isSortActive ? 'ring-2 ring-white opacity-100' : 'opacity-75 hover:opacity-100'
                  }`}
                  title="並び替え"
                  aria-label="並び替え"
                >
                  <ArrowUpDown size={18} />
                  {sortActiveCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white dark:border-slate-800">
                      {sortActiveCount}
                    </span>
                  )}
                </button>

                {/* グループ化ボタン */}
                <button
                  onClick={() => {
                    if (!isGroupingPanelOpen) {
                      setActivePanel(null);
                    }
                    setIsGroupingPanelOpen(!isGroupingPanelOpen);
                  }}
                  className={`min-w-[44px] h-11 ${currentGrouping.color} text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0 ring-2 ring-white opacity-100`}
                  aria-label={`グループ化: ${currentGrouping.label}`}
                  title={`グループ化: ${currentGrouping.label}`}
                >
                  <Layers size={18} />
                </button>
              </div>
            </div>
          )}

          {/* メインフィルターボタン */}
          <button
            onClick={() => {
              if (isExpanded) {
                setIsExpanded(false);
                setActivePanel(null);
                setIsGroupingPanelOpen(false);
              } else {
                setIsExpanded(true);
              }
            }}
            className={`min-w-[56px] min-h-[56px] rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
              isExpanded ? 'bg-danger-600' : activeFilterCount > 0 ? 'bg-primary-700' : 'bg-gray-900 dark:bg-gray-800'
            } text-white active:scale-95 relative`}
            aria-label={isExpanded ? 'フィルターを閉じる' : 'フィルターを開く'}
          >
            {isExpanded ? <X size={24} /> : <Filter size={24} />}

            {/* アクティブフィルター数のバッジ */}
            {!isExpanded && activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border border-white dark:border-gray-800">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
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
