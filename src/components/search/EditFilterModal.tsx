import { useState, useEffect } from 'react';
import { X, Trash2, ChevronDown } from 'lucide-react';
import type { SavedFilter } from '../../types';
import type { FilterOptions } from '../../hooks/useTransactionFilter';

interface EditFilterModalProps {
  filter?: SavedFilter | null;
  isOpen: boolean;
  categories: { id: string; name: string; color: string; icon: string }[];
  accounts: { id: string; name: string; color?: string }[];
  paymentMethods: { id: string; name: string; color?: string }[];
  onSave: (filterId: string, name: string, filterOptions: Omit<FilterOptions, 'sortBy' | 'sortOrder'>) => void;
  onDelete: (filterId: string) => void;
  onClose: () => void;
}

export const EditFilterModal = ({
  filter,
  isOpen,
  categories,
  accounts,
  paymentMethods,
  onSave,
  onDelete,
  onClose,
}: EditFilterModalProps) => {
  const [name, setName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
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
      setExpandedSections(new Set());
    }
  }, [isOpen, filter]);

  if (!isOpen || !filter) return null;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (section: string) => expandedSections.has(section);

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
        className="fixed inset-0 bg-black/50 z-[1001]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                フィルターを編集
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
          <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
            {/* Filter Name */}
            <div>
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

            {/* Transaction Type Filter */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <button
                onClick={() => toggleSection('type')}
                className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  取引種別
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-600 dark:text-gray-400 transition-transform ${
                    isExpanded('type') ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>
              {isExpanded('type') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { value: 'all' as const, label: 'すべて' },
                    { value: 'expense' as const, label: '支出' },
                    { value: 'income' as const, label: '収入' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFilterConditions((prev) => ({ ...prev, transactionType: type.value }))}
                      className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                        filterConditions.transactionType === type.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <button
                onClick={() => toggleSection('category')}
                className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  カテゴリ {filterConditions.categoryIds.length > 0 && `(${filterConditions.categoryIds.length})`}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-600 dark:text-gray-400 transition-transform ${
                    isExpanded('category') ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>
              {isExpanded('category') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
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
                      className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                        filterConditions.categoryIds.includes(category.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account Filter */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <button
                onClick={() => toggleSection('account')}
                className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  口座・支払方法 {filterConditions.accountIds.length + filterConditions.paymentMethodIds.length > 0 && `(${filterConditions.accountIds.length + filterConditions.paymentMethodIds.length})`}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-600 dark:text-gray-400 transition-transform ${
                    isExpanded('account') ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>
              {isExpanded('account') && (
                <div className="grid grid-cols-3 gap-2 mt-2">
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
                      className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                        filterConditions.accountIds.includes(account.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {account.name}
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
                      className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                        filterConditions.paymentMethodIds.includes(pm.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pm.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
    </>
  );
};
