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

// 中程度の彩度・明度の色のみ（薄色・暗色は除外）、色相環を網羅
export const COLORS = [
  // グレー・ニュートラル
  '#9ca3af', '#6b7280', '#4b5563', '#374151',
  // ウォームグレー（stone）
  '#a8a29e', '#78716c', '#57534e',
  // レッド
  '#f87171', '#ef4444', '#dc2626', '#b91c1c',
  // ローズ
  '#fb7185', '#f43f5e', '#e11d48',
  // オレンジ
  '#fb923c', '#f97316', '#ea580c', '#c2410c',
  // アンバー
  '#fbbf24', '#f59e0b', '#d97706',
  // イエロー
  '#facc15', '#eab308', '#ca8a04',
  // ライム
  '#a3e635', '#84cc16', '#65a30d',
  // グリーン
  '#4ade80', '#22c55e', '#16a34a',
  // エメラルド
  '#34d399', '#10b981', '#059669',
  // ティール
  '#2dd4bf', '#14b8a6', '#0d9488',
  // シアン
  '#22d3ee', '#06b6d4', '#0891b2',
  // スカイ
  '#38bdf8', '#0ea5e9', '#0284c7',
  // ブルー
  '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
  // インディゴ
  '#818cf8', '#6366f1', '#4f46e5',
  // バイオレット
  '#a78bfa', '#8b5cf6', '#7c3aed',
  // パープル
  '#c084fc', '#a855f7', '#9333ea',
  // フューシャ
  '#e879f9', '#d946ef', '#c026d3',
  // ピンク
  '#f472b6', '#ec4899', '#db2777',
];
