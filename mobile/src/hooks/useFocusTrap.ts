import { useRef } from 'react';
import type { View } from 'react-native';

// React Native ではフォーカストラップは不要。no-op スタブ。
export const useFocusTrap = (_isActive: boolean) => {
  return useRef<View>(null);
};
