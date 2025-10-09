import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn('AsyncStorage getItem error:', error);
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn('AsyncStorage setItem error:', error);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn('AsyncStorage removeItem error:', error);
  }
}

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const value = await getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('AsyncStorage JSON parse error:', error);
    return fallback;
  }
}

export async function setJSON<T>(key: string, data: T): Promise<void> {
  try {
    await setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('AsyncStorage JSON stringify error:', error);
  }
}

