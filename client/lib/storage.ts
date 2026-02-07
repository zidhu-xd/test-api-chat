import * as SecureStore from "expo-secure-store";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

const PAIRING_KEY = "pairing_data";
const DEVICE_ID_KEY = "device_id";
const UNLOCK_USED_KEY = "unlock_used";
const PASSCODE_KEY = "calculator_passcode";
const DEFAULT_PASSCODE = "1234";

export async function getPasscode(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(PASSCODE_KEY);
    return stored || DEFAULT_PASSCODE;
  } catch {
    return DEFAULT_PASSCODE;
  }
}

export async function setPasscode(passcode: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PASSCODE_KEY, passcode);
  } catch {}
}

export interface PairingData {
  pairId: string;
  deviceId: string;
  partnerDeviceId: string;
  pairedAt: string;
}

// Generate a unique device ID
export async function getDeviceId(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) return stored;

    let deviceId: string;
    if (Platform.OS === "android" && Application.getAndroidId) {
      deviceId = Application.getAndroidId() || "";
    } else if (Platform.OS === "ios") {
      deviceId = (await Application.getIosIdForVendorAsync()) || "";
    } else {
      deviceId = "";
    }

    if (!deviceId) {
      deviceId = Crypto.randomUUID();
    }

    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch {
    const fallback = Crypto.randomUUID();
    try {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, fallback);
    } catch {}
    return fallback;
  }
}

// Check if unlock code has been used (first time only)
export async function hasUnlockBeenUsed(): Promise<boolean> {
  try {
    const used = await SecureStore.getItemAsync(UNLOCK_USED_KEY);
    return used === "true";
  } catch {
    return false;
  }
}

// Mark unlock as used
export async function markUnlockUsed(): Promise<void> {
  try {
    await SecureStore.setItemAsync(UNLOCK_USED_KEY, "true");
  } catch {}
}

// Get pairing data
export async function getPairingData(): Promise<PairingData | null> {
  try {
    const data = await SecureStore.getItemAsync(PAIRING_KEY);
    if (data) {
      return JSON.parse(data) as PairingData;
    }
    return null;
  } catch {
    return null;
  }
}

// Save pairing data
export async function savePairingData(data: PairingData): Promise<void> {
  try {
    await SecureStore.setItemAsync(PAIRING_KEY, JSON.stringify(data));
  } catch {}
}

// Check if device is paired
export async function isPaired(): Promise<boolean> {
  const data = await getPairingData();
  return data !== null;
}

// Clear all data (for testing)
export async function clearAllData(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PAIRING_KEY);
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    await SecureStore.deleteItemAsync(UNLOCK_USED_KEY);
  } catch {}
}
