// 口座タイプ
export type AccountType = 'husband_personal' | 'wife_personal' | 'family_common';

// 支払い方法
export type PaymentMethod = 'cash' | 'bank' | 'credit_card' | 'debit_card' | 'emoney';

// 口座・カード情報
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  paymentMethod: PaymentMethod;
  balance: number;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// 取引タイプ
export type TransactionType = 'income' | 'expense';

// 取引記録
export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// カテゴリスコープ
export type CategoryScope = 'common' | 'husband' | 'wife';

// カテゴリ情報
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  scope: CategoryScope;
  color: string;
  icon: string;
}

// 月別予算
export interface Budget {
  id: string;
  categoryId: string;
  month: string;
  amount: number;
}

// カード請求情報
export interface CardBilling {
  id: string;
  accountId: string;
  month: string;
  billingAmount: number;
  dueDate: string;
  isPaid: boolean;
  memo?: string;
}

// 新規作成時の入力型（id, createdAt, updatedAtを除く）
export type AccountInput = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>;
export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
export type BudgetInput = Omit<Budget, 'id'>;
export type CardBillingInput = Omit<CardBilling, 'id'>;
