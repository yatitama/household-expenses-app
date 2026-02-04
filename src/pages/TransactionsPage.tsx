import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Edit2, Check } from 'lucide-react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { accountService, transactionService, categoryService, memberService } from '../services/storage';
import { formatCurrency, formatDate, formatMonth } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';
import type { Transaction, TransactionType, TransactionInput } from '../types';

export const TransactionsPage = () => {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    transactionService.getAll()
  );
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const accounts = accountService.getAll();
  const categories = categoryService.getAll();
  const members = memberService.getAll();

  const refreshTransactions = useCallback(() => {
    setTransactions(transactionService.getAll());
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth(format(subMonths(parseISO(`${currentMonth}-01`), 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(format(addMonths(parseISO(`${currentMonth}-01`), 1), 'yyyy-MM'));
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleSaveEdit = (input: TransactionInput) => {
    if (!editingTransaction) return;

    const oldTransaction = editingTransaction;
    const oldAccount = accountService.getById(oldTransaction.accountId);
    const newAccount = accountService.getById(input.accountId);

    // 古い取引の残高を戻す
    if (oldAccount) {
      const revertBalance =
        oldTransaction.type === 'expense'
          ? oldAccount.balance + oldTransaction.amount
          : oldAccount.balance - oldTransaction.amount;
      accountService.update(oldAccount.id, { balance: revertBalance });
    }

    // 新しい取引の残高を適用
    if (newAccount) {
      const currentBalance = oldAccount?.id === newAccount.id
        ? (oldTransaction.type === 'expense'
            ? oldAccount.balance + oldTransaction.amount
            : oldAccount.balance - oldTransaction.amount)
        : newAccount.balance;
      const newBalance =
        input.type === 'expense'
          ? currentBalance - input.amount
          : currentBalance + input.amount;
      accountService.update(newAccount.id, { balance: newBalance });
    }

    transactionService.update(editingTransaction.id, input);
    refreshTransactions();
    setEditingTransaction(null);
  };

  const handleDelete = (transaction: Transaction) => {
    if (confirm('この取引を削除しますか？')) {
      // 口座残高を戻す
      const account = accountService.getById(transaction.accountId);
      if (account) {
        const newBalance =
          transaction.type === 'expense'
            ? account.balance + transaction.amount
            : account.balance - transaction.amount;
        accountService.update(transaction.accountId, { balance: newBalance });
      }

      transactionService.delete(transaction.id);
      refreshTransactions();
    }
  };

  // フィルタリングされた取引
  const filteredTransactions = transactions
    .filter((t) => t.date.startsWith(currentMonth))
    .filter((t) => filterType === 'all' || t.type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date));

  // 月の集計
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const income = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 日付でグループ化
  const groupedByDate: Record<string, Transaction[]> = {};
  filteredTransactions.forEach((t) => {
    if (!groupedByDate[t.date]) {
      groupedByDate[t.date] = [];
    }
    groupedByDate[t.date].push(t);
  });

  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
  const getAccount = (accountId: string) => accounts.find((a) => a.id === accountId);

  return (
    <div className="flex flex-col h-full">
      {/* スティッキーヘッダー */}
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-2 space-y-3 border-b border-gray-200">
        {/* 月選択と集計 */}
        <div className="bg-white rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handlePrevMonth} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-800">{formatMonth(currentMonth)}</h2>
            <button onClick={handleNextMonth} className="p-2 -mr-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg">
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">収入</p>
              <p className="text-base font-bold text-green-600">{formatCurrency(income)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">支出</p>
              <p className="text-base font-bold text-red-600">{formatCurrency(expense)}</p>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex gap-2">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 active:bg-gray-100'
              }`}
            >
              {t === 'all' ? 'すべて' : t === 'expense' ? '支出' : '収入'}
            </button>
          ))}
        </div>
      </div>

      {/* 取引一覧 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">取引がありません</p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, dayTransactions]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{formatDate(date)}</h3>
              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                {dayTransactions.map((transaction) => {
                  const category = getCategory(transaction.categoryId);
                  const account = getAccount(transaction.accountId);
                  return (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      categoryName={category?.name || '不明'}
                      categoryColor={category?.color || '#6b7280'}
                      categoryIcon={category?.icon || ''}
                      accountName={account?.name || '不明'}
                      onEdit={() => handleEdit(transaction)}
                      onDelete={() => handleDelete(transaction)}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 編集モーダル */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          members={members}
          onSave={handleSaveEdit}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
};

interface TransactionItemProps {
  transaction: Transaction;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  accountName: string;
  onEdit: () => void;
  onDelete: () => void;
}

const TransactionItem = ({
  transaction,
  categoryName,
  categoryColor,
  categoryIcon,
  accountName,
  onEdit,
  onDelete,
}: TransactionItemProps) => {
  const isExpense = transaction.type === 'expense';

  return (
    <div className="flex justify-between items-center p-4">
      <button onClick={onEdit} className="flex items-center gap-3 flex-1 text-left min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
        >
          {getCategoryIcon(categoryIcon, 20)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate">{categoryName}</p>
          <p className="text-xs text-gray-500 truncate">{accountName}</p>
          {transaction.memo && <p className="text-xs text-gray-400 mt-1 truncate">{transaction.memo}</p>}
        </div>
      </button>
      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        <p className={`font-bold text-sm ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
          {isExpense ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </p>
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600">
          <Edit2 size={16} />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

interface EditTransactionModalProps {
  transaction: Transaction;
  accounts: { id: string; name: string; color: string }[];
  categories: { id: string; name: string; type: TransactionType; color: string; icon: string; memberId: string }[];
  members: { id: string; name: string; color: string }[];
  onSave: (input: TransactionInput) => void;
  onClose: () => void;
}

const EditTransactionModal = ({
  transaction,
  accounts,
  categories,
  members,
  onSave,
  onClose,
}: EditTransactionModalProps) => {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [date, setDate] = useState(transaction.date);
  const [memo, setMemo] = useState(transaction.memo || '');

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !categoryId || !accountId) {
      alert('金額、カテゴリ、口座を入力してください');
      return;
    }

    onSave({
      type,
      amount: parseInt(amount, 10),
      categoryId,
      accountId,
      date,
      memo: memo || undefined,
    });
  };

  const getMember = (memberId: string) => members.find((m) => m.id === memberId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md sm:rounded-xl rounded-t-xl p-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">取引を編集</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 収入/支出の切り替え */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId('');
              }}
              className={`flex-1 py-2.5 font-medium transition-colors ${
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
              className={`flex-1 py-2.5 font-medium transition-colors ${
                type === 'income' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              収入
            </button>
          </div>

          {/* 金額入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xl font-bold pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
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
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getCategoryIcon(category.icon, 16)}
                    </div>
                    <span className="text-[11px] text-gray-700 truncate w-full text-center leading-tight">
                      {category.name}
                    </span>
                    {member && member.id !== 'common' && (
                      <span className="text-[9px] text-gray-400 leading-none">{member.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 口座選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'expense' ? '支払い元' : '入金先'}
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setAccountId(account.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    accountId === account.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                    <span className="font-medium text-gray-900 text-sm">{account.name}</span>
                  </div>
                  {accountId === account.id && <Check size={16} className="text-blue-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="任意"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!amount || !categoryId || !accountId}
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
