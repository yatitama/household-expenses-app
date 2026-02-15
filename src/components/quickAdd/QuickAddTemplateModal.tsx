import { useState } from 'react';
import { X, Wallet, CreditCard } from 'lucide-react';
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
  const [categoryId, setCategoryId] = useState(() =>
    template?.categoryId || categories.find((c) => c.type === 'expense')?.id || ''
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => template?.accountId || template?.paymentMethodId || '');
  const [memo, setMemo] = useState(() => template?.memo || '');

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      return;
    }

    // Determine if selected source is account or payment method
    const account = accounts.find((a) => a.id === selectedSourceId);
    const paymentMethod = paymentMethods.find((p) => p.id === selectedSourceId);

    onSave({
      name,
      type,
      categoryId,
      accountId: account?.id,
      paymentMethodId: paymentMethod?.id,
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
                className="w-full dark:border-gray-600 dark:text-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            {/* Type */}
            <div className="flex rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => { setType('expense'); setCategoryId(''); }}
                className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                  type === 'expense' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200 dark:bg-gray-700'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => { setType('income'); setCategoryId(''); }}
                className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                  type === 'income' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900 dark:text-gray-200 dark:bg-gray-700'
                }`}
              >
                収入
              </button>
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
                      onClick={() => setCategoryId(category.id)}
                      className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-colors ${
                        categoryId === category.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {getCategoryIcon(category.icon, 14)}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-200 truncate w-full text-center leading-tight">
                        {category.name}
                      </span>
                      {member && member.id !== 'common' && (
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-none">{member.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account and Payment Methods */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">支払い元 (オプション)</label>
              <div className="grid grid-cols-2 gap-2">
                {accounts.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setSelectedSourceId(acct.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedSourceId === acct.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${acct.color || '#9ca3af'}20`, color: acct.color || '#9ca3af' }}
                    >
                      <Wallet size={16} />
                    </div>
                    <span className="text-xs text-gray-900 dark:text-gray-200 truncate w-full text-center leading-tight">
                      {acct.name}
                    </span>
                  </button>
                ))}

                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedSourceId(pm.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedSourceId === pm.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${pm.color || '#9ca3af'}20`, color: pm.color || '#9ca3af' }}
                    >
                      <CreditCard size={16} />
                    </div>
                    <span className="text-xs text-gray-900 dark:text-gray-200 truncate w-full text-center leading-tight">
                      {pm.name}
                    </span>
                  </button>
                ))}
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
                className="w-full dark:border-gray-600 dark:text-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
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
            disabled={!name || !categoryId}
            className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm disabled:opacity-50 transition-colors"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
};
