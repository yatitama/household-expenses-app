import { createContext } from 'react';
import type { ThemeColor } from '../types';

export interface ThemeContextType {
  currentTheme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
