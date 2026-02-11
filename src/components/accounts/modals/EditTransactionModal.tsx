import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import type { Account, PaymentMethod, Member, Transaction, TransactionType, TransactionInput } from '../../../types';

interface EditTransactionModalProps {
  transaction: Transaction;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  categories: { id: string; name: string; type: TransactionType; color: string; icon: string; memberId: string }[];
  members: Member[];
  onSave: (input: TransactionInput) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const EditTransactionModal = ({
  transaction, accounts, paymentMethods, categories, members, onSave, onClose, onDelete,
}: EditTransactionModalProps) => {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [pmId, setPmId] = useState<string | undefined>(transaction.paymentMethodId);
  const [date, setDate] = useState(transaction.date);
  const [memo, setMemo] = useState(transaction.memo || '');

  const filteredCategories = categories.filter((c) => c.type === type);
  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSelectAccount = (id: string) => {
    setAccountId(id);
    setPmId(undefined);
  };

  const handleSelectPM = (id: string) => {
    const pm = paymentMethods.find((p) => p.id === id);
    if (pm) {
      setPmId(id);
      setAccountId(pm.linkedAccountId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || (!accountId && !pmId)) {
      toast.error('金額、カテゴリ、支払い元を入力してください');
      return;
    }
    onSave({
      type,
      amount: parseInt(amount, 10),
      categoryId,
      accountId,
      paymentMethodId: pmId,
      date,
      memo: memo || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60]" onClick={onClose} role="dialog" aria-modal="true" aria-label="取引を編集">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">取引を編集</h3>
          <div className="space-y-4 sm:space-y-5">
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                type === 'expense' ? 'btn-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-200'
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); setPmId(undefined); }}
              className={`flex-1 py-2 sm:py-2.5 font-medium text-sm transition-colors ${
                type === 'income' ? 'btn-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-200'
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
                className="w-full text-lg sm:text-xl font-bold pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">カテゴリ</label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {filteredCategories.map((category) => {
                const member = getMember(category.memberId);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg border transition-colors ${
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

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">
              {type === 'expense' ? '支払い元' : '入金先'}
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accounts.length > 0 && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">口座</p>
                  <div className="space-y-1">
                    {accounts.map((acct) => (
                      <button
                        key={acct.id}
                        type="button"
                        onClick={() => handleSelectAccount(acct.id)}
                        className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg border transition-colors ${
                          accountId === acct.id && !pmId
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: acct.color }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{acct.name}</span>
                        </div>
                        {accountId === acct.id && !pmId && <Check size={14} className="sm:w-4 sm:h-4 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {type === 'expense' && paymentMethods.length > 0 && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">支払い手段</p>
                  <div className="space-y-1">
                    {paymentMethods.map((pm) => {
                      const linked = accounts.find((a) => a.id === pm.linkedAccountId);
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => handleSelectPM(pm.id)}
                          className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg border transition-colors ${
                            pmId === pm.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full" style={{ backgroundColor: pm.color }} />
                            <div className="text-left">
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{pm.name}</span>
                              {linked && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">→ {linked.name}</p>}
                            </div>
                          </div>
                          {pmId === pm.id && <Check size={14} className="sm:w-4 sm:h-4 text-primary-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-hidden">
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
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
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => { onDelete(transaction.id); onClose(); }}
              className="w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors"
            >
              削除
            </button>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600">
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!amount || !categoryId || (!accountId && !pmId)}
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
