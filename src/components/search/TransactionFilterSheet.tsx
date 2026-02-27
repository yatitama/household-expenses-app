import { X, RotateCcw, Check, Wallet, CreditCard, Edit2, Plus } from 'lucide-react';
import { useState } from 'react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { SaveFilterNameModal } from './SaveFilterNameModal';
import { EditFilterSheet } from './EditFilterSheet';
import { CreateFilterSheet } from './CreateFilterSheet';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { FilterOptions } from '../../hooks/useTransactionFilter';
import type { SavedFilter } from '../../types';

interface TransactionFilterSheetProps {
  filters: FilterOptions;
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  resetFilters: () => void;
  categories: { id: string; name: string; color: string; icon: string }[];
  accounts: { id: string; name: string; color?: string }[];
  paymentMethods: { id: string; name: string; color?: string }[];
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string) => void;
  onApplySavedFilter: (filterId: string) => void;
  onDeleteSavedFilter: (filterId: string) => void;
  onUpdateSavedFilter: (filterId: string, name: string, filterOptions?: Omit<FilterOptions, 'sortBy' | 'sortOrder'>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionFilterSheet = ({
  filters,
  updateFilter,
  resetFilters,
  categories,
  accounts,
  paymentMethods,
  savedFilters,
  onSaveFilter,
  onApplySavedFilter,
  onDeleteSavedFilter,
  onUpdateSavedFilter,
  isOpen,
  onClose,
}: TransactionFilterSheetProps) => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [isCreatingFilter, setIsCreatingFilter] = useState(false);
  const [showDateCustom, setShowDateCustom] = useState(false);

  if (!isOpen) return null;

  const handleSaveFilter = (name: string) => {
    onSaveFilter(name);
    setIsSaveModalOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[999]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl z-[1000] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 dark:border-gray-700 z-10 p-3 sm:p-4 border-b flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            フィルター
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-0 py-2">
            {/* 保存済みフィルターセクション */}
            {(
              <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
                <div className="px-2 pt-2 pb-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    保存済みフィルター
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {savedFilters.map((savedFilter) => (
                      <div
                        key={savedFilter.id}
                        className="relative h-[60px]"
                      >
                        <button
                          onClick={() => onApplySavedFilter(savedFilter.id)}
                          className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600"
                        >
                          <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center line-clamp-2" title={savedFilter.name}>
                            {savedFilter.name}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFilter(savedFilter);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors z-10"
                          aria-label="編集"
                        >
                          <Edit2 size={14} className="text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    ))}
                    {/* Add Filter Button */}
                    <button
                      onClick={() => setIsCreatingFilter(true)}
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 min-h-[60px]"
                      aria-label="フィルターを作成"
                    >
                      <Plus size={24} className="text-gray-400 dark:text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 取引種別セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <div className="px-2 pt-2 pb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  取引種別
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { value: 'all' as const, label: 'すべて' },
                    { value: 'expense' as const, label: '支出' },
                    { value: 'income' as const, label: '収入' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateFilter('transactionType', type.value)}
                      className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                        filters.transactionType === type.value
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {type.label}
                      </span>
                      {filters.transactionType === type.value && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 期間セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <div className="px-2 pt-2 pb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  期間
                </span>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {(() => {
                    const today = new Date();
                    const presets = [
                      {
                        label: '今月',
                        getValue: () => {
                          const start = format(startOfMonth(today), 'yyyy-MM-dd');
                          const end = format(endOfMonth(today), 'yyyy-MM-dd');
                          return { start, end };
                        },
                      },
                      {
                        label: '先月',
                        getValue: () => {
                          const lastMonth = subMonths(today, 1);
                          const start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
                          const end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
                          return { start, end };
                        },
                      },
                      {
                        label: '3ヶ月',
                        getValue: () => {
                          const start = format(subMonths(today, 3), 'yyyy-MM-dd');
                          const end = format(today, 'yyyy-MM-dd');
                          return { start, end };
                        },
                      },
                      {
                        label: '半年',
                        getValue: () => {
                          const start = format(subMonths(today, 6), 'yyyy-MM-dd');
                          const end = format(today, 'yyyy-MM-dd');
                          return { start, end };
                        },
                      },
                      {
                        label: '1年',
                        getValue: () => {
                          const start = format(subMonths(today, 12), 'yyyy-MM-dd');
                          const end = format(today, 'yyyy-MM-dd');
                          return { start, end };
                        },
                      },
                      {
                        label: 'カスタム',
                        getValue: () => ({ start: '', end: '' }),
                        isCustom: true,
                      },
                    ];

                    return presets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (preset.isCustom) {
                            if (showDateCustom) {
                              // 既にカスタム選択中なら外す
                              updateFilter('dateRange', { start: '', end: '' });
                              setShowDateCustom(false);
                            } else {
                              // カスタム選択を開く
                              updateFilter('dateRange', { start: '', end: '' });
                              setShowDateCustom(true);
                            }
                          } else {
                            const { start, end } = preset.getValue();
                            // 既に選択されているなら外す、そうでなければ選択
                            if (filters.dateRange.start === start && filters.dateRange.end === end) {
                              updateFilter('dateRange', { start: '', end: '' });
                              setShowDateCustom(false);
                            } else {
                              updateFilter('dateRange', { start, end });
                              setShowDateCustom(false);
                            }
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] text-sm font-medium ${
                          preset.isCustom
                            ? showDateCustom
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : ''
                            : filters.dateRange.start === preset.getValue().start &&
                              filters.dateRange.end === preset.getValue().end
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : ''
                        }`}
                      >
                        {preset.label}
                        {!preset.isCustom &&
                          filters.dateRange.start === preset.getValue().start &&
                          filters.dateRange.end === preset.getValue().end && (
                            <div className="absolute -top-1 -right-1">
                              <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                            </div>
                          )}
                        {preset.isCustom && showDateCustom && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    ));
                  })()}
                </div>

                {/* カスタム日付ピッカー */}
                {showDateCustom && (
                  <div className="space-y-2 pt-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">いつから</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={filters.dateRange.start}
                          max={filters.dateRange.end || undefined}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && filters.dateRange.end && value > filters.dateRange.end) {
                              updateFilter('dateRange', { start: value, end: '' });
                            } else {
                              updateFilter('dateRange', { start: value, end: filters.dateRange.end });
                            }
                          }}
                          className="w-full px-2 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-600 focus:outline-none appearance-none pr-8"
                        />
                        {filters.dateRange.start && (
                          <button
                            type="button"
                            onClick={() =>
                              updateFilter('dateRange', { start: '', end: filters.dateRange.end })
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            aria-label="クリア"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">いつまで</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={filters.dateRange.end}
                          min={filters.dateRange.start || undefined}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && filters.dateRange.start && value < filters.dateRange.start) {
                              updateFilter('dateRange', { start: '', end: value });
                            } else {
                              updateFilter('dateRange', { start: filters.dateRange.start, end: value });
                            }
                          }}
                          className="w-full px-2 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-600 focus:outline-none appearance-none pr-8"
                        />
                        {filters.dateRange.end && (
                          <button
                            type="button"
                            onClick={() =>
                              updateFilter('dateRange', { start: filters.dateRange.start, end: '' })
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            aria-label="クリア"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* カテゴリセクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <div className="px-2 pt-2 pb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  カテゴリ
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {categories.map((category) => {
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          const newIds = filters.categoryIds.includes(category.id)
                            ? filters.categoryIds.filter((id) => id !== category.id)
                            : [...filters.categoryIds, category.id];
                          updateFilter('categoryIds', newIds);
                        }}
                        className={`relative flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg transition-colors min-h-[60px] ${
                          filters.categoryIds.includes(category.id)
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : ''
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getCategoryIcon(category.icon, 15)}
                        </div>
                        <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                          {category.name}
                        </span>
                        {filters.categoryIds.includes(category.id) && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 口座・支払方法セクション */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <div className="px-2 pt-2 pb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  口座・支払方法
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => {
                        const newIds = filters.accountIds.includes(account.id)
                          ? filters.accountIds.filter((id) => id !== account.id)
                          : [...filters.accountIds, account.id];
                        updateFilter('accountIds', newIds);
                      }}
                      className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                        filters.accountIds.includes(account.id)
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${account.color || '#9ca3af'}20`, color: account.color || '#9ca3af' }}
                      >
                        <Wallet size={16} />
                      </div>
                      <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                        {account.name}
                      </span>
                      {filters.accountIds.includes(account.id) && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => {
                        const newIds = filters.paymentMethodIds.includes(pm.id)
                          ? filters.paymentMethodIds.filter((id) => id !== pm.id)
                          : [...filters.paymentMethodIds, pm.id];
                        updateFilter('paymentMethodIds', newIds);
                      }}
                      className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                        filters.paymentMethodIds.includes(pm.id)
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${pm.color || '#9ca3af'}20`, color: pm.color || '#9ca3af' }}
                      >
                        <CreditCard size={16} />
                      </div>
                      <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                        {pm.name}
                      </span>
                      {filters.paymentMethodIds.includes(pm.id) && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-2 flex flex-row gap-2 -mb-2">
              <button
                onClick={resetFilters}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 active:scale-95 transition-all text-sm font-medium"
              >
                <RotateCcw size={16} />
                リセット
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-white font-medium active:scale-95 transition-all text-sm"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Filter Name Modal */}
      <SaveFilterNameModal
        isOpen={isSaveModalOpen}
        onSave={handleSaveFilter}
        onClose={() => setIsSaveModalOpen(false)}
      />

      {/* Edit Filter Sheet */}
      <EditFilterSheet
        filter={editingFilter}
        isOpen={!!editingFilter}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
        onSave={(filterId, name, filterOptions) => {
          onUpdateSavedFilter(filterId, name, filterOptions);
          setEditingFilter(null);
        }}
        onDelete={onDeleteSavedFilter}
        onClose={() => setEditingFilter(null)}
      />

      {/* Create Filter Sheet */}
      <CreateFilterSheet
        isOpen={isCreatingFilter}
        categories={categories}
        accounts={accounts}
        paymentMethods={paymentMethods}
        onSave={(name, filterOptions) => {
          // Apply filter conditions before saving
          updateFilter('searchQuery', filterOptions.searchQuery);
          updateFilter('dateRange', filterOptions.dateRange);
          updateFilter('categoryIds', filterOptions.categoryIds);
          updateFilter('transactionType', filterOptions.transactionType);
          updateFilter('accountIds', filterOptions.accountIds);
          updateFilter('paymentMethodIds', filterOptions.paymentMethodIds);
          updateFilter('unsettled', filterOptions.unsettled);
          // Save with the current filters (which now includes the new conditions)
          onSaveFilter(name);
          setIsCreatingFilter(false);
        }}
        onClose={() => setIsCreatingFilter(false)}
      />
    </>
  );
};
