# Firebase Cloud Messaging (FCM) Setup Guide

## Overview

This guide covers how Firebase Cloud Messaging (FCM) has been integrated into your Calculator Secret Chat app for reliable push notifications across iOS and Android.

## What's Been Set Up

### Backend Integration (Server-Side)

#### 1. Firebase Admin SDK
- **File**: `server/firebase.ts`
- **Functions**:
  - `initializeFirebase()` - Initializes Firebase Admin SDK
  - `sendFCMNotification()` - Sends notification to single device
  - `sendMulticastFCMNotification()` - Sends to multiple devices

#### 2. Firebase Configuration
- **File**: `server/firebase-config.json`
- **Contains**: Service account credentials with signing key
- **Used for**: Server authentication with Firebase Cloud Messaging

#### 3. Environment Setup
- **API Key**: `AIzaSyCm0mVdE971ud4ECFlCETHtNf6MM66E8cM`
- **Sender ID**: `161811534652`
- **Project ID**: `calc-xd`

### Client Integration (App-Side)

#### 1. Firebase Client Setup
- **File**: `client/lib/firebase-setup.ts`
- **Functions**:
  - `getExpoFCMToken()` - Gets FCM token from device
  - `initializeFirebaseNotifications()` - Initializes FCM after pairing
  - `setupNotificationHandlers()` - Handles incoming notifications

#### 2. Storage Integration
- **File**: `client/lib/storage.ts`
- **Functions**:
  - `getFCMToken()` - Retrieves stored FCM token
  - `setFCMToken()` - Saves FCM token locally
  - `clearFCMToken()` - Removes FCM token on logout

#### 3. API Endpoint
- **Endpoint**: `/api/fcm/register`
- **Method**: POST
- **Payload**: `{ deviceId, pairId, fcmToken }`
- **Purpose**: Register device token with server

## How It Works

### Flow Diagram

```
User Opens App
    ↓
Device Paired?
    ├─ NO → Show Calculator/Pairing UI
    └─ YES → Proceed to Chat
        ↓
    Request Notification Permissions
        ↓
    Get Expo FCM Token (maps to Firebase)
        ↓
    Register Token with Server (/api/fcm/register)
        ↓
    Save Token Locally (AsyncStorage)
        ↓
    Ready to Receive Push Notifications
```

### When Message Arrives

```
Device A (Chat) sends message
    ↓
Server receives message
    ↓
Server checks if Device B has FCM token registered
    ├─ NO FCM → Message waits in queue (polled by client)
    └─ YES FCM → Send FCM notification immediately
        ↓
    "New XD Calculations Available! Check now"
        ↓
    Device B receives notification
        ├─ App in foreground → Alert shown immediately
        └─ App in background → Notification in notification center
            ↓
        User taps notification → Opens Calculator screen
```

## Server-Side Implementation

### Initialize Firebase (in server/routes.ts)

```typescript
import { initializeFirebase, sendFCMNotification } from "./firebase";

// Call once on server startup
export async function registerRoutes(app: express.Application) {
  // Initialize Firebase
  initializeFirebase();
  
  // ... rest of routes
}
```

### Send Notification to User

```typescript
import { sendFCMNotification } from "./firebase";

// When you want to send notification
const success = await sendFCMNotification(
  userFCMToken,
  "New XD Calculations Available!",
  "Check now",
  { screen: "Chat", messageId: "123" }
);

if (success) {
  console.log("Notification sent via Firebase");
} else {
  console.log("FCM failed, client will poll for messages");
}
```

### Send to Multiple Users

```typescript
import { sendMulticastFCMNotification } from "./firebase";

const result = await sendMulticastFCMNotification(
  [token1, token2, token3],
  "Group Notification",
  "New message in chat",
  { type: "group_message" }
);

console.log(`Sent to ${result.successCount}, failed: ${result.failureCount}`);
```

## Client-Side Implementation

### Initialize on App Start

Add this to your main App.tsx or root navigation:

```typescript
import { initializeFirebaseNotifications, setupNotificationHandlers } from "@/lib/firebase-setup";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // Setup notification handlers
    const unsubscribe = setupNotificationHandlers();
    
    // Initialize FCM after user pairs
    initializeFirebaseNotifications().then((success) => {
      if (success) {
        console.log("FCM initialized successfully");
      }
    });
    
    return () => unsubscribe?.();
  }, []);
  
  // ... rest of app
}
```

