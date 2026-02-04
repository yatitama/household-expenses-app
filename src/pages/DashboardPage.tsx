import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react';
import { accountService, transactionService, categoryService } from '../services/storage';
import { formatCurrency, formatDate, getCurrentMonth, formatMonth } from '../utils/formatters';
import type { Transaction } from '../types';

export const DashboardPage = () => {
  const currentMonth = getCurrentMonth();

  // データ取得
  const accounts = accountService.getAll();
  const transactions = transactionService.getByMonth(currentMonth);
  const categories = categoryService.getAll();

  // 収支計算
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  // 口座残高合計
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // カテゴリ別支出
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const grouped = expenseTransactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
    return acc;
  }, {});

  const categoryExpenses = Object.entries(grouped)
    .map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        name: category?.name || '不明',
        color: category?.color || '#6b7280',
        amount,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // 最近の取引
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
  const getAccount = (accountId: string) => accounts.find((a) => a.id === accountId);

  return (
    <div className="p-4 space-y-4">
      {/* 月表示 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">{formatMonth(currentMonth)}</h2>
      </div>

      {/* 収支サマリー */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs">収入</span>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(income)}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <TrendingDown size={16} />
              <span className="text-xs">支出</span>
            </div>
            <p className="text-lg font-bold text-red-600">{formatCurrency(expense)}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Wallet size={16} />
              <span className="text-xs">収支</span>
            </div>
            <p className={`text-lg font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* 口座残高 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">口座残高</h3>
          <Link to="/accounts" className="text-blue-600 text-sm flex items-center gap-1">
            詳細 <ArrowRight size={14} />
          </Link>
        </div>
        {accounts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">口座を登録してください</p>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {accounts.slice(0, 3).map((account) => (
                <div key={account.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                    <span className="text-sm text-gray-700">{account.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(account.balance)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-sm text-gray-600">合計</span>
              <span className="font-bold text-lg">{formatCurrency(totalBalance)}</span>
            </div>
          </>
        )}
      </div>

      {/* カテゴリ別支出 */}
      {categoryExpenses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3">カテゴリ別支出</h3>
          <div className="flex gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                  >
                    {categoryExpenses.map((entry) => (
                      <Cell key={entry.categoryId} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {categoryExpenses.map((item) => (
                <div key={item.categoryId} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 最近の取引 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">最近の取引</h3>
          <Link to="/transactions" className="text-blue-600 text-sm flex items-center gap-1">
            すべて表示 <ArrowRight size={14} />
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">取引がありません</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => {
              const category = getCategory(transaction.categoryId);
              const account = getAccount(transaction.accountId);
              return (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  categoryName={category?.name || '不明'}
                  categoryColor={category?.color || '#6b7280'}
                  accountName={account?.name || '不明'}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface TransactionItemProps {
  transaction: Transaction;
  categoryName: string;
  categoryColor: string;
  accountName: string;
}

const TransactionItem = ({ transaction, categoryName, categoryColor, accountName }: TransactionItemProps) => {
  const isExpense = transaction.type === 'expense';

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${categoryColor}20` }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
        </div>
        <div>
          <p className="font-medium text-gray-900">{categoryName}</p>
          <p className="text-xs text-gray-500">
            {formatDate(transaction.date)} • {accountName}
          </p>
        </div>
      </div>
      <p className={`font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
        {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
      </p>
    </div>
  );
};
