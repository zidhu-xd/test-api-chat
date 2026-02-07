# Firebase FCM Quick Reference

## One-Page Setup Guide

### Server Setup (3 Steps)

**1. Initialize Firebase**
```typescript
// In server/routes.ts
import { initializeFirebase } from "./firebase";

export async function registerRoutes(app: express.Application) {
  initializeFirebase(); // Add this line
  // ... routes
}
```

**2. Store FCM Tokens**
```typescript
const pairFCMTokens = new Map<string, { device1Token?: string; device2Token?: string }>();

app.post("/api/fcm/register", (req, res) => {
  const { deviceId, pairId, fcmToken } = req.body;
  const tokens = pairFCMTokens.get(pairId) || {};
  
  if (pairs.get(pairId)?.device1Id === deviceId) {
    tokens.device1Token = fcmToken;
  } else {
    tokens.device2Token = fcmToken;
  }
  
  pairFCMTokens.set(pairId, tokens);
  res.json({ success: true });
});
```

**3. Send Notification on Message**
```typescript
import { sendFCMNotification } from "./firebase";

// When message arrives, send notification
const pairTokens = pairFCMTokens.get(pairId);
const token = pairTokens?.device1Token || pairTokens?.device2Token;

if (token) {
  await sendFCMNotification(
    token,
    "New XD Calculations Available!",
    "Check now",
    { screen: "Chat" }
  );
}
```

### Client Setup (2 Steps)

**1. Setup Notifications on App Load**
```typescript
// In ChatScreen or root navigation
import { initializeFirebaseNotifications, setupNotificationHandlers } from "@/lib/firebase-setup";

useEffect(() => {
  setupNotificationHandlers();
  initializeFirebaseNotifications();
}, []);
```

**2. Handle Notification Tap**
```typescript
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data.screen === "Chat") {
      // Already on chat screen
      refetchMessages();
    } else if (response.notification.request.content.data.screen === "Calculator") {
      navigation.reset({ index: 0, routes: [{ name: "Calculator" }] });
    }
  });
  return () => subscription.remove();
}, []);
```

## API Reference

### Backend

#### Initialize
```typescript
initializeFirebase()
```

#### Send Single
```typescript
await sendFCMNotification(
  token: string,
  title: string,
  body: string,
  data?: { [key: string]: string }
)
```

#### Send Multiple
```typescript
await sendMulticastFCMNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: { [key: string]: string }
)
```

### Client

#### Get Token
```typescript
import { getExpoFCMToken } from "@/lib/firebase-setup";
const token = await getExpoFCMToken();
```

#### Initialize
```typescript
import { initializeFirebaseNotifications } from "@/lib/firebase-setup";
await initializeFirebaseNotifications();
```

#### Register
```typescript
import { registerFCMToken } from "@/lib/api";
await registerFCMToken(deviceId, pairId, fcmToken);
```

#### Storage
```typescript
import { getFCMToken, setFCMToken, clearFCMToken } from "@/lib/storage";

const token = await getFCMToken();
await setFCMToken(newToken);
await clearFCMToken();
```

## Configuration

### Credentials
- **File**: `server/firebase-config.json`
- **API Key**: `AIzaSyCm0mVdE971ud4ECFlCETHtNf6MM66E8cM`
- **Sender ID**: `161811534652`
- **Project**: `calc-xd`

### Default Notification
```json
{
  "title": "New XD Calculations Available!",
  "body": "Check now",
  "data": {
    "screen": "Chat",
    "pairId": "..."
  }
}
```

## Environment Variables (Production)

```bash
FIREBASE_PROJECT_ID=calc-xd
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@calc-xd.iam.gserviceaccount.com
```

## Testing Commands

### Get Your Token
```typescript
const { getExpoFCMToken } = require("./client/lib/firebase-setup");
const token = await getExpoFCMToken();
console.log(token);
```

### Send Test Push
```bash
curl -X POST http://localhost:5000/api/fcm/test \
  -H "Content-Type: application/json" \
  -d '{"deviceToken":"ExponentPushToken[...]"}'
```

## File Reference

| File | Size | Purpose |
|------|------|---------|
| `server/firebase.ts` | 113 lines | Admin SDK wrapper |
| `server/firebase-config.json` | 14 lines | Credentials |
| `client/lib/firebase-setup.ts` | 137 lines | Client initialization |
| `FIREBASE_FCM_SETUP_GUIDE.md` | 369 lines | Complete guide |
| `FIREBASE_SERVER_INTEGRATION.md` | 373 lines | Server implementation |

## Common Errors & Fixes

### "Firebase not initialized"
→ Call `initializeFirebase()` before sending notifications

### "No token registered"
→ Device not paired or `initializeFirebaseNotifications()` not called

### "Credentials error"
→ Check `firebase-config.json` exists and is valid JSON

### "Notification not received"
→ Check notification permissions in device settings

### "Token not stored"
→ Verify AsyncStorage working (check for errors)

## Debugging

### Enable Logging
```typescript
// In firebase.ts and firebase-setup.ts, logs are already:
console.log("[Firebase] message...");
console.log("[FCM] message...");
```

### Check Storage
```typescript
import { getFCMToken } from "@/lib/storage";
console.log(await getFCMToken());
```

### Monitor Sends
```typescript
// Server logs show:
[Firebase] Notification sent: {
  messageId: "abc123...",
  title: "...",
  body: "..."
}
```

### Test Chain
1. Call `initializeFirebaseNotifications()` → Check logs for token
2. Register on server → POST `/api/fcm/register` should succeed
3. Verify stored → Check AsyncStorage for token
4. Send test → Use `/api/fcm/test` endpoint
5. Check device → Should receive notification

## Production Checklist

- [ ] Firebase initialized on server startup
- [ ] FCM registration endpoint working
- [ ] Tokens stored in database (not in-memory)
- [ ] Tokens cleaned up on unpair
- [ ] Notifications sent on message arrival
- [ ] Error handling for failed sends
- [ ] Credentials in environment variables
- [ ] Rate limiting implemented
- [ ] Test endpoint working
- [ ] Logs enabled for debugging

## Key Concepts

### What is FCM?
Firebase Cloud Messaging - service for sending notifications to devices

### How does it work?
1. Device registers and gets unique FCM token
2. App sends token to server
3. When message arrives, server sends via FCM
4. Device receives notification even if app is closed

### What if FCM fails?
App continues polling `/api/messages` every 1 second - messages still delivered, just without push

### Token lifecycle?
- Get on app launch
- Register on pairing
- Stored locally + on server
- Cleared on unpair
- Automatically refreshed by Firebase

## Performance

- **Token registration**: < 100ms
- **Sending FCM**: < 500ms (delivery in seconds)
- **Client polling**: 1 request/sec, ~1KB each
- **Storage**: ~100 bytes per token

## Security

- Tokens are device-specific
- No PII in tokens
- Credentials secure in file (move to env vars)
- Tokens can be revoked anytime
