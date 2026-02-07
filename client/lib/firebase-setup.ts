import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getFCMToken, setFCMToken, getDeviceId, getPairingData } from "./storage";
import { registerFCMToken } from "./api";

/**
 * Get FCM token from Expo notifications
 * This is the native Firebase token that Firebase Cloud Messaging uses
 */
export async function getExpoFCMToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log("[Firebase] FCM not available on web");
    return null;
  }

  try {
    // Request notification permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const newStatus = await Notifications.requestPermissionsAsync();
      if (newStatus.status !== "granted") {
        console.log("[Firebase] Notification permission denied");
        return null;
      }
    }

    // Get the token from Expo (which maps to Firebase FCM)
    const projectId = Constants.expoConfig?.extra?.projectId;
    if (!projectId) {
      console.warn("[Firebase] Project ID not found in expo config");
    }

    // For Expo Go / EAS, get the push token
    const expoPushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId || "calc-xd",
      })
    ).data;

    console.log("[Firebase] Expo push token obtained:", {
      token: expoPushTokenString.substring(0, 20) + "...",
    });

    return expoPushTokenString;
  } catch (error) {
    console.error("[Firebase] Failed to get FCM token:", error);
    return null;
  }
}

/**
 * Initialize Firebase setup for push notifications
 * Should be called once when user opens the app after pairing
 */
export async function initializeFirebaseNotifications(): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const pairingData = await getPairingData();

    // Only proceed if device is paired
    if (!pairingData) {
      console.log("[Firebase] Device not paired yet, skipping FCM setup");
      return false;
    }

    // Check if we already have a token
    const existingToken = await getFCMToken();
    if (existingToken) {
      console.log("[Firebase] FCM token already registered");
      return true;
    }

    // Get new FCM token
    const fcmToken = await getExpoFCMToken();
    if (!fcmToken) {
      console.warn("[Firebase] Could not obtain FCM token");
      return false;
    }

    // Register token with server
    const response = await registerFCMToken(
      deviceId,
      pairingData.pairId,
      fcmToken
    );

    if (response.success) {
      // Save locally for reference
      await setFCMToken(fcmToken);
      console.log("[Firebase] FCM token registered successfully");
      return true;
    } else {
      console.error("[Firebase] Failed to register FCM token:", response.error);
      return false;
    }
  } catch (error) {
    console.error("[Firebase] Initialize failed:", error);
    return false;
  }
}

/**
 * Handle incoming notification
 * This is called when notification arrives while app is in foreground
 */
export function setupNotificationHandlers() {
  if (Platform.OS === "web") return;

  // Set notification handler to show alerts even when app is in focus
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Listen for notifications received in foreground
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("[Firebase] Notification received:", {
        title: notification.request.content.title,
        body: notification.request.content.body,
      });
    }
  );

  return () => subscription.remove();
}

export default {
  getExpoFCMToken,
  initializeFirebaseNotifications,
  setupNotificationHandlers,
};
