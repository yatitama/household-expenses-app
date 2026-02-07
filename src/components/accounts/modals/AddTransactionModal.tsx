import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { X, Check, CheckCircle } from 'lucide-react';
import {
  accountService, transactionService, categoryService,
  memberService, paymentMethodService,
} from '../../../services/storage';
import { getCategoryIcon } from '../../../utils/categoryIcons';
import type { TransactionType, TransactionInput } from '../../../types';

interface AddTransactionModalProps {
  defaultAccountId?: string;
  defaultPaymentMethodId?: string;
  onSaved: () => void;
  onClose: () => void;
}

export const AddTransactionModal = ({ defaultAccountId, defaultPaymentMethodId, onSaved, onClose }: AddTransactionModalProps) => {
  const allAccounts = accountService.getAll();
  const allPaymentMethods = paymentMethodService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();

  const isFromPM = !!defaultPaymentMethodId;
  const isFromAccount = !!defaultAccountId && !defaultPaymentMethodId;

  const accounts = isFromAccount
    ? allAccounts.filter((a) => a.id === defaultAccountId)
    : isFromPM
      ? []
      : allAccounts;
  const paymentMethods = isFromPM
    ? allPaymentMethods.filter((pm) => pm.id === defaultPaymentMethodId)
    : isFromAccount
      ? []
      : allPaymentMethods;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(defaultAccountId || '');
  const [pmId, setPmId] = useState<string | undefined>(defaultPaymentMethodId);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);
  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSelectAccount = (id: string) => {
    setAccountId(id);
    setPmId(undefined);
  };

  const handleSelectPM = (id: string) => {
    const pm = allPaymentMethods.find((p) => p.id === id);
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

    const parsedAmount = parseInt(amount, 10);
    const input: TransactionInput = {
      type,
      amount: parsedAmount,
      categoryId,
      accountId,
      paymentMethodId: pmId,
      date,
      memo: memo || undefined,
    };

    transactionService.create(input);

    if (pmId) {
      const pm = allPaymentMethods.find((p) => p.id === pmId);
      if (pm && pm.billingType === 'immediate' && pm.linkedAccountId) {
        const acct = accountService.getById(pm.linkedAccountId);
        if (acct) {
          const newBalance = type === 'expense' ? acct.balance - parsedAmount : acct.balance + parsedAmount;
          accountService.update(pm.linkedAccountId, { balance: newBalance });
        }
        const allTx = transactionService.getAll();
        const lastTx = allTx[allTx.length - 1];
        if (lastTx) {
          transactionService.update(lastTx.id, { settledAt: new Date().toISOString() });
        }
      }
    } else if (accountId) {
      const acct = accountService.getById(accountId);
      if (acct) {
        const newBalance = type === 'expense' ? acct.balance - parsedAmount : acct.balance + parsedAmount;
        accountService.update(accountId, { balance: newBalance });
      }
    }

    setShowSuccess(true);
    onSaved();
    setTimeout(() => {
      setShowSuccess(false);
      setAmount('');
      setCategoryId('');
      setMemo('');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-label="取引を追加">
      <div
        className="premium-card w-full max-w-md sm:rounded-xl rounded-t-xl p-5 max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 dark:text-green-400 mb-3" />
            <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent dark:from-green-400 dark:to-green-300">
              登録しました！
            </p>
            <p className="text-sm text-brand-600 dark:text-brand-400 mt-1">続けて入力できます</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold bg-gradient-to-r from-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-brand-300 dark:to-accent-300">
                取引を追加
              </h3>
              <button onClick={onClose} className="p-2 text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex rounded-lg overflow-hidden border border-brand-300 dark:border-brand-700">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategoryId(''); }}
                  className={`flex-1 py-2.5 font-medium transition-colors ${
                    type === 'expense' ? 'bg-red-500 text-white' : 'bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategoryId(''); setPmId(undefined); }}
                  className={`flex-1 py-2.5 font-medium transition-colors ${
                    type === 'income' ? 'bg-green-500 text-white' : 'bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                  }`}
                >
                  収入
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">金額</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 dark:text-brand-400">¥</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-xl font-bold pl-8 pr-3 py-2 border border-brand-300 dark:border-brand-600 dark:bg-brand-900 dark:text-brand-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-accent-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">カテゴリ</label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {filteredCategories.map((category) => {
                    const member = getMember(category.memberId);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setCategoryId(category.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                          categoryId === category.id
                            ? 'border-brand-500 dark:border-accent-500 bg-brand-50 dark:bg-accent-900/30 shadow-brand'
                            : 'border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getCategoryIcon(category.icon, 16)}
                        </div>
                        <span className="text-xs text-brand-800 dark:text-brand-200 truncate w-full text-center leading-tight font-medium">
                          {category.name}
                        </span>
                        {member && member.id !== 'common' && (
                          <span className="text-xs text-brand-600 dark:text-brand-400 leading-none">{member.name}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">
                  {type === 'expense' ? '支払い元' : '入金先'}
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {accounts.length > 0 && (
                    <div>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">口座</p>
                      <div className="space-y-1">
                        {accounts.map((acct) => (
                          <button
                            key={acct.id}
                            type="button"
                            onClick={() => handleSelectAccount(acct.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                              accountId === acct.id && !pmId
                                ? 'border-brand-500 dark:border-accent-500 bg-brand-50 dark:bg-accent-900/30 shadow-brand'
                                : 'border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: acct.color }} />
                              <span className="font-semibold text-brand-900 dark:text-brand-100 text-sm">{acct.name}</span>
                            </div>
                            {accountId === acct.id && !pmId && <Check size={16} className="text-brand-600 dark:text-accent-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {type === 'expense' && paymentMethods.length > 0 && (
                    <div>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">支払い手段</p>
                      <div className="space-y-1">
                        {paymentMethods.map((pm) => {
                          const linked = allAccounts.find((a) => a.id === pm.linkedAccountId);
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => handleSelectPM(pm.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                                pmId === pm.id
                                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/30 shadow-accent'
                                  : 'border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-600'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: pm.color }} />
                                <div className="text-left">
                                  <span className="font-semibold text-brand-900 dark:text-brand-100 text-sm">{pm.name}</span>
                                  {linked && <p className="text-xs text-brand-600 dark:text-brand-400">→ {linked.name}</p>}
                                </div>
                              </div>
                              {pmId === pm.id && <Check size={16} className="text-accent-600 dark:text-accent-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-hidden">
                <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">日付</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-brand-300 dark:border-brand-600 dark:bg-brand-900 dark:text-brand-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-accent-500"
                  style={{ minWidth: 0, maxWidth: '100%' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">メモ</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="任意"
                  className="w-full border border-brand-300 dark:border-brand-600 dark:bg-brand-900 dark:text-brand-100 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-accent-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 px-4">
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!amount || !categoryId || (!accountId && !pmId)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-white font-semibold disabled:opacity-50 transition-all ${
                    type === 'expense' ? 'bg-red-500 hover:bg-red-600 shadow-card hover:shadow-card-hover' : 'bg-green-500 hover:bg-green-600 shadow-card hover:shadow-card-hover'
                  }`}
                >
                  {type === 'expense' ? '支出を登録' : '収入を登録'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
