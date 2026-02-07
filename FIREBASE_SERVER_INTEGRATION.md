# Firebase FCM Server Integration Instructions

## Quick Start

### 1. Update server/routes.ts

Add Firebase import at top:

```typescript
import { initializeFirebase, sendFCMNotification } from "./firebase";
```

### 2. Initialize Firebase on Startup

In your `registerRoutes()` function, add this at the beginning:

```typescript
export async function registerRoutes(app: express.Application) {
  // Initialize Firebase Admin SDK
  initializeFirebase();
  
  // ... rest of your routes
}
```

### 3. Store FCM Tokens

Add a new in-memory store for FCM tokens (or use database):

```typescript
// In-memory FCM token storage
// Key: pairId, Value: { device1Token: "...", device2Token: "..." }
const pairFCMTokens = new Map<string, { device1Token?: string; device2Token?: string }>();
```

### 4. Add FCM Registration Endpoint

Add this route to handle FCM token registration:

```typescript
// Register FCM token for push notifications
app.post("/api/fcm/register", (req: Request, res: Response) => {
  const { deviceId, pairId, fcmToken } = req.body;

  if (!deviceId || !pairId || !fcmToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Store the FCM token
  if (!pairFCMTokens.has(pairId)) {
    pairFCMTokens.set(pairId, {});
  }

  const pairTokens = pairFCMTokens.get(pairId)!;
  const pair = pairs.get(pairId);

  if (!pair) {
    return res.status(404).json({ error: "Pair not found" });
  }

  // Determine which device this is
  if (pair.device1Id === deviceId) {
    pairTokens.device1Token = fcmToken;
  } else if (pair.device2Id === deviceId) {
    pairTokens.device2Token = fcmToken;
  } else {
    return res.status(403).json({ error: "Device not in this pair" });
  }

  console.log(`[FCM] Token registered for pair ${pairId.substring(0, 8)}...`);

  res.json({ success: true });
});
```

### 5. Send Notification When Message Arrives

Update your message polling/sending endpoint:

```typescript
app.get("/api/messages", async (req: Request, res: Response) => {
  const { pairId, deviceId } = req.query;

  if (!pairId || !deviceId) {
    return res.status(400).json({ error: "Pair ID and device ID required" });
  }

  const pair = pairs.get(pairId as string);
  if (!pair) {
    return res.status(404).json({ error: "Pair not found" });
  }

  // Determine partner device
  const partnerDeviceId =
    pair.device1Id === deviceId ? pair.device2Id : pair.device1Id;

  // Get messages
  const allMessages = messages.get(pairId as string) || [];

  // Filter unread messages
  const unreadForPartner = allMessages.filter(
    (msg) => msg.senderId === deviceId && !msg.read
  );

  // **NEW: Send FCM notification to partner if they have unread messages**
  if (unreadForPartner.length > 0) {
    const pairTokens = pairFCMTokens.get(pairId as string);
    
    if (pairTokens && partnerDeviceId === pair.device1Id && pairTokens.device1Token) {
      // Send to device 1
      await sendFCMNotification(
        pairTokens.device1Token,
        "New XD Calculations Available!",
        "Check now",
        {
          screen: "Chat",
          pairId: pairId as string,
          messageCount: unreadForPartner.length.toString(),
        }
      );
    } else if (pairTokens && partnerDeviceId === pair.device2Id && pairTokens.device2Token) {
      // Send to device 2
      await sendFCMNotification(
        pairTokens.device2Token,
        "New XD Calculations Available!",
        "Check now",
        {
          screen: "Chat",
          pairId: pairId as string,
          messageCount: unreadForPartner.length.toString(),
        }
      );
    }
  }

  // ... rest of endpoint
  res.json({
    messages: allMessages,
    unread: unreadForPartner.length,
  });
});
```

### 6. Clean Up Tokens on Unpair

Update your unpair endpoint:

```typescript
app.post("/api/pair/unpair", (req: Request, res: Response) => {
  const { pairId, deviceId } = req.body;

  if (!pairId || !deviceId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const pair = pairs.get(pairId);
  if (!pair) {
    return res.status(404).json({ error: "Pair not found" });
  }

  // Remove pairing
  pairs.delete(pairId);
  messages.delete(pairId);
  typingIndicators.delete(pairId);
  
  // **NEW: Remove FCM tokens for this pair**
  pairFCMTokens.delete(pairId);

  console.log(
    `[UNPAIR] Device ${deviceId.substring(0, 8)}... unaired from ${pairId.substring(0, 8)}...`
  );

  res.json({ success: true });
});
```

## Advanced: Database Storage

