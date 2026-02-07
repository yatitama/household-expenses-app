import { useState } from 'react';
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
}

export const EditTransactionModal = ({
  transaction, accounts, paymentMethods, categories, members, onSave, onClose,
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
      alert('金額、カテゴリ、支払い元を入力してください');
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60]" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 w-full max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">取引を編集</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={`flex-1 py-2.5 font-medium transition-colors ${
                type === 'expense' ? 'bg-red-500 text-white' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); setPmId(undefined); }}
              className={`flex-1 py-2.5 font-medium transition-colors ${
                type === 'income' ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              収入
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xl font-bold pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">カテゴリ</label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {filteredCategories.map((category) => {
                const member = getMember(category.memberId);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                      categoryId === category.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getCategoryIcon(category.icon, 16)}
                    </div>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300 truncate w-full text-center leading-tight">
                      {category.name}
                    </span>
                    {member && member.id !== 'common' && (
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">{member.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {type === 'expense' ? '支払い元' : '入金先'}
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accounts.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-1">口座</p>
                  <div className="space-y-1">
                    {accounts.map((acct) => (
                      <button
                        key={acct.id}
                        type="button"
                        onClick={() => handleSelectAccount(acct.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                          accountId === acct.id && !pmId
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acct.color }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{acct.name}</span>
                        </div>
                        {accountId === acct.id && !pmId && <Check size={16} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {type === 'expense' && paymentMethods.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-1">支払い手段</p>
                  <div className="space-y-1">
                    {paymentMethods.map((pm) => {
                      const linked = accounts.find((a) => a.id === pm.linkedAccountId);
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => handleSelectPM(pm.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                            pmId === pm.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: pm.color }} />
                            <div className="text-left">
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{pm.name}</span>
                              {linked && <p className="text-[9px] text-gray-400 dark:text-gray-500">→ {linked.name}</p>}
                            </div>
                          </div>
                          {pmId === pm.id && <Check size={16} className="text-purple-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-hidden">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minWidth: 0, maxWidth: '100%' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">メモ</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="任意"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!amount || !categoryId || (!accountId && !pmId)}
              className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
