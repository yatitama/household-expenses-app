import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './theme';

/**
 * グレースケール固定のテーマプロバイダー
 * CSS 変数でグレースケールパレットを適用
 */
const applyGrayscaleTheme = (): void => {
  const root = document.documentElement;

  // グレースケールパレットの定義
  const grayscalePalette = {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  };

  // CSS 変数を設定
  Object.entries(grayscalePalette).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });

  // プライマリカラー（グレースケール）
  root.style.setProperty('--theme-primary', grayscalePalette[700]);
  root.style.setProperty('--theme-primary-dark', grayscalePalette[800]);
  root.style.setProperty('--theme-primary-light', grayscalePalette[500]);

  // data 属性を設定
  root.setAttribute('data-theme', 'grayscale');
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // マウント時に CSS 変数を適用
  useEffect(() => {
    applyGrayscaleTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme: 'grayscale', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