If using a database instead of in-memory storage:

```typescript
// Database schema example (SQL)
CREATE TABLE fcm_tokens (
  id SERIAL PRIMARY KEY,
  pair_id VARCHAR(36) NOT NULL,
  device_id VARCHAR(36) NOT NULL,
  fcm_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pair_id, device_id),
  FOREIGN KEY(pair_id) REFERENCES pairs(id)
);

// Create index for fast lookups
CREATE INDEX idx_fcm_pair_id ON fcm_tokens(pair_id);
```

Implementation:

```typescript
// Store token in database
app.post("/api/fcm/register", async (req: Request, res: Response) => {
  const { deviceId, pairId, fcmToken } = req.body;

  try {
    // Insert or update token in database
    await db
      .insertInto("fcm_tokens")
      .values({
        pair_id: pairId,
        device_id: deviceId,
        fcm_token: fcmToken,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(["pair_id", "device_id"]).doUpdateSet({ fcm_token: fcmToken })
      )
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to register FCM token:", error);
    res.status(500).json({ error: "Failed to register token" });
  }
});

// Retrieve token for sending
async function getPartnerFCMToken(
  pairId: string,
  partnerDeviceId: string
): Promise<string | null> {
  const result = await db
    .selectFrom("fcm_tokens")
    .select("fcm_token")
    .where("pair_id", "=", pairId)
    .where("device_id", "=", partnerDeviceId)
    .executeTakeFirst();

  return result?.fcm_token || null;
}
```

## Notification Strategies

### Strategy 1: Send on Every Message (Frequent)

```typescript
// Send notification for EVERY message
app.post("/api/messages", async (req: Request, res: Response) => {
  const { pairId, deviceId, content } = req.body;

  // ... save message ...

  // Send FCM immediately
  const token = await getPartnerFCMToken(pairId, partnerDeviceId);
  if (token) {
    await sendFCMNotification(
      token,
      "New Message",
      content.substring(0, 50), // First 50 chars
      { screen: "Chat" }
    );
  }

  res.json({ success: true });
});
```

### Strategy 2: Send Only for First Unread (Batched)

```typescript
// Send notification only if partner has unread messages
const lastNotifiedMessageId = new Map<string, string>();

app.post("/api/messages", async (req: Request, res: Response) => {
  const { pairId, deviceId, messageId } = req.body;

  // ... save message ...

  const lastNotified = lastNotifiedMessageId.get(pairId);
  
  // Only send if this is first new message since last notification
  if (!lastNotified || messageId > lastNotified) {
    const token = await getPartnerFCMToken(pairId, partnerDeviceId);
    if (token) {
      await sendFCMNotification(
        token,
        "New XD Calculations Available!",
        "Check now",
        { screen: "Chat" }
      );
    }
    lastNotifiedMessageId.set(pairId, messageId);
  }

  res.json({ success: true });
});
```

### Strategy 3: Rate Limit (One per 10 seconds)

```typescript
const lastNotificationTime = new Map<string, number>();

app.post("/api/messages", async (req: Request, res: Response) => {
  const { pairId, deviceId } = req.body;

  // ... save message ...

  const now = Date.now();
  const lastTime = lastNotificationTime.get(pairId) || 0;

  // Only send if more than 10 seconds have passed
  if (now - lastTime > 10000) {
    const token = await getPartnerFCMToken(pairId, partnerDeviceId);
    if (token) {
      await sendFCMNotification(
        token,
        "New XD Calculations Available!",
        "Check now",
        { screen: "Chat" }
      );
    }
    lastNotificationTime.set(pairId, now);
  }

  res.json({ success: true });
});
```

## Testing

### Test Endpoint

```typescript
app.post("/api/fcm/test", async (req: Request, res: Response) => {
  const { deviceToken, title, body } = req.body;

  if (!deviceToken) {
    return res.status(400).json({ error: "Device token required" });
  }

  const success = await sendFCMNotification(
    deviceToken,
    title || "Test Notification",
    body || "FCM is working!",
    { test: "true" }
  );

  if (success) {
    res.json({ success: true, message: "Notification sent" });
  } else {
    res
      .status(500)
      .json({ success: false, error: "Failed to send notification" });
  }
});
```

## Production Checklist

- [ ] Firebase initialized on server startup
- [ ] FCM token registration endpoint working
- [ ] Tokens stored securely (database preferred)
- [ ] Tokens cleared on unpair
- [ ] Notifications sent on new messages
- [ ] Error handling for failed sends
- [ ] Logging for debugging
- [ ] Token refresh logic implemented
- [ ] Rate limiting to avoid notification spam
- [ ] Test endpoint verified working
