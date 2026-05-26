import AsyncStorage from '@react-native-async-storage/async-storage'

export async function saveItem(key: string, value: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('saveItem error', e)
  }
}

export async function loadItem(key: string) {
  try {
    const v = await AsyncStorage.getItem(key)
    return v ? JSON.parse(v) : null
  } catch (e) {
    console.warn('loadItem error', e)
    return null
  }
}

export async function removeItems(keys: string[]) {
  try {
    await AsyncStorage.multiRemove(keys)
  } catch (e) {
    console.warn('removeItems error', e)
  }
}
