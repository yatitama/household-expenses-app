import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, CheckCircle } from 'lucide-react';
import { accountService, transactionService, categoryService, memberService } from '../services/storage';
import { getCategoryIcon } from '../utils/categoryIcons';
import type { TransactionType, TransactionInput } from '../types';

export const AddTransactionPage = () => {
  const navigate = useNavigate();
  const accounts = accountService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');
  const [continueAdding, setContinueAdding] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const resetForm = () => {
    setAmount('');
    setCategoryId('');
    setMemo('');
    // 日付と口座は維持する（連続入力しやすいように）
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !categoryId || !accountId) {
      alert('金額、カテゴリ、口座を入力してください');
      return;
    }

    const input: TransactionInput = {
      type,
      amount: parseInt(amount, 10),
      categoryId,
      accountId,
      date,
      memo: memo || undefined,
    };

    transactionService.create(input);

    // 口座残高を更新
    const account = accountService.getById(accountId);
    if (account) {
      const newBalance =
        type === 'expense' ? account.balance - input.amount : account.balance + input.amount;
      accountService.update(accountId, { balance: newBalance });
    }

    if (continueAdding) {
      // 連続追加モード: フォームをリセットして成功メッセージを表示
      resetForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      // 画面上部へスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 通常モード: ホームに戻る
      navigate('/');
    }
  };

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">取引を追加</h2>

      {/* 成功メッセージ */}
      {showSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          <span className="font-medium">登録しました！続けて入力できます。</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 収入/支出の切り替え */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategoryId('');
            }}
            className={`flex-1 py-3 font-medium transition-colors ${
              type === 'expense' ? 'bg-red-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategoryId('');
            }}
            className={`flex-1 py-3 font-medium transition-colors ${
              type === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            収入
          </button>
        </div>

        {/* 金額入力 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">金額</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full text-3xl font-bold pl-8 pr-3 py-3 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* カテゴリ選択 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
          {filteredCategories.length === 0 ? (
            <p className="text-gray-500 text-sm">カテゴリがありません</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((category) => {
                const member = getMember(category.memberId);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                      categoryId === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getCategoryIcon(category.icon, 18)}
                    </div>
                    <span className="text-xs text-gray-700 truncate w-full text-center">
                      {category.name}
                    </span>
                    {member && member.id !== 'common' && (
                      <span className="text-[10px] text-gray-400">{member.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 口座選択 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {type === 'expense' ? '支払い元' : '入金先'}
          </label>
          {accounts.length === 0 ? (
            <p className="text-gray-500 text-sm">口座を登録してください</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setAccountId(account.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    accountId === account.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                    <span className="font-medium text-gray-900">{account.name}</span>
                  </div>
                  {accountId === account.id && <Check size={18} className="text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 日付 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* メモ */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">メモ（任意）</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモを入力"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 連続追加オプション */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={continueAdding}
              onChange={(e) => setContinueAdding(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">連続して入力する</span>
          </label>
        </div>

        {/* 登録ボタン */}
        <button
          type="submit"
          disabled={!amount || !categoryId || !accountId}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-colors ${
            type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {type === 'expense' ? '支出を登録' : '収入を登録'}
        </button>
      </form>
    </div>
  );
};
