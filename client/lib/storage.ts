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
const SELECTED_ICON_KEY = "selected_app_icon";
const DEFAULT_PASSCODE = "1234";
const DEFAULT_ICON = "calculator";

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

export async function getThemeColors(): Promise<{
  isDark: boolean;
  background: string;
  primary: string;
  accent: string;
}> {
  try {
    const stored = await AsyncStorage.getItem(THEME_COLORS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  // Default dark theme
  return {
    isDark: true,
    background: "#0B0D10",
    primary: "#FFFFFF",
    accent: "#4F8BFF",
  };
}

export async function setThemeColors(colors: {
  isDark: boolean;
  background: string;
  primary: string;
  accent: string;
}): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_COLORS_KEY, JSON.stringify(colors));
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

export async function getSelectedIcon(): Promise<string> {
  try {
    return await AsyncStorage.getItem(SELECTED_ICON_KEY) || DEFAULT_ICON;
  } catch {
    return DEFAULT_ICON;
  }
}

export async function setSelectedIcon(icon: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTED_ICON_KEY, icon);
  } catch {}
}

export async function fullDeviceReset(): Promise<void> {
  // Clear all AsyncStorage data
  await AsyncStorage.clear();
  // Delete device ID from secure store
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  } catch {}
  // Generate a NEW device ID for fresh start
  const newDeviceId = Crypto.randomUUID();
  try {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
  } catch {}
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  } catch {}
}
