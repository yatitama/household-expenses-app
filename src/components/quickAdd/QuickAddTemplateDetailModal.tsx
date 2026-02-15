import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { QuickAddTemplate, Category, Account, PaymentMethod, TransactionInput } from '../../types';

interface QuickAddTemplateDetailModalProps {
  template?: QuickAddTemplate | null;
  categories: Category[];
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  onSave: (input: TransactionInput) => void;
  onClose: () => void;
  onEdit: () => void;
}

export const QuickAddTemplateDetailModal = ({
  template,
  categories,
  accounts,
  paymentMethods,
  isOpen,
  onSave,
  onClose,
  onEdit,
}: QuickAddTemplateDetailModalProps) => {
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !template?.categoryId || !template?.accountId) {
      return;
    }
    onSave({
      date,
      type: template.type,
      amount,
      categoryId: template.categoryId,
      accountId: template.accountId,
      paymentMethodId: template.paymentMethodId,
      memo: memo || undefined,
    });
  };

  if (!isOpen || !template) return null;

  const category = categories.find((c) => c.id === template.categoryId);
  const account = accounts.find((a) => a.id === template.accountId);
  const paymentMethod = paymentMethods.find((pm) => pm.id === template.paymentMethodId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white dark:bg-slate-800 w-full rounded-t-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {template.name}
            </h2>
            {template.memo && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.memo}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1">
              <Calendar size={16} />
              日付
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              金額 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Info */}
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">カテゴリ</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{category?.name}</p>
          </div>

          {/* Account Info */}
          {account && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">支払元口座</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{account.name}</p>
            </div>
          )}

          {/* Payment Method Info */}
          {paymentMethod && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">支払い手段</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{paymentMethod.name}</p>
            </div>
          )}

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              メモ (オプション)
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力"
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
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              編集
            </button>
            <button
              type="submit"
              disabled={!amount}
              className="flex-1 px-4 py-2 btn-primary hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              登録
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
