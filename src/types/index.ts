// メンバー（家族構成員）
export interface Member {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault?: boolean;
}

// 口座タイプ（資産）
export type AccountType = 'cash' | 'bank' | 'emoney';

// 支払い手段タイプ
export type PaymentMethodType = 'credit_card' | 'debit_card';

// 請求タイミング
export type BillingType = 'immediate' | 'monthly';

// 口座・資産情報
export interface Account {
  id: string;
  name: string;
  memberId: string;
  type: AccountType;
  balance: number;
  color: string;
  icon?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// 支払い手段（クレジットカード・デビットカード）
export interface PaymentMethod {
  id: string;
  name: string;
  memberId: string;
  type: PaymentMethodType;
  linkedAccountId: string;
  billingType: BillingType;
  closingDay?: number;
  paymentDay?: number;
  paymentMonthOffset?: number;
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
  paymentMethodId?: string;
  settledAt?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// カテゴリ情報
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  memberId: string;
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

// 定期支払い頻度
export type RecurringFrequency = 'monthly' | 'yearly';

// 定期支払い
export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  paymentMethodId?: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  monthOfYear?: number; // yearlyの場合のみ（1-12）
  memo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// カード請求情報
export interface CardBilling {
  id: string;
  paymentMethodId: string;
  month: string;
  billingAmount: number;
  dueDate: string;
  isPaid: boolean;
  memo?: string;
}

// 紐付き手段（PaymentMethodと口座を紐付ける）
export interface LinkedPaymentMethod {
  id: string;
  paymentMethodId: string;  // 紐付ける支払い手段
  accountId: string;         // 紐付け先の口座
  isActive: boolean;         // 有効/無効
  createdAt: string;
  updatedAt: string;
}

// 新規作成時の入力型（id, createdAt, updatedAtを除く）
export type MemberInput = Omit<Member, 'id'>;
export type AccountInput = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>;
export type PaymentMethodInput = Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>;
export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'settledAt'>;
export type CategoryInput = Omit<Category, 'id'>;
export type BudgetInput = Omit<Budget, 'id'>;
export type CardBillingInput = Omit<CardBilling, 'id'>;
export type RecurringPaymentInput = Omit<RecurringPayment, 'id' | 'createdAt' | 'updatedAt'>;
export type LinkedPaymentMethodInput = Omit<LinkedPaymentMethod, 'id' | 'createdAt' | 'updatedAt'>;

// 共通メンバーID（削除不可）
export const COMMON_MEMBER_ID = 'common';

// テーマカラータイプ
export type ThemeColor = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'pink' | 'cyan' | 'indigo' | 'rose' | 'teal' | 'orange' | 'lime' | 'sky';

// テーマ色パレット
export interface ThemeColorPalette {
  // メインカラーの段階
  50: string;    // 最も薄い
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;   // 標準
  600: string;
  700: string;
  800: string;
  900: string;   // 最も濃い
}

// テーマ設定
export interface ThemeSettings {
  currentTheme: ThemeColor;
}
