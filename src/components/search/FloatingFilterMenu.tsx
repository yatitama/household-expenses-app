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
  const [rotation, setRotation] = useState(0);
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

  // メインボタンの角度計算（真上から真左の範囲に配置）
  const getItemPosition = (index: number, itemsPerPage: number, currentRotation: number) => {
    const radius = 80; // ボタンからの距離
    const startAngle = -90; // 真上から開始
    const endAngle = 180; // 真左まで
    const totalAngle = endAngle - startAngle; // 270度の範囲
    const angleStep = totalAngle / (itemsPerPage - 1);
    const angle = (startAngle + angleStep * index + currentRotation) * (Math.PI / 180);

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // 表示するアイテムの数（1ページあたり）
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filterMenuItems.length / itemsPerPage);
  const currentPage = Math.floor(rotation / 90) % totalPages;
  const visibleItems = filterMenuItems.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // 回転処理
  const rotateNext = () => {
    setRotation((prev) => prev - 90);
  };

  const rotatePrev = () => {
    setRotation((prev) => prev + 90);
  };

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
      <div ref={menuRef} className="fixed bottom-20 right-6 z-40">
        {/* 展開されたフィルターアイコン */}
        {isExpanded && (
          <div className="absolute bottom-0 right-0">
            {visibleItems.map((item, index) => {
              const pos = getItemPosition(index, itemsPerPage, rotation);
              const Icon = item.icon;

              return (
                <button
                  key={item.type}
                  onClick={() => handleFilterClick(item.type)}
                  className={`absolute w-12 h-12 ${item.color} text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95 ${
                    item.isActive ? 'ring-4 ring-white' : ''
                  }`}
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                  }}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={20} />
                </button>
              );
            })}

            {/* 回転ボタン（次へ） */}
            {totalPages > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  rotateNext();
                }}
                className="absolute w-8 h-8 bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95"
                style={{
                  transform: 'translate(-100px, 0px)',
                }}
                title="次のページ"
                aria-label="次のページ"
              >
                <span className="text-xs">›</span>
              </button>
            )}

            {/* 回転ボタン（前へ） */}
            {totalPages > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  rotatePrev();
                }}
                className="absolute w-8 h-8 bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95"
                style={{
                  transform: 'translate(-100px, -40px)',
                }}
                title="前のページ"
                aria-label="前のページ"
              >
                <span className="text-xs">‹</span>
              </button>
            )}
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
            isExpanded ? 'bg-red-500 rotate-180' : activeFilterCount > 0 ? 'bg-blue-600' : 'bg-gray-800 dark:bg-gray-700'
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
        resetFilters={resetFilters}
        members={members}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
      />
    </>
  );
};
