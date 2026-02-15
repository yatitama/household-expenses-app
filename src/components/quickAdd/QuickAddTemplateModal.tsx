import { useState } from 'react';
import { X } from 'lucide-react';
import type { QuickAddTemplate, QuickAddTemplateInput, Category, Account, PaymentMethod } from '../../types';

interface QuickAddTemplateModalProps {
  template?: QuickAddTemplate | null;
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
  categories,
  accounts,
  paymentMethods,
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
  const [accountId, setAccountId] = useState<string | undefined>(() => template?.accountId);
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>(() => template?.paymentMethodId);
  const [memo, setMemo] = useState<string | undefined>(() => template?.memo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      return;
    }
    onSave({
      name,
      type,
      categoryId,
      accountId,
      paymentMethodId,
      memo,
    });
  };

  if (!isOpen) return null;

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const filteredCategories = type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white dark:bg-slate-800 w-full rounded-t-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {template ? 'テンプレートを編集' : 'テンプレートを作成'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              テンプレート名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: コンビニ"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              種類 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  type === 'expense'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  type === 'income'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                収入
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">カテゴリを選択</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              支払元口座 (オプション)
            </label>
            <select
              value={accountId || ''}
              onChange={(e) => setAccountId(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">未設定</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              支払い手段 (オプション)
            </label>
            <select
              value={paymentMethodId || ''}
              onChange={(e) => setPaymentMethodId(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">未設定</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              メモ (オプション)
            </label>
            <textarea
              value={memo || ''}
              onChange={(e) => setMemo(e.target.value || undefined)}
              placeholder="テンプレート用のメモ"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              キャンセル
            </button>
            {template && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                削除
              </button>
            )}
            <button
              type="submit"
              disabled={!name || !categoryId}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
