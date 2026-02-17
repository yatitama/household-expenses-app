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
  // グレースケール
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af',
  '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827',
  // レッド・オレンジ
  '#fca5a5', '#ef4444', '#dc2626', '#b91c1c',
  '#fed7aa', '#f97316', '#ea580c', '#c2410c',
  // イエロー・ライム
  '#fef08a', '#eab308', '#ca8a04',
  '#d9f99d', '#84cc16', '#65a30d',
  // グリーン
  '#bbf7d0', '#22c55e', '#16a34a', '#166534',
  '#6ee7b7', '#10b981',
  // ティール・シアン
  '#99f6e4', '#14b8a6', '#0d9488', '#0f766e',
  // ブルー
  '#bfdbfe', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
  // インディゴ・バイオレット
  '#c7d2fe', '#818cf8', '#6366f1', '#4f46e5', '#4338ca',
  // パープル・ピンク
  '#e9d5ff', '#c084fc', '#a855f7', '#9333ea', '#7e22ce',
];
