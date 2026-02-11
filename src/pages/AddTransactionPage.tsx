import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  accountService, transactionService, categoryService,
  paymentMethodService,
} from '../services/storage';
import { getCategoryIcon } from '../utils/categoryIcons';
import type { TransactionType, TransactionInput } from '../types';

export const AddTransactionPage = () => {
  const allAccounts = accountService.getAll();
  const allPaymentMethods = paymentMethodService.getAll();
  const categories = categoryService.getAll();

  const defaultAccountId = allAccounts.length > 0 ? allAccounts[0].id : '';

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [pmId, setPmId] = useState<string | undefined>();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

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

    toast.success('取引を追加しました');
    resetForm();
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategoryId('');
    setAccountId(defaultAccountId);
    setPmId(undefined);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setMemo('');
  };

  const accounts = allAccounts;
  const paymentMethods = pmId
    ? allPaymentMethods.filter((pm) => pm.id === pmId)
    : accountId
      ? allPaymentMethods.filter((pm) => pm.linkedAccountId === accountId)
      : allPaymentMethods;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-6 px-4 md:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">取引を追加</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              種類
            </label>
            <div className="flex gap-3">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setCategoryId('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                    type === t
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {t === 'expense' ? '支出' : '収入'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              金額
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              カテゴリ
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500"
            >
              <option value="">選択してください</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryIcon(cat.icon)} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account or Payment Method Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                支払い元（口座）
              </label>
              <select
                value={accountId}
                onChange={(e) => handleSelectAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (残高: ¥{acc.balance.toLocaleString('ja-JP')})
                  </option>
                ))}
              </select>
            </div>

            {paymentMethods.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  支払い手段（カード）
                </label>
                <select
                  value={pmId || ''}
                  onChange={(e) => handleSelectPM(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500"
                >
                  <option value="">選択しない</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              日付
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500"
            />
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              メモ
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモ（オプション）"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            追加
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          取引を追加した後、このページのトップに戻り、連続して入力できます
        </div>
      </div>
    </div>
  );
};
