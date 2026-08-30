import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/core/logging/logger';

const PREFIX = '@amrutam:';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.error('Storage get failed', { key, error });
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      logger.error('Storage set failed', { key, error });
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${key}`);
    } catch (error) {
      logger.error('Storage remove failed', { key, error });
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(k => k.startsWith(PREFIX));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      logger.error('Storage clear failed', { error });
    }
  },
};
