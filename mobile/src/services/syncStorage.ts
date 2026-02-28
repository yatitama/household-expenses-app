import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * localStorage と同じ同期 API を持つストレージアダプター。
 * 起動時に initialize() を一度呼ぶことで、以降は同期的な読み書きが可能。
 * 書き込みは AsyncStorage に非同期で反映される（fire-and-forget）。
 */
class SyncStorage {
  private cache = new Map<string, string>();

  async initialize(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys.length > 0) {
        // AsyncStorage v2 (Expo SDK 55) では multiGet がない場合がある
        const entries = await Promise.all(
          (keys as string[]).map(async (k) => [k, await AsyncStorage.getItem(k)] as [string, string | null]),
        );
        for (const [key, value] of entries) {
          if (value !== null) {
            this.cache.set(key, value);
          }
        }
      }
    } catch (e) {
      console.warn('SyncStorage.initialize failed:', e);
    }
  }

  getItem(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    void AsyncStorage.setItem(key, value).catch((e) =>
      console.warn('SyncStorage.setItem failed:', e),
    );
  }

  removeItem(key: string): void {
    this.cache.delete(key);
    void AsyncStorage.removeItem(key).catch((e) =>
      console.warn('SyncStorage.removeItem failed:', e),
    );
  }

  clear(): void {
    this.cache.clear();
    void AsyncStorage.clear().catch((e) =>
      console.warn('SyncStorage.clear failed:', e),
    );
  }
}

export const syncStorage = new SyncStorage();
