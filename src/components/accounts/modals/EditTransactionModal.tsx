import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Wallet, CreditCard } from 'lucide-react';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import type { Account, PaymentMethod, Transaction, TransactionType, TransactionInput } from '../../../types';

interface EditTransactionModalProps {
  transaction: Transaction;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  categories: { id: string; name: string; type: TransactionType; color: string; icon: string }[];
  onSave: (input: TransactionInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const EditTransactionModal = ({
  transaction, accounts, paymentMethods, categories, onSave, onClose, onDelete,
}: EditTransactionModalProps) => {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [selectedSourceId, setSelectedSourceId] = useState(transaction.paymentMethodId || transaction.accountId);
  const [date, setDate] = useState(transaction.date);
  const [memo, setMemo] = useState(transaction.memo || '');

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !selectedSourceId) {
      toast.error('金額、カテゴリ、支払い元を入力してください');
      return;
    }
    const account = accounts.find((a) => a.id === selectedSourceId);
    const paymentMethod = paymentMethods.find((p) => p.id === selectedSourceId);
    onSave({
      type,
      amount: parseInt(amount, 10),
      categoryId,
      accountId: account?.id || paymentMethod?.linkedAccountId || '',
      paymentMethodId: paymentMethod?.id,
      date,
      memo: memo || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60]" onClick={onClose} role="dialog" aria-modal="true" aria-label="取引を編集">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">取引を編集</h3>
          <div className="space-y-4 sm:space-y-5">
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

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-lg sm:text-xl font-bold pl-8 pr-3 py-2 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">カテゴリ</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((category) => {
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
                    <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              {type === 'expense' ? '支払い元' : '入金先'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {accounts.map((acct) => (
                <button
                  key={acct.id}
                  type="button"
                  onClick={() => setSelectedSourceId(acct.id)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    selectedSourceId === acct.id
                      ? 'bg-primary-50 dark:bg-primary-900/30'
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
                      <Check size={16} className="text-primary-500" strokeWidth={2} />
                    </div>
                  )}
                </button>
              ))}

              {type === 'expense' && paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedSourceId(pm.id)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    selectedSourceId === pm.id
                      ? 'bg-primary-50 dark:bg-primary-900/30'
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
                      <Check size={16} className="text-primary-500" strokeWidth={2} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-hidden">
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full dark:border-gray-600 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
              style={{ minWidth: 0, maxWidth: '100%' }}
            />
          </div>

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
        <div className="border-t dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => { onDelete(transaction.id); onClose(); }}
              className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors"
            >
              削除
            </button>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg dark:border-gray-600 bg-gray-100 text-gray-900 dark:text-gray-100 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600">
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!amount || !categoryId || !selectedSourceId}
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg btn-primary text-white font-medium text-sm disabled:opacity-50 hover:bg-primary-dark transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
