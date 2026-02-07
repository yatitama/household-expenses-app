import { useState, useEffect, useRef } from 'react';
import { Calendar, Tag, User, Wallet, CreditCard } from 'lucide-react';
import type { GroupByType } from '../../pages/TransactionsPage';

interface GroupingButtonProps {
  groupBy: GroupByType;
  onGroupByChange: (groupBy: GroupByType) => void;
  isFilterMenuExpanded: boolean;
}

export const GroupingButton = ({
  groupBy,
  onGroupByChange,
  isFilterMenuExpanded,
}: GroupingButtonProps) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get icon and color for current groupBy
  const getGroupingInfo = (type: GroupByType) => {
    switch (type) {
      case 'date':
        return { icon: Calendar, label: '日付', color: 'bg-green-500' };
      case 'category':
        return { icon: Tag, label: 'カテゴリ', color: 'bg-pink-500' };
      case 'member':
        return { icon: User, label: 'メンバー', color: 'bg-orange-500' };
      case 'account':
        return { icon: Wallet, label: '口座', color: 'bg-teal-500' };
      case 'payment':
        return { icon: CreditCard, label: '支払い方法', color: 'bg-indigo-500' };
      default:
        return { icon: Calendar, label: '日付', color: 'bg-green-500' };
    }
  };

  const currentGrouping = getGroupingInfo(groupBy);
  const CurrentIcon = currentGrouping.icon;

  const groupingOptions: Array<{ value: GroupByType; label: string; color: string }> = [
    { value: 'date', label: '日付', color: 'bg-green-500' },
    { value: 'category', label: 'カテゴリ', color: 'bg-pink-500' },
    { value: 'member', label: 'メンバー', color: 'bg-orange-500' },
    { value: 'account', label: '口座', color: 'bg-teal-500' },
    { value: 'payment', label: '支払い方法', color: 'bg-indigo-500' },
  ];

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPanelOpen(false);
      }
    };

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPanelOpen]);

  // Hide when filter menu is expanded
  if (isFilterMenuExpanded) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* Panel */}
      {isPanelOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-44 left-4 right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50"
          style={{
            maxHeight: 'calc(100vh - 10rem)',
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">グループ化</h3>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {groupingOptions.map((option) => {
              const OptionIcon = getGroupingInfo(option.value).icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onGroupByChange(option.value);
                    setIsPanelOpen(false);
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all active:scale-95 flex items-center gap-2 ${
                    groupBy === option.value
                      ? `${option.color} text-white shadow-lg`
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <OptionIcon size={16} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={`fixed bottom-20 left-3 sm:left-5 z-40 w-14 h-14 ${currentGrouping.color} text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95`}
        aria-label={`グループ化: ${currentGrouping.label}`}
        title={`グループ化: ${currentGrouping.label}`}
      >
        <CurrentIcon size={24} />
      </button>
    </>
  );
};
