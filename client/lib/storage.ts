import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from "expo-secure-store";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

const PAIRING_KEY = "pairing_data";
const DEVICE_ID_KEY = "device_id";
const UNLOCK_USED_KEY = "unlock_used";
const PASSCODE_KEY = "calculator_passcode";
const THEME_KEY = "app_theme";
const DEFAULT_PASSCODE = "1234";

export interface PairingData {
  pairId: string;
  deviceId: string;
  partnerDeviceId: string;
  pairedAt: string;
}

export async function getPasscode(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(PASSCODE_KEY);
    return stored || DEFAULT_PASSCODE;
  } catch {
    return DEFAULT_PASSCODE;
  }
}

export async function setPasscode(passcode: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PASSCODE_KEY, passcode);
  } catch {}
}

export async function getTheme(): Promise<string> {
  try {
    return await AsyncStorage.getItem(THEME_KEY) || 'system';
  } catch {
    return 'system';
  }
}

export async function setTheme(theme: string): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export async function getDeviceId(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) return stored;
    let deviceId = Platform.OS === "android" && Application.getAndroidId ? Application.getAndroidId() : Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch {
    return Crypto.randomUUID();
  }
}

export async function hasUnlockBeenUsed(): Promise<boolean> {
  const used = await AsyncStorage.getItem(UNLOCK_USED_KEY);
  return used === "true";
}

export async function markUnlockUsed(): Promise<void> {
  await AsyncStorage.setItem(UNLOCK_USED_KEY, "true");
}

export async function getPairingData(): Promise<PairingData | null> {
  const data = await AsyncStorage.getItem(PAIRING_KEY);
  return data ? JSON.parse(data) : null;
}

export async function savePairingData(data: PairingData): Promise<void> {
  await AsyncStorage.setItem(PAIRING_KEY, JSON.stringify(data));
}

export async function isPaired(): Promise<boolean> {
  return (await getPairingData()) !== null;
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
}
