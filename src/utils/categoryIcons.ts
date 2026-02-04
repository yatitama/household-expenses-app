import { createElement } from 'react';
import {
  Utensils, ShoppingBag, Zap, Wifi, Home,
  GraduationCap, Heart, Car, Gamepad2, Shirt,
  Gift, PiggyBank, Briefcase, Coffee, Film,
  Music, Book, Plane, MoreHorizontal, Banknote,
  Train, Bus, Bike, Baby, Dog, Cat, Pill,
  Stethoscope, Scissors, Sparkles, Dumbbell,
  Tag,
} from 'lucide-react';

export const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Utensils, ShoppingBag, Zap, Wifi, Home,
  GraduationCap, Heart, Car, Gamepad2, Shirt,
  Gift, PiggyBank, Briefcase, Coffee, Film,
  Music, Book, Plane, MoreHorizontal, Banknote,
  Train, Bus, Bike, Baby, Dog, Cat, Pill,
  Stethoscope, Scissors, Sparkles, Dumbbell,
};

export const ICON_NAMES = Object.keys(ICON_COMPONENTS);

export const getCategoryIcon = (iconName: string, size: number = 16) => {
  const IconComponent = ICON_COMPONENTS[iconName];
  if (IconComponent) {
    return createElement(IconComponent, { size });
  }
  return createElement(Tag, { size });
};
