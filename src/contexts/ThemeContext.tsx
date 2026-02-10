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

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(DEFAULT_THEME);
  const [isLoaded, setIsLoaded] = useState(false);

  // マウント時に localStorage からテーマを読み込む
  useEffect(() => {
    const theme = loadThemeFromStorage();
    setCurrentTheme(theme);
    setIsLoaded(true);
  }, []);

  const handleSetTheme = (theme: ThemeColor): void => {
    setCurrentTheme(theme);
    saveThemeToStorage(theme);
  };

  if (!isLoaded) {
    return <>{children}</>;
  }

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
