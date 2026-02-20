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
// color: 中程度の彩度・明度の色を色相環を網羅するように設定
const defaultExpenseCategories: Category[] = [
  { id: 'cat-food',          name: '食費',   type: 'expense', color: '#f97316', icon: 'Utensils' },      // orange-500
  { id: 'cat-daily',         name: '日用品', type: 'expense', color: '#3b82f6', icon: 'ShoppingBag' },   // blue-500
  { id: 'cat-utility',       name: '光熱費', type: 'expense', color: '#f59e0b', icon: 'Zap' },           // amber-500
  { id: 'cat-telecom',       name: '通信費', type: 'expense', color: '#8b5cf6', icon: 'Wifi' },          // violet-500
  { id: 'cat-housing',       name: '住居費', type: 'expense', color: '#78716c', icon: 'Home' },          // stone-500
  { id: 'cat-education',     name: '教育費', type: 'expense', color: '#0d9488', icon: 'GraduationCap' }, // teal-600
  { id: 'cat-medical',       name: '医療費', type: 'expense', color: '#ef4444', icon: 'HeartPulse' },    // red-500
  { id: 'cat-transport',     name: '交通費', type: 'expense', color: '#64748b', icon: 'Car' },           // slate-500
  { id: 'cat-entertainment', name: '娯楽費', type: 'expense', color: '#ec4899', icon: 'Gamepad2' },      // pink-500
  { id: 'cat-clothing',      name: '衣服',   type: 'expense', color: '#6366f1', icon: 'Shirt' },         // indigo-500
  { id: 'cat-other-expense', name: 'その他', type: 'expense', color: '#6b7280', icon: 'MoreHorizontal' }, // gray-500
];

// デフォルトカテゴリ（収入）
const defaultIncomeCategories: Category[] = [
  { id: 'cat-salary-husband', name: '給与（夫）',  type: 'income', color: '#2563eb', icon: 'Briefcase' }, // blue-600
  { id: 'cat-salary-wife',    name: '給与（妻）',  type: 'income', color: '#10b981', icon: 'Briefcase' }, // emerald-500
  { id: 'cat-bonus',          name: '賞与',        type: 'income', color: '#d97706', icon: 'Gift' },      // amber-600
  { id: 'cat-other-income',   name: 'その他収入', type: 'income', color: '#06b6d4', icon: 'PiggyBank' },  // cyan-500
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
