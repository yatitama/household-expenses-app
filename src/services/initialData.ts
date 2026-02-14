import type { Category, Member } from '../types';
import { COMMON_MEMBER_ID } from '../types';
import { categoryService, memberService } from './storage';

// デフォルトメンバー
const defaultMembers: Member[] = [
  { id: COMMON_MEMBER_ID, name: '共通', color: '#8b7355', isDefault: true },
  { id: 'member-husband', name: '夫', color: '#6b5344', isDefault: true },
  { id: 'member-wife', name: '妻', color: '#c9b89a', isDefault: true },
];

// デフォルトカテゴリ（支出）
const defaultExpenseCategories: Category[] = [
  { id: 'cat-food', name: '食費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#f5f1e8', icon: 'Utensils' },
  { id: 'cat-daily', name: '日用品', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#f2ede3', icon: 'ShoppingBag' },
  { id: 'cat-utility', name: '光熱費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#efe9de', icon: 'Zap' },
  { id: 'cat-telecom', name: '通信費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#ece5d9', icon: 'Wifi' },
  { id: 'cat-housing', name: '住居費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#e9e1d4', icon: 'Home' },
  { id: 'cat-education', name: '教育費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#e6dccf', icon: 'GraduationCap' },
  { id: 'cat-medical', name: '医療費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#e3d8ca', icon: 'Heart' },
  { id: 'cat-transport', name: '交通費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#e0d4c5', icon: 'Car' },
  { id: 'cat-entertainment', name: '娯楽費', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#ddd0c0', icon: 'Gamepad2' },
  { id: 'cat-clothing', name: '衣服', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#dacccb', icon: 'Shirt' },
  { id: 'cat-other-expense', name: 'その他', type: 'expense', memberId: COMMON_MEMBER_ID, color: '#8b7355', icon: 'MoreHorizontal' },
];

// デフォルトカテゴリ（収入）
const defaultIncomeCategories: Category[] = [
  { id: 'cat-salary-husband', name: '給与（夫）', type: 'income', memberId: 'member-husband', color: '#d7c8b6', icon: 'Briefcase' },
  { id: 'cat-salary-wife', name: '給与（妻）', type: 'income', memberId: 'member-wife', color: '#d4c4b1', icon: 'Briefcase' },
  { id: 'cat-bonus', name: '賞与', type: 'income', memberId: COMMON_MEMBER_ID, color: '#d1c0ac', icon: 'Gift' },
  { id: 'cat-other-income', name: 'その他収入', type: 'income', memberId: COMMON_MEMBER_ID, color: '#cebca7', icon: 'PiggyBank' },
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
