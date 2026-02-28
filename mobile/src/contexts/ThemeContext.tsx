import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextValue {
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
