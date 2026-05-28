import * as SecureStore from 'expo-secure-store';

/**
 * Saves a key-value pair securely inside the iOS Keychain or Android Keystore.
 */
export async function saveSecurely(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`[SecureStore] Save Error for key "${key}":`, error);
  }
}

/**
 * Retrieves a securely stored value by its key.
 */
export async function getSecurely(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[SecureStore] Retrieve Error for key "${key}":`, error);
    return null;
  }
}

/**
 * Deletes a securely stored key-value pair.
 */
export async function deleteSecurely(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[SecureStore] Delete Error for key "${key}":`, error);
  }
}
