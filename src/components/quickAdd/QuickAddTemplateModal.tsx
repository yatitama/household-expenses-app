import { useState } from 'react';
import { X, Wallet, CreditCard, Check } from 'lucide-react';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { QuickAddTemplate, QuickAddTemplateInput, Category, Account, PaymentMethod, Member } from '../../types';

interface QuickAddTemplateModalProps {
  template?: QuickAddTemplate | null;
  categories: Category[];
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  members: Member[];
  isOpen: boolean;
  onSave: (input: QuickAddTemplateInput) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export const QuickAddTemplateModal = ({
  template,
  categories,
  accounts,
  paymentMethods,
  members,
  isOpen,
  onSave,
  onClose,
  onDelete,
}: QuickAddTemplateModalProps) => {
  const [name, setName] = useState(() => template?.name || '');
  const [type, setType] = useState<'expense' | 'income'>(() => template?.type || 'expense');
  const [categoryId, setCategoryId] = useState(() => template?.categoryId || '');
  const [amount, setAmount] = useState(() => template?.amount?.toString() || '');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => template?.accountId || template?.paymentMethodId || '');
  const [date, setDate] = useState(() => template?.date || '');
  const [memo, setMemo] = useState(() => template?.memo || '');

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      return;
    }

    // Determine if selected source is account or payment method
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
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60" onClick={onClose} role="dialog" aria-modal="true" aria-label={template ? 'テンプレートを編集' : 'テンプレートを作成'}>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {template ? 'テンプレートを編集' : 'テンプレートを作成'}
            </h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg" aria-label="閉じる">
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">テンプレート名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: コンビニ"
                className="w-full dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

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
                  className="w-full text-lg sm:text-xl font-bold pl-8 pr-3 py-2 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">カテゴリ</label>
              <div className="grid grid-cols-4 gap-2">
                {filteredCategories.map((category) => {
                  const member = getMember(category.memberId);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(categoryId === category.id ? '' : category.id)}
                      className={`relative flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                        categoryId === category.id
                          ? 'bg-primary-50 dark:bg-primary-900/30'
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
                      {member && member.id !== 'common' && (
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-none">{member.name}</span>
                      )}
                      {categoryId === category.id && (
                        <div className="absolute -top-1 -right-1">
                          <Check size={16} className="text-primary-500" strokeWidth={2} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account and Payment Methods */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
                {type === 'expense' ? '支払い元' : '入金先'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {accounts.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setSelectedSourceId(selectedSourceId === acct.id ? '' : acct.id)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedSourceId === acct.id
                        ? 'bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        <Check size={16} className="text-primary-500" strokeWidth={2} />
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
                        ? 'bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
                        <Check size={16} className="text-primary-500" strokeWidth={2} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="overflow-x-hidden">
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">日付</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg px-2 py-2 text-xs border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 appearance-none"
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

            {/* Memo */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">メモ</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="任意"
                className="w-full dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t dark:border-gray-700 p-3 sm:p-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg dark:border-gray-600 bg-gray-100 text-gray-900 dark:text-gray-100 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600">
            キャンセル
          </button>
          {template && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
            >
              削除
            </button>
          )}
          <button
            type="submit"
            disabled={!name}
            className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg btn-primary hover:bg-slate-800 text-white font-medium text-sm disabled:opacity-50 transition-colors"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
};
