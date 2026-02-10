import type { ThemeColor, ThemeColorPalette } from '../types';

// テーマカラーの定義
export const THEME_COLORS = {
  blue: {
    name: 'ブルー',
    palette: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    } as ThemeColorPalette,
  },
  red: {
    name: 'レッド',
    palette: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    } as ThemeColorPalette,
  },
  green: {
    name: 'グリーン',
    palette: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#134e4a',
    } as ThemeColorPalette,
  },
  yellow: {
    name: 'イエロー',
    palette: {
      50: '#fefce8',
      100: '#fef3c7',
      200: '#fde047',
      300: '#facc15',
      400: '#eab308',
      500: '#ca8a04',
      600: '#a16207',
      700: '#854d0e',
      800: '#713f12',
      900: '#54340e',
    } as ThemeColorPalette,
  },
  purple: {
    name: 'パープル',
    palette: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    } as ThemeColorPalette,
  },
  pink: {
    name: 'ピンク',
    palette: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f8b4d6',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    } as ThemeColorPalette,
  },
  cyan: {
    name: 'シアン',
    palette: {
      50: '#ecf0ff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    } as ThemeColorPalette,
  },
  indigo: {
    name: 'インディゴ',
    palette: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    } as ThemeColorPalette,
  },
  rose: {
    name: 'ローズ',
    palette: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    } as ThemeColorPalette,
  },
  teal: {
    name: 'ティール',
    palette: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#134e4a',
      900: '#0f3f3a',
    } as ThemeColorPalette,
  },
  orange: {
    name: 'オレンジ',
    palette: {
      50: '#fff7ed',
      100: '#fed7aa',
      200: '#fdba74',
      300: '#fb923c',
      400: '#f97316',
      500: '#ea580c',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    } as ThemeColorPalette,
  },
  lime: {
    name: 'ライム',
    palette: {
      50: '#f7fee7',
      100: '#ecfccb',
      200: '#d9f99d',
      300: '#bef264',
      400: '#a3e635',
      500: '#84cc16',
      600: '#65a30d',
      700: '#4d7c0f',
      800: '#3f6212',
      900: '#365314',
    } as ThemeColorPalette,
  },
  sky: {
    name: 'スカイ',
    palette: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c3d66',
    } as ThemeColorPalette,
  },
} as const;

export type ThemeDefinition = typeof THEME_COLORS[ThemeColor];

/**
 * テーマカラーに対応する色パレットを取得
 */
export const getThemePalette = (theme: ThemeColor): ThemeColorPalette => {
  return THEME_COLORS[theme].palette;
};

/**
 * テーマカラーの表示名を取得
 */
export const getThemeName = (theme: ThemeColor): string => {
  return THEME_COLORS[theme].name;
};

/**
 * すべてのテーマカラーのリストを取得
 */
export const getAllThemes = (): Array<{ value: ThemeColor; name: string }> => {
  return Object.entries(THEME_COLORS).map(([key, value]) => ({
    value: key as ThemeColor,
    name: value.name,
  }));
};

/**
 * テーマカラーに基づいた推奨色をランダムに取得
 */
export const getRecommendedColorFromTheme = (theme: ThemeColor): string => {
  const palette = getThemePalette(theme);
  const colors = [palette[500], palette[600], palette[700]];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * テーマカラーに基づいた全推奨色リストを取得
 */
export const getRecommendedColorsFromTheme = (theme: ThemeColor): string[] => {
  const palette = getThemePalette(theme);
  return [palette[400], palette[500], palette[600], palette[700]];
};
