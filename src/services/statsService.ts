import { format, subMonths, parseISO } from 'date-fns';
import { transactionService, categoryService, memberService, budgetService } from './storage';
import type { Transaction } from '../types';

export interface MonthlyStats {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MemberStats {
  memberId: string;
  memberName: string;
  amount: number;
  color: string;
}

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  budget: number;
  actual: number;
  percentage: number;
  color: string;
}

const getTransactionsForMonth = (year: number, month: number): Transaction[] => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  return transactionService.getByMonth(monthStr);
};

export const getMonthlyStats = (months: number): MonthlyStats[] => {
  const now = new Date();
  const result: MonthlyStats[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = subMonths(now, i);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const transactions = getTransactionsForMonth(year, month);

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    result.push({
      month: format(targetDate, 'yyyy-MM'),
      label: format(targetDate, 'M月'),
      income,
      expense,
    });
  }

  return result;
};

export const getCategoryStats = (year: number, month: number): CategoryStats[] => {
  const transactions = getTransactionsForMonth(year, month);
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const categories = categoryService.getAll();

  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  if (totalExpense === 0) return [];

  const categoryMap = new Map<string, number>();
  for (const t of expenseTransactions) {
    categoryMap.set(t.categoryId, (categoryMap.get(t.categoryId) || 0) + t.amount);
  }

  const result: CategoryStats[] = [];
  for (const [categoryId, amount] of categoryMap) {
    const category = categories.find((c) => c.id === categoryId);
    result.push({
      categoryId,
      categoryName: category?.name || '不明',
      amount,
      percentage: Math.round((amount / totalExpense) * 100),
      color: category?.color || '#9ca3af',
    });
  }

  return result.sort((a, b) => b.amount - a.amount);
};

export const getMemberStats = (year: number, month: number): MemberStats[] => {
  const transactions = getTransactionsForMonth(year, month);
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const categories = categoryService.getAll();
  const members = memberService.getAll();

  const memberMap = new Map<string, number>();
  for (const t of expenseTransactions) {
    const category = categories.find((c) => c.id === t.categoryId);
    const memberId = category?.memberId || 'common';
    memberMap.set(memberId, (memberMap.get(memberId) || 0) + t.amount);
  }

  const result: MemberStats[] = [];
  for (const [memberId, amount] of memberMap) {
    const member = members.find((m) => m.id === memberId);
    result.push({
      memberId,
      memberName: member?.name || '不明',
      amount,
      color: member?.color || '#9ca3af',
    });
  }

  return result.sort((a, b) => b.amount - a.amount);
};

export const getBudgetProgress = (year: number, month: number): BudgetProgress[] => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const budgets = budgetService.getByMonth(monthStr);
  const transactions = getTransactionsForMonth(year, month);
  const categories = categoryService.getAll();

  const expenseByCategory = new Map<string, number>();
  for (const t of transactions.filter((t) => t.type === 'expense')) {
    expenseByCategory.set(t.categoryId, (expenseByCategory.get(t.categoryId) || 0) + t.amount);
  }

  const result: BudgetProgress[] = [];
  for (const budget of budgets) {
    const category = categories.find((c) => c.id === budget.categoryId);
    const actual = expenseByCategory.get(budget.categoryId) || 0;
    result.push({
      categoryId: budget.categoryId,
      categoryName: category?.name || '不明',
      budget: budget.amount,
      actual,
      percentage: budget.amount > 0 ? Math.round((actual / budget.amount) * 100) : 0,
      color: category?.color || '#9ca3af',
    });
  }

  return result.sort((a, b) => b.percentage - a.percentage);
};

export const getMonthlyTotal = (year: number, month: number): { income: number; expense: number } => {
  const transactions = getTransactionsForMonth(year, month);
  return {
    income: transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    expense: transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
  };
};

export const getTransactionsByDateRange = (startDate: string, endDate: string): Transaction[] => {
  const all = transactionService.getAll();
  return all.filter((t) => {
    const d = parseISO(t.date);
    return d >= parseISO(startDate) && d <= parseISO(endDate);
  });
};
