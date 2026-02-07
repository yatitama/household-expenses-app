import type { AccountType, PaymentMethodType, BillingType } from '../../types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: '現金',
  bank: '銀行口座',
  emoney: '電子マネー',
};

export const PM_TYPE_LABELS: Record<PaymentMethodType, string> = {
  credit_card: 'クレジットカード',
  debit_card: 'デビットカード',
};

export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  immediate: '即時',
  monthly: '月次請求',
};

export const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];
