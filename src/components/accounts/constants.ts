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
  // Grayscale - Light to Dark
  '#f9fafb', '#f3f4f6', '#ececf1', '#e5e7eb', '#d9dcde',
  '#d1d5db', '#c3c7cc', '#b5b9bf', '#9ca3af', '#8e9199',
  '#7f8694', '#707c85', '#617275', '#526566', '#435857',
  '#354a48', '#273c39', '#1a2e2a', '#1f2937', '#111827',
];
