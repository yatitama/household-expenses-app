import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ThemeColor, ThemeSettings } from '../types';
import { THEME_COLORS } from '../utils/themes';

interface ThemeContextType {
  currentTheme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme_settings';
const DEFAULT_THEME: ThemeColor = 'blue';

/**
 * テーマの初期設定を localStorage から読み込む
 */
const loadThemeFromStorage = (): ThemeColor => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const settings: ThemeSettings = JSON.parse(stored);
      if (settings.currentTheme && THEME_COLORS[settings.currentTheme]) {
        return settings.currentTheme;
      }
    }
  } catch (error) {
    console.warn('Failed to load theme settings:', error);
  }
  return DEFAULT_THEME;
};

/**
 * テーマを localStorage に保存
 */
const saveThemeToStorage = (theme: ThemeColor): void => {
  try {
    const settings: ThemeSettings = { currentTheme: theme };
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save theme settings:', error);
  }
};

/**
 * CSS 変数を使用してテーマカラーをドキュメントに適用
 */
const applyThemeToCSSVariables = (theme: ThemeColor): void => {
  const palette = THEME_COLORS[theme].palette;
  const root = document.documentElement;

  // テーマカラーの各段階を CSS 変数に設定
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });

  // プライマリカラー（UI 要素で使用）を設定
  root.style.setProperty('--theme-primary', palette[500]);
  root.style.setProperty('--theme-primary-dark', palette[600]);
  root.style.setProperty('--theme-primary-light', palette[400]);

  // data 属性を設定（CSS で参照可能）
  root.setAttribute('data-theme', theme);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(() => {
    return loadThemeFromStorage();
  });

  // マウント時に CSS 変数を適用
  useEffect(() => {
    applyThemeToCSSVariables(currentTheme);
  }, [currentTheme]);

  const handleSetTheme = (theme: ThemeColor): void => {
    setCurrentTheme(theme);
    saveThemeToStorage(theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * テーマコンテキストを使用するカスタムHook
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
