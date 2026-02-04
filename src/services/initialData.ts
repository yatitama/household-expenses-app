import type { Category, Member } from '../types';
import { COMMON_MEMBER_ID } from '../types';
import { categoryService, memberService } from './storage';

// デフォルトメンバー
const defaultMembers: Member[] = [
  { id: COMMON_MEMBER_ID, name: '共通', color: '#6b7280', isDefault: true },
  { id: 'member-husband', name: '夫', color: '#3b82f6', isDefault: true },
  { id: 'member-wife', name: '妻', color: '#ec4899', isDefault: true },
];

// デフォルトカテゴリ（支出）
const defaultExpenseCategories: Category[] = [
  { id: 'cat-food', name: '食費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#ef4444', icon: 'Utensils' },
  { id: 'cat-daily', name: '日用品', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#f97316', icon: 'ShoppingBag' },
  { id: 'cat-utility', name: '光熱費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#eab308', icon: 'Zap' },
  { id: 'cat-telecom', name: '通信費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#22c55e', icon: 'Wifi' },
  { id: 'cat-housing', name: '住居費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#14b8a6', icon: 'Home' },
  { id: 'cat-education', name: '教育費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#3b82f6', icon: 'GraduationCap' },
  { id: 'cat-medical', name: '医療費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#8b5cf6', icon: 'Heart' },
  { id: 'cat-transport', name: '交通費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#ec4899', icon: 'Car' },
  { id: 'cat-entertainment', name: '娯楽費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#f43f5e', icon: 'Gamepad2' },
  { id: 'cat-clothing', name: '衣服', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#6366f1', icon: 'Shirt' },
  { id: 'cat-other-expense', name: 'その他', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#6b7280', icon: 'MoreHorizontal' },
];

// デフォルトカテゴリ（収入）
const defaultIncomeCategories: Category[] = [
  { id: 'cat-salary-husband', name: '給与（夫）', type: 'income', memberId: 'member-husband', color: '#22c55e', icon: 'Briefcase' },
  { id: 'cat-salary-wife', name: '給与（妻）', type: 'income', memberId: 'member-wife', color: '#14b8a6', icon: 'Briefcase' },
  { id: 'cat-bonus', name: '賞与', type: 'income', memberId: COMMON_MEMBER_ID, color: '#3b82f6', icon: 'Gift' },
  { id: 'cat-other-income', name: 'その他収入', type: 'income', memberId: COMMON_MEMBER_ID, color: '#8b5cf6', icon: 'PiggyBank' },
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
