import type { Category, Member } from '../types';
import { COMMON_MEMBER_ID } from '../types';
import { categoryService, memberService } from './storage';

// デフォルトメンバー
const defaultMembers: Member[] = [
  { id: COMMON_MEMBER_ID, name: '共通', color: '#6b7280', isDefault: true },
  { id: 'member-husband', name: '夫', color: '#374151', isDefault: true },
  { id: 'member-wife', name: '妻', color: '#9ca3af', isDefault: true },
];

// デフォルトカテゴリ（支出）
const defaultExpenseCategories: Category[] = [
  { id: 'cat-food', name: '食費', type: 'expense', color: '#f9fafb', icon: 'Utensils' },
  { id: 'cat-daily', name: '日用品', type: 'expense', color: '#f3f4f6', icon: 'ShoppingBag' },
  { id: 'cat-utility', name: '光熱費', type: 'expense', color: '#ececf1', icon: 'Zap' },
  { id: 'cat-telecom', name: '通信費', type: 'expense', color: '#e5e7eb', icon: 'Wifi' },
  { id: 'cat-housing', name: '住居費', type: 'expense', color: '#d9dcde', icon: 'Home' },
  { id: 'cat-education', name: '教育費', type: 'expense', color: '#d1d5db', icon: 'GraduationCap' },
  { id: 'cat-medical', name: '医療費', type: 'expense', color: '#c3c7cc', icon: 'HeartPulse' },
  { id: 'cat-transport', name: '交通費', type: 'expense', color: '#b5b9bf', icon: 'Car' },
  { id: 'cat-entertainment', name: '娯楽費', type: 'expense', color: '#9ca3af', icon: 'Gamepad2' },
  { id: 'cat-clothing', name: '衣服', type: 'expense', color: '#8e9199', icon: 'Shirt' },
  { id: 'cat-other-expense', name: 'その他', type: 'expense', color: '#6b7280', icon: 'MoreHorizontal' },
];

// デフォルトカテゴリ（収入）
const defaultIncomeCategories: Category[] = [
  { id: 'cat-salary-husband', name: '給与（夫）', type: 'income', color: '#7f8694', icon: 'Briefcase' },
  { id: 'cat-salary-wife', name: '給与（妻）', type: 'income', color: '#617275', icon: 'Briefcase' },
  { id: 'cat-bonus', name: '賞与', type: 'income', color: '#526566', icon: 'Gift' },
  { id: 'cat-other-income', name: 'その他収入', type: 'income', color: '#435857', icon: 'PiggyBank' },
];

export const initializeDefaultData = (): void => {
  // メンバーの初期化
  const existingMembers = memberService.getAll();
  if (existingMembers.length === 0) {
    memberService.setAll(defaultMembers);
  }

  // カテゴリの初期化
  const existingCategories = categoryService.getAll();
  if (existingCategories.length === 0) {
    const allCategories = [...defaultExpenseCategories, ...defaultIncomeCategories];
    categoryService.setAll(allCategories);
  }
};
