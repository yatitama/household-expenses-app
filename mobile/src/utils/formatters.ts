import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

// 金額をフォーマット（例: 10000 → "¥10,000"）
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

// 日付をフォーマット（例: "2026-02-04" → "2月4日"）
export const formatDate = (dateStr: string): string => {
  return format(parseISO(dateStr), 'M月d日', { locale: ja });
};

// 日付をフォーマット（例: "2026-02-04" → "2026年2月4日"）
export const formatDateFull = (dateStr: string): string => {
  return format(parseISO(dateStr), 'yyyy年M月d日', { locale: ja });
};

// 現在の月を取得（例: "2026-02"）
export const getCurrentMonth = (): string => {
  return format(new Date(), 'yyyy-MM');
};

// 月をフォーマット（例: "2026-02" → "2026年2月"）
export const formatMonth = (monthStr: string): string => {
  return format(parseISO(`${monthStr}-01`), 'yyyy年M月', { locale: ja });
};
