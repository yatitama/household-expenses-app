import { createElement } from 'react';
import {
  Utensils, ShoppingBag, Zap, Wifi, Home,
  GraduationCap, Heart, Car, Gamepad2, Shirt,
  Gift, PiggyBank, Briefcase, Coffee, Film,
  Music, Book, Plane, MoreHorizontal, Banknote,
  Train, Bus, Bike, Baby, Dog, Cat, Pill,
  Stethoscope, Scissors, Sparkles, Dumbbell,
  Users, User, UserCircle, UserRound, CircleUser,
  // 追加アイコン
  ShoppingCart, UtensilsCrossed, BottleWine, BookOpen,
  Camera, Tv, Wrench, Truck, Globe, Shield,
  Landmark, TrendingUp, Flame, Flower2, Gem,
  PartyPopper, HeartPulse, Star, MapPin, Receipt,
  Coins, Trees, TreeDeciduous, Brush, PaintBucket,
  HandCoins, Building2,
  Tag,
} from 'lucide-react';

export const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // 食事・飲食
  Utensils,       // 食費
  UtensilsCrossed, // 外食
  Coffee,         // カフェ
  BottleWine,     // 飲み会・交際
  // 買い物
  ShoppingBag,    // 日用品
  ShoppingCart,   // スーパー・買い物
  // 住まい・設備
  Home,           // 住居費
  Building2,      // 賃貸・不動産
  Flame,          // 暖房・ガス
  Zap,            // 電気・光熱費
  Wrench,         // 修理・メンテナンス
  PaintBucket,    // DIY・塗装
  // 交通・移動
  Car,            // 交通費・車
  Train,          // 電車
  Bus,            // バス
  Bike,           // 自転車
  Truck,          // 引越し・配送
  Plane,          // 飛行機・旅行
  Globe,          // 海外・旅行
  MapPin,         // 場所・お出かけ
  // 通信・デジタル
  Wifi,           // 通信費
  Tv,             // テレビ・動画配信
  // 教育・学習
  GraduationCap,  // 教育費
  Book,           // 書籍
  BookOpen,       // 読書・学習
  // 医療・健康
  Heart,          // 健康
  HeartPulse,     // 医療費・健康管理
  Stethoscope,    // 診察・医院
  Pill,           // 薬・医薬品
  Dumbbell,       // スポーツ・フィットネス
  // 美容・ファッション
  Shirt,          // 衣服
  Scissors,       // 美容院・散髪
  Sparkles,       // 美容・コスメ
  Flower2,        // フラワー・インテリア
  Gem,            // 宝石・アクセサリー
  // 娯楽・趣味
  Gamepad2,       // ゲーム・娯楽
  Film,           // 映画・動画
  Music,          // 音楽
  Camera,         // カメラ・写真
  Brush,          // アート・趣味
  // お金・保険・税金
  Banknote,       // 現金・お金
  Coins,          // 小銭・雑費
  Receipt,        // 領収書・精算
  Shield,         // 保険
  Landmark,       // 税金・行政・金融機関
  TrendingUp,     // 投資・運用
  HandCoins,      // 寄付・お布施
  // 家族・人
  Baby,           // 子育て・育児
  Users,          // 家族・共通
  User,           // 個人
  UserCircle,
  UserRound,
  CircleUser,
  // ペット
  Dog,            // 犬
  Cat,            // 猫
  // イベント・お祝い
  Gift,           // プレゼント・お祝い
  PartyPopper,    // イベント・記念日
  // 自然・公園
  Trees,          // 公園・自然
  TreeDeciduous,  // 季節・自然
  // 収入
  PiggyBank,      // 貯金・収入
  Briefcase,      // 給与・仕事
  // その他
  MoreHorizontal, // その他
  Star,           // お気に入り
};

export const ICON_NAMES = Object.keys(ICON_COMPONENTS);

export const getCategoryIcon = (iconName: string, size: number = 16) => {
  const IconComponent = ICON_COMPONENTS[iconName];
  if (IconComponent) {
    return createElement(IconComponent, { size });
  }
  return createElement(Tag, { size });
};
