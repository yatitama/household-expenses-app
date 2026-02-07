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
}: FloatingFilterMenuProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<FilterType | null>(null);
  const [rotation, setRotation] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; angle: number } | null>(null);

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

  // メインボタンの角度計算（円形に配置）
  const getItemPosition = (index: number, itemsPerPage: number, currentRotation: number) => {
    const radius = 90; // ボタンからの距離
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
  const currentPage = Math.floor(Math.abs(rotation) / 90) % totalPages;
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

  // タッチ位置から角度を計算
  const getAngleFromCenter = (x: number, y: number, centerX: number, centerY: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  // タッチジェスチャーハンドラー
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!menuRef.current || !isExpanded) return;

    const touch = e.touches[0];
    const rect = menuRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = getAngleFromCenter(touch.clientX, touch.clientY, centerX, centerY);

    touchStartRef.current = { x: touch.clientX, y: touch.clientY, angle };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!menuRef.current || !isExpanded || !touchStartRef.current) return;

    const touch = e.touches[0];
    const rect = menuRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = getAngleFromCenter(touch.clientX, touch.clientY, centerX, centerY);

    // 角度の差分を計算
    let angleDiff = currentAngle - touchStartRef.current.angle;

    // 角度の正規化（-180〜180の範囲に）
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    // 回転を更新
    setRotation((prev) => prev + angleDiff);

    // 次のフレームのために現在の角度を保存
    touchStartRef.current.angle = currentAngle;
  };

  const handleTouchEnd = () => {
    // 最も近いページにスナップ
    const nearestPage = Math.round(rotation / 90);
    setRotation(nearestPage * 90);
    touchStartRef.current = null;
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
      <div
        ref={menuRef}
        className="fixed bottom-20 right-6 z-40"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 展開されたフィルターアイコン */}
        {isExpanded && (
          <div className="absolute bottom-0 right-0 pointer-events-none">
            {visibleItems.map((item, index) => {
              const pos = getItemPosition(index, itemsPerPage, rotation);
              const Icon = item.icon;

              return (
                <button
                  key={item.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFilterClick(item.type);
                  }}
                  className={`absolute w-12 h-12 ${item.color} text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 pointer-events-auto ${
                    item.isActive ? 'ring-4 ring-white' : ''
                  }`}
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    left: '-24px',
                    top: '-24px',
                  }}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={20} />

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
        )}

        {/* メインフィルターボタン（常に中心） */}
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
          } text-white active:scale-95 relative z-10`}
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

        {/* 回転のヒントテキスト（モバイル用） */}
        {isExpanded && totalPages > 1 && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap pointer-events-none">
            指で回転
          </div>
        )}
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
