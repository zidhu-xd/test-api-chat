# Firebase Cloud Messaging Implementation Summary

## What's Been Set Up

### Backend Components

1. **Firebase Service** (`server/firebase.ts`)
   - Initialize Firebase Admin SDK
   - Send single device notifications
   - Send multicast (batch) notifications
   - Error handling and logging

2. **Firebase Config** (`server/firebase-config.json`)
   - Service account credentials
   - Private key for signing requests
   - Project configuration

3. **Integration Points**
   - `/api/fcm/register` - Register device FCM token
   - Server-side notification sending function
   - Token storage system (in-memory or database)

### Client Components

1. **Firebase Setup** (`client/lib/firebase-setup.ts`)
   - Get Expo FCM token (maps to Firebase)
   - Initialize Firebase after pairing
   - Setup notification handlers
   - Request permissions

2. **Storage Functions** (`client/lib/storage.ts`)
   - Store FCM token locally
   - Retrieve FCM token
   - Clear token on logout

3. **API Integration** (`client/lib/api.ts`)
   - Register token with server
   - Handle responses

## Files Created

| File | Purpose |
|------|---------|
| `server/firebase.ts` | Firebase Admin SDK integration |
| `server/firebase-config.json` | Service account credentials |
| `client/lib/firebase-setup.ts` | Client-side FCM initialization |
| `FIREBASE_FCM_SETUP_GUIDE.md` | Complete setup documentation |
| `FIREBASE_SERVER_INTEGRATION.md` | Server implementation guide |

## Files Modified

| File | Changes |
|------|---------|
| `package.json` | Added `firebase-admin` dependency |
| `client/lib/storage.ts` | Added FCM token storage functions |
| `client/lib/api.ts` | Added FCM registration endpoint |

## How to Complete Integration

### Step 1: Initialize Firebase in Server Routes

Open `server/routes.ts` and add:

```typescript
import { initializeFirebase, sendFCMNotification } from "./firebase";

export async function registerRoutes(app: express.Application) {
  initializeFirebase();
  
  // ... rest of your routes
}
```

### Step 2: Add Token Storage

Add this in your server routes:

```typescript
const pairFCMTokens = new Map<string, { device1Token?: string; device2Token?: string }>();

app.post("/api/fcm/register", (req: Request, res: Response) => {
  const { deviceId, pairId, fcmToken } = req.body;
  
  if (!pairFCMTokens.has(pairId)) {
    pairFCMTokens.set(pairId, {});
  }
  
  const pair = pairs.get(pairId);
  const tokens = pairFCMTokens.get(pairId)!;
  
  if (pair.device1Id === deviceId) {
    tokens.device1Token = fcmToken;
  } else if (pair.device2Id === deviceId) {
    tokens.device2Token = fcmToken;
  }
  
  console.log(`[FCM] Token registered for pair ${pairId}`);
  res.json({ success: true });
});
```

### Step 3: Send Notifications on Message

When a message arrives, send FCM:

```typescript
if (newMessages.length > 0) {
  const pairTokens = pairFCMTokens.get(pairId);
  const token = pairTokens?.device1Token || pairTokens?.device2Token;
  
  if (token) {
    await sendFCMNotification(
      token,
      "New XD Calculations Available!",
      "Check now",
      { screen: "Chat", pairId }
    );
  }
}
```

### Step 4: Initialize on App Launch

In your main Chat/App component, add:

```typescript
import { initializeFirebaseNotifications, setupNotificationHandlers } from "@/lib/firebase-setup";
import { useEffect } from "react";

export default function ChatScreen() {
  useEffect(() => {
    // Setup notification handlers
    const unsubscribe = setupNotificationHandlers();
    
    // Initialize FCM
    initializeFirebaseNotifications();
    
    return () => unsubscribe?.();
  }, []);
  
  // ... rest of component
}
```

## Key Features

### 1. Automatic Fallback
- If FCM fails, client continues polling
- Messages are still delivered, just without push notification
- No message loss

### 2. Smart Token Management
- Tokens stored locally on device
- Tokens tracked on server per pair
- Automatic cleanup on unpair
- Optional refresh on token changes

### 3. Flexible Notification Strategies
- Send on every message
- Send only for first unread
- Rate limit to avoid spam
- Custom notification content

### 4. Secure Credentials
- Service account in separate file
- Can be loaded from environment variables
- No credentials in code

## Testing

### Quick Test

1. Get your FCM token:
```typescript
import { getExpoFCMToken } from "@/lib/firebase-setup";
const token = await getExpoFCMToken();
console.log(token);
```

2. Send test notification from server:
```bash
curl -X POST http://localhost:5000/api/fcm/test \
  -H "Content-Type: application/json" \
  -d '{"deviceToken":"YOUR_TOKEN_HERE","title":"Test","body":"FCM Works!"}'
```

### Debug Logs

Enable debug logging to verify setup:
```typescript
// In firebase-setup.ts
console.log("[Firebase] Token obtained:", token);
console.log("[Firebase] FCM initialized successfully");

// In firebase.ts
console.log("[Firebase] Notification sent:", messageId);
```

## Security Notes

### Credentials

The `firebase-config.json` contains:
- Private signing key
- Service account email
- Project ID

**Never commit to public repository!**

For production:
```typescript
// Load from environment
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  // ... rest
};
```

### Token Security

- Tokens are app-specific
- Each device gets unique token
- Tokens can be revoked by removing from storage
- No sensitive data in tokens

## Architecture

### Flow

```
App Opens
    ↓
Device Paired?
    ├─ NO → Show Calculator
    └─ YES → Initialize Firebase
        ↓
    Get Notification Permissions
        ↓
    Get FCM Token
        ↓
    Register Token with Server
        ↓
    Save Token Locally
        ↓
    Ready for Notifications

Partner Sends Message
    ↓
Server Receives
    ↓
Check: Does Partner Have FCM Token?
    ├─ NO → Message in queue (polled)
    └─ YES → Send FCM Notification
        ↓
    Device Receives Push
        ├─ App Open → Alert shown
        └─ App Closed → Notification center
            ↓
        User Taps → Navigate to Chat
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No notifications received | Check permissions, verify token registered |
| Token not registered | Ensure device is paired before initializing |
| Firebase credentials error | Check firebase-config.json, verify file exists |
| Notifications only in foreground | Normal - background delivery requires more setup |
| Token not saved locally | Check AsyncStorage permissions |
| Server doesn't send FCM | Verify sendFCMNotification() is called with valid token |

## Next Steps

1. ✅ Backend Firebase setup complete
2. ✅ Client Firebase setup complete
3. ✅ Documentation complete
4. ⏳ Integrate in server/routes.ts (follow FIREBASE_SERVER_INTEGRATION.md)
5. ⏳ Initialize in ChatScreen/App component
6. ⏳ Test end-to-end
7. ⏳ Move credentials to environment variables for production

## Additional Resources

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Cloud Messaging](https://docs.expo.dev/push-notifications/push-notification-setup/)

## Support

For issues or questions:
1. Check debug logs in console
2. Review error messages in server logs
3. Verify FCM token with test endpoint
4. Check Firebase Console for delivery stats
5. Review security rules in Firebase project
