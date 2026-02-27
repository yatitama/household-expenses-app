import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import type { SavedFilter } from '../../types';
import type { FilterOptions } from '../../hooks/useTransactionFilter';

interface EditFilterSheetProps {
  filter?: SavedFilter | null;
  isOpen: boolean;
  categories: { id: string; name: string; color: string; icon: string }[];
  accounts: { id: string; name: string; color?: string }[];
  paymentMethods: { id: string; name: string; color?: string }[];
  onSave: (filterId: string, name: string, filterOptions: Omit<FilterOptions, 'sortBy' | 'sortOrder'>) => void;
  onDelete: (filterId: string) => void;
  onClose: () => void;
}

export const EditFilterSheet = ({
  filter,
  isOpen,
  categories,
  accounts,
  paymentMethods,
  onSave,
  onDelete,
  onClose,
}: EditFilterSheetProps) => {
  useBodyScrollLock(isOpen);

  const [name, setName] = useState('');
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
    if (isOpen && filter) {
      setName(filter.name);
      setFilterConditions({
        searchQuery: filter.searchQuery,
        dateRange: filter.dateRange,
        categoryIds: filter.categoryIds,
        transactionType: filter.transactionType,
        accountIds: filter.accountIds,
        paymentMethodIds: filter.paymentMethodIds,
        unsettled: filter.unsettled,
      });
    }
  }, [isOpen, filter]);

  if (!isOpen || !filter) return null;

  const handleSave = () => {
    if (name.trim() && filter) {
      onSave(filter.id, name.trim(), filterConditions);
      setName('');
    }
  };

  const handleDelete = () => {
    if (confirm('このフィルターを削除してもよろしいですか？')) {
      onDelete(filter.id);
      onClose();
    }
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
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              フィルター名
            </h3>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
              aria-label="削除"
            >
              <Trash2 size={18} />
            </button>
          </div>
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
            {/* Filter Name Input */}
            <div className="space-y-0 bg-white dark:bg-slate-800 rounded-lg overflow-hidden mb-1">
              <div className="px-2 pt-2 pb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  フィルター名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSave();
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  autoFocus
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
                          <div className="w-4 h-4 bg-primary-600 rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
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
                        {/* Icon would go here if needed */}
                      </div>
                      <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                        {category.name}
                      </span>
                      {filterConditions.categoryIds.includes(category.id) && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-4 h-4 bg-primary-600 rounded-full" />
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
                        {/* Wallet Icon would go here if needed */}
                      </div>
                      <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                        {account.name}
                      </span>
                      {filterConditions.accountIds.includes(account.id) && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-4 h-4 bg-primary-600 rounded-full" />
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
                        {/* CreditCard Icon would go here if needed */}
                      </div>
                      <span className="text-xs text-gray-900 dark:text-gray-200 w-full text-center truncate">
                        {pm.name}
                      </span>
                      {filterConditions.paymentMethodIds.includes(pm.id) && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-4 h-4 bg-primary-600 rounded-full" />
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
        <div className="sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t dark:border-gray-700 p-2 -mb-2">
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
    </>
  );
};
