import { useState, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  accountService, transactionService, categoryService,
  paymentMethodService, memberService,
} from '../services/storage';
import { getCategoryIcon } from '../utils/categoryIcons';
import type { TransactionType, TransactionInput } from '../types';

export const AddTransactionPage = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const allAccounts = accountService.getAll();
  const allPaymentMethods = paymentMethodService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);
  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !selectedSourceId) {
      toast.error('金額、カテゴリ、支払い元を入力してください');
      return;
    }

    const parsedAmount = parseInt(amount, 10);

    // Find if selected source is account or payment method
    const account = allAccounts.find((a) => a.id === selectedSourceId);
    const paymentMethod = allPaymentMethods.find((p) => p.id === selectedSourceId);

    const input: TransactionInput = {
      type,
      amount: parsedAmount,
      categoryId,
      accountId: account?.id || '',
      paymentMethodId: paymentMethod?.id,
      date,
      memo: memo || undefined,
    };

    transactionService.create(input);

    if (paymentMethod) {
      if (paymentMethod.billingType === 'immediate' && paymentMethod.linkedAccountId) {
        const linkedAccount = accountService.getById(paymentMethod.linkedAccountId);
        if (linkedAccount) {
          const newBalance = type === 'expense' ? linkedAccount.balance - parsedAmount : linkedAccount.balance + parsedAmount;
          accountService.update(paymentMethod.linkedAccountId, { balance: newBalance });
        }
        const allTx = transactionService.getAll();
        const lastTx = allTx[allTx.length - 1];
        if (lastTx) {
          transactionService.update(lastTx.id, { settledAt: new Date().toISOString() });
        }
      }
    } else if (account) {
      const newBalance = type === 'expense' ? account.balance - parsedAmount : account.balance + parsedAmount;
      accountService.update(account.id, { balance: newBalance });
    }

    toast.success('取引を追加しました');
    resetForm();

    // スクロール位置を上部に戻す
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    // categoryId, selectedSourceId, dateはリセットしない
    setMemo('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-60">
        <form
          onSubmit={handleSubmit}
          className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl flex flex-col max-h-[90vh]"
        >
          <div ref={scrollContainerRef} className="overflow-y-auto flex-1 p-3 sm:p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">取引を追加</h3>
              <Link to="/" className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded-lg" aria-label="閉じる">
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </Link>
            </div>

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
                    placeholder="0"
                    className="w-full text-lg sm:text-xl font-bold pl-8 pr-3 py-2 dark:border-gray-600 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    required
                  />
                </div>
              </div>

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
                        <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                          {category.name}
                        </span>
                        {member && member.id !== 'common' && (
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-none">{member.name}</span>
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
                <div className="grid grid-cols-4 gap-2">
                  {allAccounts.map((acct) => (
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
                      <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                        {acct.name}
                      </span>
                    </button>
                  ))}

                  {type === 'expense' && allPaymentMethods.map((pm) => (
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
                      <span className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-200 break-words w-full text-center leading-tight">
                        {pm.name}
                      </span>
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
          <div className="border-t dark:border-gray-700 p-3 sm:p-4 flex gap-3">
            <Link to="/" className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg dark:border-gray-600 bg-gray-100 text-gray-900 dark:text-gray-100 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600 text-center">
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={!amount || !categoryId || !selectedSourceId}
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg btn-primary text-white font-medium text-sm disabled:opacity-50 transition-colors"
            >
              登録
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
