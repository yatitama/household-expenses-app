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
  // Red系
  '#fee2e2', '#fca5a5', '#f87171', '#ef4444', '#dc2626',
  // Orange系
  '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c',
  // Yellow系
  '#fef3c7', '#fde047', '#facc15', '#eab308', '#ca8a04',
  // Lime系
  '#d9f99d', '#bef264', '#a3e635', '#84cc16', '#65a30d',
  // Green系
  '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a',
  // Emerald系
  '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669',
  // Teal系
  '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488',
  // Cyan系
  '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2',
  // Blue系
  '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb',
  // Indigo系
  '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5',
  // Purple系
  '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea',
  // Pink系
  '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777',
  // Rose系
  '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48',
  // Gray系
  '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563',
];
