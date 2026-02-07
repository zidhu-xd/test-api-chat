import admin from "firebase-admin";
import * as path from "path";

// Initialize Firebase Admin SDK
let initialized = false;

export function initializeFirebase() {
  if (initialized) return;

  try {
    const serviceAccountPath = path.resolve(
      process.cwd(),
      "server",
      "firebase-config.json"
    );
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    initialized = true;
    console.log("[Firebase] Initialized successfully");
  } catch (error) {
    console.error("[Firebase] Initialization failed:", error);
    throw error;
  }
}

/**
 * Send notification via Firebase Cloud Messaging
 */
export async function sendFCMNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  if (!initialized) {
    console.warn("[Firebase] Not initialized, skipping notification");
    return false;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: deviceToken,
    };

    const response = await admin.messaging().send(message as any);
    console.log("[Firebase] Notification sent:", {
      messageId: response,
      title,
      body,
    });
    return true;
  } catch (error) {
    console.error("[Firebase] Failed to send notification:", error);
    return false;
  }
}

/**
 * Send multicast notification (to multiple devices)
 */
export async function sendMulticastFCMNotification(
  deviceTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> {
  if (!initialized || deviceTokens.length === 0) {
    console.warn("[Firebase] Not initialized or no tokens provided");
    return { successCount: 0, failureCount: deviceTokens.length };
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    const response = await admin
      .messaging()
      .sendMulticast({ ...message, tokens: deviceTokens } as any);

    console.log("[Firebase] Multicast notification sent:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
      title,
      body,
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("[Firebase] Failed to send multicast notification:", error);
    return { successCount: 0, failureCount: deviceTokens.length };
  }
}

export default admin;
