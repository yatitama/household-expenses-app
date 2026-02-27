import { useState, useEffect } from 'react';
import { X, Check, Wallet, CreditCard } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { FilterOptions } from '../../hooks/useTransactionFilter';

interface CreateFilterSheetProps {
  isOpen: boolean;
  categories: { id: string; name: string; color: string; icon: string }[];
  accounts: { id: string; name: string; color?: string }[];
  paymentMethods: { id: string; name: string; color?: string }[];
  onSave: (name: string, filterOptions: Omit<FilterOptions, 'sortBy' | 'sortOrder'>) => void;
  onClose: () => void;
}

export const CreateFilterSheet = ({
  isOpen,
  categories,
  accounts,
  paymentMethods,
  onSave,
  onClose,
}: CreateFilterSheetProps) => {
  useBodyScrollLock(isOpen);

  const [name, setName] = useState('');
  const [showDateCustom, setShowDateCustom] = useState(false);
  const [filterConditions, setFilterConditions] = useState<Omit<FilterOptions, 'sortBy' | 'sortOrder'>>({
    searchQuery: '',
    dateRange: { start: '', end: '' },
    categoryIds: [],
    transactionType: 'all',
    accountIds: [],
    paymentMethodIds: [],
    unsettled: false,
  });

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setFilterConditions({
        searchQuery: '',
        dateRange: { start: '', end: '' },
        categoryIds: [],
        transactionType: 'all',
        accountIds: [],
        paymentMethodIds: [],
        unsettled: false,
      });
      setShowDateCustom(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), filterConditions);
      setName('');
      setFilterConditions({
        searchQuery: '',
        dateRange: { start: '', end: '' },
        categoryIds: [],
        transactionType: 'all',
        accountIds: [],
        paymentMethodIds: [],
        unsettled: false,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1001]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 w-full sm:rounded-xl rounded-t-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            フィルターを作成
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-0 py-2">
            {/* Filter Name Input */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <div className="px-2 pt-2 pb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  フィルター名
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      handleSave();
                    }
                  }}
                  placeholder="フィルター名を入力"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            {/* Transaction Type Filter */}
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
                      onClick={() => setFilterConditions((prev) => ({ ...prev, transactionType: type.value }))}
                      className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                        filterConditions.transactionType === type.value
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {type.label}
                      </span>
                      {filterConditions.transactionType === type.value && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Range Filter */}
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
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: '', end: '' } }));
                              setShowDateCustom(false);
                            } else {
                              // カスタム選択を開く
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: '', end: '' } }));
                              setShowDateCustom(true);
                            }
                          } else {
                            const { start, end } = preset.getValue();
                            // 既に選択されているなら外す、そうでなければ選択
                            if (filterConditions.dateRange.start === start && filterConditions.dateRange.end === end) {
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: '', end: '' } }));
                              setShowDateCustom(false);
                            } else {
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start, end } }));
                              setShowDateCustom(false);
                            }
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] text-sm font-medium ${
                          preset.isCustom
                            ? showDateCustom
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : ''
                            : filterConditions.dateRange.start === preset.getValue().start &&
                              filterConditions.dateRange.end === preset.getValue().end
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : ''
                        }`}
                      >
                        {preset.label}
                        {!preset.isCustom &&
                          filterConditions.dateRange.start === preset.getValue().start &&
                          filterConditions.dateRange.end === preset.getValue().end && (
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

                {/* Custom Date Picker */}
                {showDateCustom && (
                  <div className="space-y-2 pt-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">いつから</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={filterConditions.dateRange.start}
                          max={filterConditions.dateRange.end || undefined}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && filterConditions.dateRange.end && value > filterConditions.dateRange.end) {
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: value, end: '' } }));
                            } else {
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: value, end: prev.dateRange.end } }));
                            }
                          }}
                          className="w-full px-2 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-600 focus:outline-none appearance-none pr-8"
                        />
                        {filterConditions.dateRange.start && (
                          <button
                            type="button"
                            onClick={() =>
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: '', end: prev.dateRange.end } }))
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
                          value={filterConditions.dateRange.end}
                          min={filterConditions.dateRange.start || undefined}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && filterConditions.dateRange.start && value < filterConditions.dateRange.start) {
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: '', end: value } }));
                            } else {
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: prev.dateRange.start, end: value } }));
                            }
                          }}
                          className="w-full px-2 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-600 focus:outline-none appearance-none pr-8"
                        />
                        {filterConditions.dateRange.end && (
                          <button
                            type="button"
                            onClick={() =>
                              setFilterConditions((prev) => ({ ...prev, dateRange: { start: prev.dateRange.start, end: '' } }))
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

            {/* Category Filter */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <div className="px-2 pt-2 pb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                  カテゴリ
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        const newIds = filterConditions.categoryIds.includes(category.id)
                          ? filterConditions.categoryIds.filter((id) => id !== category.id)
                          : [...filterConditions.categoryIds, category.id];
                        setFilterConditions((prev) => ({ ...prev, categoryIds: newIds }));
                      }}
                      className={`relative flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg transition-colors min-h-[60px] ${
                        filterConditions.categoryIds.includes(category.id)
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
                      {filterConditions.categoryIds.includes(category.id) && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Filter */}
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
                        const newIds = filterConditions.accountIds.includes(account.id)
                          ? filterConditions.accountIds.filter((id) => id !== account.id)
                          : [...filterConditions.accountIds, account.id];
                        setFilterConditions((prev) => ({ ...prev, accountIds: newIds }));
                      }}
                      className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                        filterConditions.accountIds.includes(account.id)
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
                      {filterConditions.accountIds.includes(account.id) && (
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
                        const newIds = filterConditions.paymentMethodIds.includes(pm.id)
                          ? filterConditions.paymentMethodIds.filter((id) => id !== pm.id)
                          : [...filterConditions.paymentMethodIds, pm.id];
                        setFilterConditions((prev) => ({ ...prev, paymentMethodIds: newIds }));
                      }}
                      className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-h-[60px] ${
                        filterConditions.paymentMethodIds.includes(pm.id)
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
                      {filterConditions.paymentMethodIds.includes(pm.id) && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t dark:border-gray-700 p-3 sm:p-4">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-2 rounded-lg text-white font-medium transition-all text-sm disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
