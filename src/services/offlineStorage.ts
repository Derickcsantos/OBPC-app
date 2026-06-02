import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

const PREFIX = 'obpcapp:v1:';

const webStorage = () => {
  if (Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage;
  }

  return null;
};

export const getCachedValue = async <T>(key: string): Promise<T | null> => {
  try {
    const storageKey = `${PREFIX}${key}`;
    const raw = webStorage()?.getItem(storageKey) ?? (await AsyncStorage.getItem(storageKey));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.error('Erro ao ler cache offline:', error);
    return null;
  }
};

export const setCachedValue = async <T>(key: string, value: T): Promise<void> => {
  try {
    const storageKey = `${PREFIX}${key}`;
    const raw = JSON.stringify(value);
    const storage = webStorage();

    if (storage) {
      storage.setItem(storageKey, raw);
      return;
    }

    await AsyncStorage.setItem(storageKey, raw);
  } catch (error) {
    console.error('Erro ao salvar cache offline:', error);
  }
};

export const isOnline = async (): Promise<boolean> => {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return true;
  }
};

export const isWifi = async (): Promise<boolean> => {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.type === Network.NetworkStateType.WIFI);
  } catch {
    return false;
  }
};

export const getQueue = async <T>(key: string): Promise<T[]> => {
  return (await getCachedValue<T[]>(`queue:${key}`)) ?? [];
};

export const setQueue = async <T>(key: string, value: T[]): Promise<void> => {
  await setCachedValue(`queue:${key}`, value);
};

export const enqueueValue = async <T>(key: string, value: T): Promise<void> => {
  const queue = await getQueue<T>(key);
  queue.push(value);
  await setQueue(key, queue);
};
