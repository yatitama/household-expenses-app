import {
  Home,
  Car,
  Heart,
  BookOpen,
  Plane,
  Baby,
  Pill,
  PiggyBank,
  Waves,
  Gamepad2,
  Laptop,
  GraduationCap,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

export const SAVINGS_GOAL_ICONS = {
  Home: Home,
  Car: Car,
  Heart: Heart,
  BookOpen: BookOpen,
  Plane: Plane,
  Baby: Baby,
  Pill: Pill,
  PiggyBank: PiggyBank,
  Waves: Waves,
  Gamepad2: Gamepad2,
  Laptop: Laptop,
  GraduationCap: GraduationCap,
  Utensils: Utensils,
} as const;

export const SAVINGS_GOAL_ICON_NAMES = Object.keys(SAVINGS_GOAL_ICONS) as Array<keyof typeof SAVINGS_GOAL_ICONS>;

export const SAVINGS_GOAL_ICON_LABELS: Record<keyof typeof SAVINGS_GOAL_ICONS, string> = {
  Home: '住宅',
  Car: '車',
  Heart: '結婚',
  BookOpen: '教育',
  Plane: '旅行',
  Baby: '子ども',
  Pill: '医療',
  PiggyBank: '貯金',
  Waves: 'リラックス',
  Gamepad2: 'ゲーム',
  Laptop: 'テック',
  GraduationCap: '進学',
  Utensils: 'グルメ',
};

export const getSavingsGoalIcon = (iconName?: string): LucideIcon => {
  const name = (iconName as keyof typeof SAVINGS_GOAL_ICONS) || 'PiggyBank';
  const IconComponent = SAVINGS_GOAL_ICONS[name] || SAVINGS_GOAL_ICONS.PiggyBank;
  return IconComponent;
};
