import { useState } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { X, Trash2, Wallet, CreditCard, Check } from 'lucide-react';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { QuickAddTemplate, QuickAddTemplateInput, Category, Account, PaymentMethod } from '../../types';

interface QuickAddTemplateModalProps {
  template?: QuickAddTemplate | null;
  defaultType?: 'expense' | 'income' | 'transfer';
  categories: Category[];
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  onSave: (input: QuickAddTemplateInput) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export const QuickAddTemplateModal = ({
  template,
  defaultType = 'expense',
  categories,
  accounts,
  paymentMethods,
  isOpen,
  onSave,
  onClose,
  onDelete,
}: QuickAddTemplateModalProps) => {
  const [name, setName] = useState(() => template?.name || '');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(() => template?.type || defaultType);
  const [categoryId, setCategoryId] = useState(() => template?.categoryId || '');
  const [amount, setAmount] = useState(() => template?.amount?.toString() || '');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => template?.accountId || template?.paymentMethodId || '');
  const [fromAccountId, setFromAccountId] = useState(() => template?.fromAccountId || '');
  const [fee, setFee] = useState(() => template?.fee?.toString() || '');
  const [date, setDate] = useState(() => template?.date || '');
  const [memo, setMemo] = useState(() => template?.memo || '');
  useBodyScrollLock(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (type === 'transfer') {
      onSave({
        name,
        type,
        fromAccountId: fromAccountId || undefined,
        accountId: selectedSourceId || undefined,
        fee: fee ? parseInt(fee, 10) : undefined,
        amount: amount ? parseInt(amount, 10) : undefined,
        memo: memo || undefined,
      });
    } else {
      const account = accounts.find((a) => a.id === selectedSourceId);
      const paymentMethod = paymentMethods.find((p) => p.id === selectedSourceId);
      onSave({
        name,
        type,
        categoryId: categoryId || undefined,
        amount: amount ? parseInt(amount, 10) : undefined,
        accountId: account?.id,
        paymentMethodId: paymentMethod?.id,
        date: date || undefined,
        memo: memo || undefined,
      });
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === (type === 'transfer' ? 'expense' : type));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose} role="dialog" aria-modal="true" aria-label={template ? 'クイック入力を編集' : 'クイック入力を作成'}>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {template ? 'クイック入力を編集' : 'クイック入力を作成'}
            </h3>
            {template && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="space-y-4 sm:space-y-5">
            {/* Type */}
            <div className="flex rounded-lg overflow-hidden dark:border-gray-600">
              <button
                type="button"
                onClick={() => { setType('expense'); setCategoryId(''); }}
                className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                  type === 'expense' ? 'btn-primary text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => { setType('income'); setCategoryId(''); }}
                className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                  type === 'income' ? 'btn-primary text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                }`}
              >
                収入
              </button>
              <button
                type="button"
                onClick={() => { setType('transfer'); setCategoryId(''); }}
                className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                  type === 'transfer' ? 'btn-primary text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200'
                }`}
              >
                振替
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">クイック入力名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: コンビニ"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">金額</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full text-lg sm:text-xl font-bold pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            {/* Category (expense/income only) */}
            {type !== 'transfer' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">カテゴリ</label>
                <div className="grid grid-cols-4 gap-2">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(categoryId === category.id ? '' : category.id)}
                      className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                        categoryId === category.id
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <div
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {getCategoryIcon(category.icon, 14)}
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                        {category.name}
                      </span>
                      {categoryId === category.id && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Transfer: 入金元 */}
            {type === 'transfer' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">入金元</label>
                <div className="grid grid-cols-4 gap-2">
                  {accounts.map((acct) => (
                    <button
                      key={acct.id}
                      type="button"
                      onClick={() => setFromAccountId(fromAccountId === acct.id ? '' : acct.id)}
                      className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        fromAccountId === acct.id
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${acct.color || '#9ca3af'}20`, color: acct.color || '#9ca3af' }}
                      >
                        <Wallet size={16} />
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                        {acct.name}
                      </span>
                      {fromAccountId === acct.id && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account / Payment Methods (expense/income) or 入金先 (transfer) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                {type === 'expense' ? '支払い元' : type === 'transfer' ? '入金先' : '入金先'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {accounts.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setSelectedSourceId(selectedSourceId === acct.id ? '' : acct.id)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedSourceId === acct.id
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : ''
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${acct.color || '#9ca3af'}20`, color: acct.color || '#9ca3af' }}
                    >
                      <Wallet size={16} />
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                      {acct.name}
                    </span>
                    {selectedSourceId === acct.id && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}

                {type === 'expense' && paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedSourceId(selectedSourceId === pm.id ? '' : pm.id)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedSourceId === pm.id
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : ''
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${pm.color || '#9ca3af'}20`, color: pm.color || '#9ca3af' }}
                    >
                      <CreditCard size={16} />
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                      {pm.name}
                    </span>
                    {selectedSourceId === pm.id && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={14} className="text-gray-600 dark:text-gray-300" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Transfer: 振替手数料 */}
            {type === 'transfer' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">振替手数料</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="0（任意）"
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
              </div>
            )}

            {/* Date (expense/income only) */}
            {type !== 'transfer' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">日付</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 rounded-lg px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-600 appearance-none"
                    aria-label="日付"
                  />
                  {date && (
                    <button
                      type="button"
                      onClick={() => setDate('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-500 dark:text-gray-400"
                      aria-label="日付をクリア"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Memo */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">メモ</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="任意"
                className="w-full bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 p-3 sm:p-4">
          <button
            type="submit"
            disabled={!name}
            className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg btn-primary hover:bg-slate-800 text-white font-medium text-sm disabled:opacity-50 transition-colors"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
};
