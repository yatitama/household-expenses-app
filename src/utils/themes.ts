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
