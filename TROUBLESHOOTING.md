# Troubleshooting Guide

## 🔔 Notification Issues

### Notifications not appearing

**Problem:** Sent message but no notification appears

**Checklist:**
1. ✅ Are both devices paired? (Check via `/api/health` endpoint)
2. ✅ Are you on iOS/Android? (Web doesn't support notifications)
3. ✅ Is the app running in background? (Notifications only show when app is in background)
4. ✅ Check notification permissions:
   ```typescript
   // Add to App.tsx or root component
   const { status } = await Notifications.getPermissionsAsync();
   if (status !== 'granted') {
     await Notifications.requestPermissionsAsync();
   }
   ```
5. ✅ Is `expo-notifications` installed in app.json plugins?

**Debug Steps:**
1. Open ChatScreen
2. Send message from Device B
3. Check console for: `[v0] Notification sending...`
4. Look for: `New XD Calculations Available!`
5. Device should NOT go to background (notification only shows if app is backgrounded)

**Code Location:** `client/screens/ChatScreen.tsx` lines 351-370

---

### Notification appears but tapping does nothing

**Problem:** Notification shows but tapping it doesn't navigate to Calculator

**Solution:**
The notification handler must be registered. Check `client/screens/ChatScreen.tsx` lines 251-279:

```typescript
// This should be called when ChatScreen mounts:
const subscription = Notifications.addNotificationResponseReceivedListener(
  (response) => {
    console.log("[v0] Notification tapped, navigating to Calculator");
    navigation.reset({
      index: 0,
      routes: [{ name: "Calculator" }],
    });
  }
);
```

**Fix:** Ensure this code is in the ChatScreen `useEffect` and notification is properly tapped.

---

### Notification sound not working

**Problem:** Notification appears silently

**Solution:**
1. Check app.json has sound configuration:
   ```json
   "notification": {
     "sound": "default"
   }
   ```

2. Check device sound settings:
   - iOS: Settings > Notifications > [App Name] > Sound
   - Android: Settings > Apps & Notifications > [App Name] > Notifications > Sound

3. Change notification sound in code:
   ```typescript
   // In ChatScreen.tsx, fetchMessages()
   content: {
     sound: "default",  // Options: "default", null (silent)
   }
   ```

---

## ✅ Message Read Ticks Issues

### Ticks not showing

**Problem:** Messages show no checkmarks

**Checklist:**
1. ✅ Is the message sent? (Check `sendMessage()` returns successfully)
2. ✅ Is device ID available? (Check via `getDeviceId()`)
3. ✅ Are messages being polled? (Should poll every 1000ms)
4. ✅ Is the message the last one from sender?

**Debug Steps:**
1. Send a message from Device A
2. Check console for: `[v0] Message tick status:`
3. Should show: `{ isSender: true, isLastSenderMessage: true, read: false }`
4. Wait for Device B to read message
5. Should then show: `{ read: true }`

**Code Location:** `client/screens/ChatScreen.tsx` lines 50-115

---

### Single tick shows but doesn't update to double tick

**Problem:** Stuck on single checkmark

**Issue:** Message is not being marked as read by recipient

**Solution:**
1. Check Device B is actually receiving the message:
   - Send message from Device A
   - Device B should see message appear in chat
   - Check: Does Device B see the message? (If no, poll issue)

2. Force device B to mark as read:
   - The app automatically marks unread messages as read via `markMessagesRead()`
   - This should happen when Device B polls messages
   - Check server logs for `/api/read` endpoint being called

3. Check message flow:
   - Device A: sends message (`/api/send`)
   - Device B: polls (`/api/poll`) and receives message
   - Device B: marks as read (`/api/read`)
   - Device A: polls again and should see `read: true`

**Debug:**
```typescript
// In ChatScreen.tsx, fetchMessages() add debug:
console.log("[v0] Messages received:", response.data.messages.map(m => ({
  id: m.id,
  senderId: m.senderId,
  read: m.read,
  content: m.content.substring(0, 20),
})));
```

---

### Ticks show on wrong message

**Problem:** Checkmarks appear on message that's not last sent

**Cause:** `isLastSenderMessage` calculation is wrong

**Check Logic:**
```typescript
// In renderItem, this calculation:
const isLastSenderMessage = isSender && 
  !messages.slice(index + 1).some(m => m.senderId === pairingData?.deviceId);
```

**Debug:**
```typescript
console.log(`[v0] Message ${item.id}:`, {
  isSender,
  isLastSenderMessage,
  messagesAfter: messages.slice(index + 1).length,
  senderMessagesAfter: messages.slice(index + 1).filter(m => m.senderId === pairingData?.deviceId).length,
});
```

---

## 💬 Message Delivery Issues

### Messages not appearing on recipient device

**Problem:** Device B doesn't see messages from Device A

**Checklist:**
1. ✅ Are devices paired? (Check pairing data saved)
2. ✅ Same pair ID? (Both devices should have same `pairId`)
3. ✅ Network connected? (Both on WiFi/internet)
4. ✅ Server running? (Check `/api/health` endpoint)

**Debug:**
```typescript
// In ChatScreen useEffect, check pairing:
console.log("[v0] Pairing data:", pairingData);
console.log("[v0] Poll interval active:", pollIntervalRef.current !== null);
console.log("[v0] Screen visible:", isScreenVisible);
```

**Flow:**
1. Device A sends: `sendMessage(pairId, deviceId, content)`
2. Server stores in `messages[pairId]`
3. Device B polls: `pollMessages(pairId, deviceId)`
4. Server returns all messages for pair
5. Device B should see message in list

---

### Messages sent but immediately disappear

**Problem:** Message sent then vanishes from list

**Cause:** Likely message list is not updating correctly

**Check:**
```typescript
// Message state update in sendMessage handler:
setMessages((prev) => [...prev, newMessage]);

// Then fetchMessages might override
// Make sure both are in sync
```

**Solution:** Clear messages then fetch fresh from server:
```typescript
// After send, force fetch
await fetchMessages();
```

---

## 🎨 Notification Text/Icon Issues

### Notification title/body not customized

**Problem:** Notification shows wrong text

**Location:** `client/screens/ChatScreen.tsx` lines 359-361

**Change:**
```typescript
content: {
  title: "New XD Calculations Available!",  // Change this
  body: "Check now",                        // Change this
  sound: "default",
```

---

### Notification icon not showing

**Problem:** Notification appears but no custom icon

**Check app.json:**
```json
"notification": {
  "icon": "./assets/images/notification-icon.png",
  "color": "#4F8BFF"
}
```

**File must exist:** Create `notification-icon.png` at `assets/images/notification-icon.png`
- Size: 256x256px minimum
- PNG format with transparency
- Monochrome (single color with transparency)

---

## 🌙 Theme/UI Issues

### Colors look wrong or don't change

**Problem:** Theme colors not applying

**Check:**
1. ✅ Edit `client/constants/theme.ts`
2. ✅ Save the file
3. ✅ App should hot-reload
4. ✅ If not, press 'r' in terminal to force reload

**Verify export:**
```typescript
// Make sure colors are exported
export const ChatColors = { ... };
export const CalculatorColors = { ... };
export const Colors = { ... };
```

**Verify import in component:**
```typescript
import { ChatColors } from '@/constants/theme';

// Then use:
backgroundColor: ChatColors.surface,
color: ChatColors.textOnBubbles,
```

---

### Text not visible (same color as background)

**Problem:** Text invisible because text color == background color

**Solution:** Use contrasting colors
```typescript
// ❌ Bad
backgroundColor: "#FFFFFF",
color: "#FFFFFF",  // Can't see text!

// ✅ Good
backgroundColor: "#FFFFFF",
color: "#000000",  // High contrast
```

**Check contrast:**
Use https://webaim.org/resources/contrastchecker/

---

## 🔧 General Debugging

### Enable detailed logging

Add to ChatScreen:
```typescript
useEffect(() => {
  console.log("[v0] ChatScreen mounted");
  console.log("[v0] Pairing data:", pairingData);
  
  return () => {
    console.log("[v0] ChatScreen unmounted");
  };
}, [pairingData]);
```

### Monitor message updates

```typescript
useEffect(() => {
  console.log("[v0] Messages updated:", {
    count: messages.length,
    lastMessage: messages[messages.length - 1],
  });
}, [messages]);
```

### Check notification handler

```typescript
// In ChatScreen notification setup:
console.log("[v0] Notification handler registered");
```

### Test pairing status

```typescript
// Add button to test:
<Pressable onPress={async () => {
  const status = await checkPairingStatus(deviceId, code);
  console.log("[v0] Pairing status:", status);
}}>
  <Text>Check Pairing</Text>
</Pressable>
```

---

## 📋 Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Pair not found" | Device not paired | Run pairing flow first |
| "Device already paired" | Device has pair | Factory reset (5678) |
| "Network error" | No connection | Check WiFi/internet |
| "Request failed" | Server error | Restart server |
| "Invalid code" | Wrong pairing code | Verify code matches |
| "Messages not defined" | State not initialized | Check useEffect loading |

---

## 🚀 Quick Diagnostic Script

Add this button to test all systems:

```typescript
<Pressable onPress={async () => {
  const deviceId = await getDeviceId();
  const paired = await isPaired();
  const data = await getPairingData();
  
  console.log("[v0] DIAGNOSTIC REPORT:");
  console.log("Device ID:", deviceId?.substring(0, 8));
  console.log("Paired:", paired);
  console.log("Pair Data:", data ? `${data.pairId.substring(0, 8)}...` : "none");
  console.log("Messages:", messages.length);
  console.log("Partner typing:", partnerTyping);
  console.log("Screen visible:", isScreenVisible);
}}>
  <Text>Diagnose</Text>
</Pressable>
```

---

## ✅ All Systems Working Checklist

- [ ] Notifications appear when message sent
- [ ] Tapping notification opens Calculator
- [ ] Single tick shows when message sent
- [ ] Double tick shows when message read
- [ ] Theme colors display correctly
- [ ] Icons appear correctly in Settings
- [ ] Messages appear on recipient device
- [ ] Typing indicator works
- [ ] Settings persist between app sessions

If all checked ✅, everything is working correctly!

---

## Still Having Issues?

1. **Check the console** - Look for `[v0]` debug messages
2. **Check network** - Use `/api/health` to verify server is running
3. **Force clear** - Restart app completely
4. **Check logs** - Device A and B logs should show synchronized messages
5. **Rebuild** - Run `npm run dev` to ensure latest code

All features are fully tested and working. Most issues are due to:
- 🔌 Network connectivity
- 💾 Data state not synced
- 🔄 App not reloading changes
- 📱 Notification permissions not granted
