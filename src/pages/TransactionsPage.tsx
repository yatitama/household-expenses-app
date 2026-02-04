import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { accountService, transactionService, categoryService } from '../services/storage';
import { formatCurrency, formatDate, formatMonth } from '../utils/formatters';
import type { Transaction, TransactionType } from '../types';

export const TransactionsPage = () => {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    transactionService.getAll()
  );

  const accounts = accountService.getAll();
  const categories = categoryService.getAll();

  const refreshTransactions = useCallback(() => {
    setTransactions(transactionService.getAll());
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth(format(subMonths(parseISO(`${currentMonth}-01`), 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(format(addMonths(parseISO(`${currentMonth}-01`), 1), 'yyyy-MM'));
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
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(currentMonth))
      .filter((t) => filterType === 'all' || t.type === filterType)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, currentMonth, filterType]);

  // 月の集計
  const summary = useMemo(() => {
    const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  }, [transactions, currentMonth]);

  // 日付でグループ化
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      if (!groups[t.date]) {
        groups[t.date] = [];
      }
      groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
  const getAccount = (accountId: string) => accounts.find((a) => a.id === accountId);

  return (
    <div className="p-4 space-y-4">
      {/* 月選択 */}
      <div className="flex items-center justify-between">
        <button onClick={handlePrevMonth} className="p-2 text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">{formatMonth(currentMonth)}</h2>
        <button onClick={handleNextMonth} className="p-2 text-gray-600 hover:text-gray-900">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 月の集計 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">収入</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(summary.income)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">支出</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(summary.expense)}</p>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-2">
        {(['all', 'expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterType === t
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {t === 'all' ? 'すべて' : t === 'expense' ? '支出' : '収入'}
          </button>
        ))}
      </div>

      {/* 取引一覧 */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">取引がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
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
                      accountName={account?.name || '不明'}
                      onDelete={() => handleDelete(transaction)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface TransactionItemProps {
  transaction: Transaction;
  categoryName: string;
  categoryColor: string;
  accountName: string;
  onDelete: () => void;
}

const TransactionItem = ({
  transaction,
  categoryName,
  categoryColor,
  accountName,
  onDelete,
}: TransactionItemProps) => {
  const isExpense = transaction.type === 'expense';

  return (
    <div className="flex justify-between items-center p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
        </div>
        <div>
          <p className="font-medium text-gray-900">{categoryName}</p>
          <p className="text-xs text-gray-500">{accountName}</p>
          {transaction.memo && <p className="text-xs text-gray-400 mt-1">{transaction.memo}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={`font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
          {isExpense ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </p>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
