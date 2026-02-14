import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './theme';

/**
 * セピアカラー固定のテーマプロバイダー
 * CSS 変数でセピアパレットを適用
 */
const applySepiasTheme = (): void => {
  const root = document.documentElement;

  // セピアパレットの定義
  const sepiaPalette = {
    50: '#f5f1e8',
    100: '#ede6da',
    200: '#e8dcc8',
    300: '#dccfb2',
    400: '#c9b89a',
    500: '#a68860',
    600: '#8b7355',
    700: '#6b5344',
    800: '#4a3728',
    900: '#2d1f12',
  };

  // CSS 変数を設定
  Object.entries(sepiaPalette).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });

  // プライマリカラー（セピア）
  root.style.setProperty('--theme-primary', sepiaPalette[700]);
  root.style.setProperty('--theme-primary-dark', sepiaPalette[800]);
  root.style.setProperty('--theme-primary-light', sepiaPalette[500]);

  // data 属性を設定
  root.setAttribute('data-theme', 'sepia');
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // マウント時に CSS 変数を適用
  useEffect(() => {
    applySepiasTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme: 'sepia', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