### Handle Notification Taps

```typescript
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";

export function ChatScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle when user taps notification
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data.screen;
        if (screen === "Chat") {
          // Already on chat, just reload messages
          refetchMessages();
        } else if (screen === "Calculator") {
          // Navigate to calculator
          navigation.reset({
            index: 0,
            routes: [{ name: "Calculator" }],
          });
        }
      }
    );

    return () => subscription.remove();
  }, [navigation]);
}
```

## Token Management

### Lifecycle

1. **On First Pairing**
   - User completes pairing flow
   - `initializeFirebaseNotifications()` is called
   - Device requests notification permissions
   - FCM token is obtained and registered

2. **During App Usage**
   - Token is stored in AsyncStorage
   - Server stores token in memory/database
   - Messages trigger FCM pushes using this token

3. **On Logout/Reset**
   - `clearFCMToken()` removes local token
   - Server should remove pairing (which removes token)
   - Device no longer receives FCM notifications

### Token Refresh

Expo/Firebase automatically refreshes tokens periodically. To handle manual refresh:

```typescript
import { initializeFirebaseNotifications } from "@/lib/firebase-setup";

// After settings change or manual refresh
async function refreshFCMToken() {
  const success = await initializeFirebaseNotifications();
  if (success) {
    console.log("FCM token refreshed");
  }
}
```

## Debugging

### Check if FCM is Working

1. **Verify Token Registered**
   ```typescript
   import { getFCMToken } from "@/lib/storage";
   
   const token = await getFCMToken();
   console.log("FCM Token:", token);
   ```

2. **Test Notification Send**
   ```typescript
   // From server console or API endpoint
   const testToken = "your_test_device_token";
   await sendFCMNotification(
     testToken,
     "Test",
     "FCM is working!",
     { test: "true" }
   );
   ```

3. **Monitor Server Logs**
   ```
   [Firebase] Notification sent: {
     messageId: "abc123...",
     title: "...",
     body: "..."
   }
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| Notifications not received | Check notification permissions granted in settings |
| Token not registered | Verify device is paired first |
| FCM fails silently | Check Firebase credentials in `firebase-config.json` |
| Notifications only work in foreground | Normal behavior - background handling requires more setup |

## Fallback: Local Polling

If FCM fails for any reason:
1. Notifications are not sent via FCM
2. Client continues polling `/api/messages` every 1 second
3. New messages are discovered and displayed
4. User doesn't see push notification but sees message when checking app

This ensures reliability - FCM is an optimization, not required.

## Firebase Credentials Security

**IMPORTANT**: The `firebase-config.json` contains sensitive credentials.

In production:
1. Load from environment variables instead of file
2. Never commit to public repositories
3. Rotate keys periodically
4. Restrict key usage to FCM only

```typescript
// Production approach
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  // ... other fields
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
```

## Testing Notifications

### Manual Test from Server

```bash
# Send test notification
curl -X POST http://localhost:5000/api/fcm/test \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "ExponentPushToken[...]",
    "title": "Test",
    "body": "Testing FCM"
  }'
```

### From App Code

```typescript
import { initializeFirebaseNotifications, getExpoFCMToken } from "@/lib/firebase-setup";

async function testFCM() {
  const token = await getExpoFCMToken();
  console.log("Your FCM Token:", token);
  
  // Send to your server for testing
  fetch("/api/fcm/test", {
    method: "POST",
    body: JSON.stringify({ deviceToken: token })
  });
}
```

## Next Steps

1. **Initialize on App Launch**
   - Add Firebase setup to your App.tsx

2. **Send Notifications on Message**
   - Update `/api/messages` endpoint to send FCM when appropriate

3. **Handle Notification Taps**
   - Add response listener to navigate to correct screen

4. **Monitor & Debug**
   - Check logs to verify FCM is working
   - Use test endpoint to verify delivery

5. **Production Hardening**
   - Move credentials to environment variables
   - Add error handling for failed FCM sends
   - Implement token refresh logic
