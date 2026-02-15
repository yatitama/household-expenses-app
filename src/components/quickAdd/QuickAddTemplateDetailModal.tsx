import { useState } from 'react';
import { X, Wallet, CreditCard, Check } from 'lucide-react';
import { format } from 'date-fns';
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { QuickAddTemplate, Category, Account, PaymentMethod, TransactionInput, Member } from '../../types';

interface QuickAddTemplateDetailModalProps {
  template?: QuickAddTemplate | null;
  categories: Category[];
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  members: Member[];
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
  members,
  isOpen,
  onSave,
  onClose,
  onEdit,
}: QuickAddTemplateDetailModalProps) => {
  const [amount, setAmount] = useState(() => template?.amount || 0);
  const [date, setDate] = useState(() => template?.date || format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState(() => template?.memo || '');
  const [categoryId, setCategoryId] = useState(() => template?.categoryId || '');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => template?.accountId || template?.paymentMethodId || '');

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !selectedSourceId) {
      return;
    }

    // Determine if selected source is account or payment method
    const account = accounts.find((a) => a.id === selectedSourceId);
    const paymentMethod = paymentMethods.find((p) => p.id === selectedSourceId);

    onSave({
      date,
      type: template!.type,
      amount,
      categoryId,
      accountId: account?.id || paymentMethod?.linkedAccountId || '',
      paymentMethodId: paymentMethod?.id,
      memo: memo || undefined,
    });
  };

  if (!isOpen || !template) return null;

  const category = categories.find((c) => c.id === template.categoryId);
  const account = accounts.find((a) => a.id === template.accountId);
  const paymentMethod = paymentMethods.find((pm) => pm.id === template.paymentMethodId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full rounded-t-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b dark:border-gray-700">
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
          <div className="overflow-x-hidden">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              日付
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minWidth: 0, maxWidth: '100%' }}
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              カテゴリ {!template?.categoryId && <span className="text-red-500">*</span>}
            </label>
            {template?.categoryId && !categoryId ? (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">カテゴリ</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{category?.name}</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {categories
                  .filter((c) => c.type === template!.type)
                  .map((cat) => {
                    const member = getMember(cat.memberId);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
                        className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors ${
                          categoryId === cat.id
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {getCategoryIcon(cat.icon, 14)}
                        </div>
                        <span className="text-[10px] text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                          {cat.name}
                        </span>
                        {member && member.id !== 'common' && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">{member.name}</span>
                        )}
                        {categoryId === cat.id && (
                          <div className="absolute -top-1 -right-1">
                            <Check size={16} className="text-blue-500" strokeWidth={2} />
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Account and Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              {template!.type === 'expense' ? '支払い元' : '入金先'} {!template?.accountId && !template?.paymentMethodId && <span className="text-red-500">*</span>}
            </label>
            {template?.accountId || template?.paymentMethodId ? (
              <div className="space-y-2">
                {account && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">支払元口座</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{account.name}</p>
                  </div>
                )}
                {paymentMethod && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">支払い手段</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{paymentMethod.name}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {accounts.map((acct) => (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setSelectedSourceId(selectedSourceId === acct.id ? '' : acct.id)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedSourceId === acct.id
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${acct.color || '#9ca3af'}20`, color: acct.color || '#9ca3af' }}
                    >
                      <Wallet size={16} />
                    </div>
                    <span className="text-[10px] text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                      {acct.name}
                    </span>
                    {selectedSourceId === acct.id && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={16} className="text-blue-500" strokeWidth={2} />
                      </div>
                    )}
                  </button>
                ))}

                {template!.type === 'expense' && paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedSourceId(selectedSourceId === pm.id ? '' : pm.id)}
                    className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedSourceId === pm.id
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${pm.color || '#9ca3af'}20`, color: pm.color || '#9ca3af' }}
                    >
                      <CreditCard size={16} />
                    </div>
                    <span className="text-[10px] text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                      {pm.name}
                    </span>
                    {selectedSourceId === pm.id && (
                      <div className="absolute -top-1 -right-1">
                        <Check size={16} className="text-blue-500" strokeWidth={2} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
              className="px-4 py-2 bg-gray-100 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              編集
            </button>
            <button
              type="submit"
              disabled={!amount || !categoryId}
              className="flex-1 px-4 py-2 btn-primary hover:disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              登録
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
