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
  // Sepia - Light to Dark
  '#f5f1e8', '#f2ede3', '#efe9de', '#ece5d9', '#e9e1d4',
  '#e6dccf', '#e3d8ca', '#e0d4c5', '#ddd0c0', '#dacccb',
  '#d7c8b6', '#d4c4b1', '#d1c0ac', '#cebca7', '#c9b89a',
  '#c4b490', '#bfb086', '#b9aa7a', '#b3a470', '#a89860',
  '#a28a56', '#9c7c4c', '#966e42', '#906038', '#2d1f12',
];
