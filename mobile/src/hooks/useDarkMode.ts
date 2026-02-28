import { useColorScheme } from 'react-native';

export const useDarkMode = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return { isDark };
};
