import { createElement } from 'react';
import {
  User, Users, UserCircle, UserRound, CircleUser, PersonStanding,
  Baby, Crown, Star, Heart, Smile, Laugh,
  Briefcase, GraduationCap, Coffee, Music, Book,
  Dumbbell, Camera, Dog, Cat, Gamepad2,
} from 'lucide-react';

export const MEMBER_ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // 人物
  User,           // 個人
  Users,          // 家族・グループ
  UserCircle,     // アバター
  UserRound,      // 人物（丸）
  CircleUser,     // 丸アバター
  PersonStanding, // 人物（全身）
  // 家族役割
  Baby,           // 子供・赤ちゃん
  Crown,          // 王様・リーダー
  // 感情・個性
  Star,           // 特別な存在
  Heart,          // 愛情・優しい
  Smile,          // 笑顔
  Laugh,          // 大笑い
  // ライフスタイル
  Briefcase,      // 仕事人
  GraduationCap,  // 学生・勉強家
  Coffee,         // コーヒー好き
  Music,          // 音楽好き
  Book,           // 読書家
  Dumbbell,       // スポーツ好き
  Camera,         // カメラ好き
  // ペット
  Dog,            // 犬
  Cat,            // 猫
  // 趣味
  Gamepad2,       // ゲーマー
};

export const MEMBER_ICON_NAMES = Object.keys(MEMBER_ICON_COMPONENTS);

export const getMemberIcon = (iconName: string, size: number = 16) => {
  const IconComponent = MEMBER_ICON_COMPONENTS[iconName];
  if (IconComponent) {
    return createElement(IconComponent, { size });
  }
  return createElement(User, { size });
};
