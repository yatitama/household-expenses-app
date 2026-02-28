import { createElement } from 'react';
import {
  User, Users, UserCircle, UserRound, CircleUser,
  Baby, Crown, Star, Heart, Smile,
  Briefcase, GraduationCap, Coffee, Music, Book,
  Dumbbell, Camera, Dog, Cat, Gamepad2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export const MEMBER_ICON_COMPONENTS: Record<string, LucideIcon> = {
  User,
  Users,
  UserCircle,
  UserRound,
  CircleUser,
  Baby,
  Crown,
  Star,
  Heart,
  Smile,
  Briefcase,
  GraduationCap,
  Coffee,
  Music,
  Book,
  Dumbbell,
  Camera,
  Dog,
  Cat,
  Gamepad2,
};

export const MEMBER_ICON_NAMES = Object.keys(MEMBER_ICON_COMPONENTS);

export const getMemberIcon = (iconName: string, size: number = 16, color?: string) => {
  const IconComponent = MEMBER_ICON_COMPONENTS[iconName] ?? User;
  return createElement(IconComponent, { size, color });
};
