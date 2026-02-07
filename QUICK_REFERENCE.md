# Quick Reference - Feature Customization

## 🔔 Change Notification Message

**File:** `client/screens/ChatScreen.tsx`

**Location:** Lines 351-370 in `fetchMessages()` function

**Current code:**
```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: "New XD Calculations Available!",
    body: "Check now",
    sound: "default",
    badge: 1,
    data: {
      screen: "Chat",
    },
  },
  trigger: null,
});
```

**Change the message:**
```typescript
// Modify these lines:
title: "Your Custom Title Here",
body: "Your Custom Body Here",
```

**Examples:**
```typescript
// Formal
title: "Message Received",
body: "You have a new message",

// Casual
title: "New Chat!",
body: "Check your messages",

// Stealth mode
title: "Calculations Ready",
body: "Tap to view",
```

---

## 🎨 Change Theme Colors

**File:** `client/constants/theme.ts`

**Location:** Lines 3-8 (Primary color definitions)

**Current code:**
```typescript
const BACKGROUND = "#0B0D10";
const PRIMARY_TEXT = "#FFFFFF";
const SECONDARY_TEXT = "#9AA0A6";
const ACCENT = "#4F8BFF";
const DANGER = "#FF4D4F";
```

**Change all colors at once:**
```typescript
// Light theme example
const BACKGROUND = "#FFFFFF";
const PRIMARY_TEXT = "#000000";
const SECONDARY_TEXT = "#666666";
const ACCENT = "#007AFF";
const DANGER = "#FF3B30";
```

**Just change the accent:**
```typescript
// Change button/bubble/link colors
const ACCENT = "#FF6B6B"; // Red
const ACCENT = "#51CF66"; // Green
const ACCENT = "#FFD43B"; // Yellow
const ACCENT = "#748FFC"; // Purple
```

---

## 🎯 Change Message Bubble Colors

**File:** `client/constants/theme.ts`

**Location:** Lines 33-46 in `ChatColors` object

**Current code:**
```typescript
export const ChatColors = {
  senderBubble: ACCENT,           // Currently #4F8BFF
  receiverBubble: "#262D33",      // Dark gray
  // ... other colors ...
};
```

**Change bubble colors:**
```typescript
export const ChatColors = {
  senderBubble: "#FF6B6B",        // Red bubbles from sender
  receiverBubble: "#4ECDC4",      // Teal bubbles from receiver
  // ... rest stays same ...
};
```

---

## 🔐 Change Calculator Lock PIN

**File:** `client/lib/storage.ts`

**Location:** Line 14

**Current code:**
```typescript
const DEFAULT_PASSCODE = "1234";
```

**Change to:**
```typescript
const DEFAULT_PASSCODE = "9999"; // New PIN
```

**Or allow user to set custom PIN in Settings:**
- Already implemented in `SettingsScreen.tsx`
- Users can change PIN via Settings > Change PIN

---

## 📱 Change App Name/Display Name

**File:** `app.json`

**Location:** Line 3

**Current code:**
```json
{
  "expo": {
    "name": "Calculator",
    "slug": "calculator",
```

**Change to:**
```json
{
  "expo": {
    "name": "My Secret App",
    "slug": "my-secret-app",
```

---

## 🏠 Change Default Home Screen

**File:** `client/screens/ChatScreen.tsx`

**Location:** Lines 276-280 (handleAppStateChange) and other places

**Currently returns to Calculator when app goes to background:**
```typescript
if (nextAppState === "background" || nextAppState === "inactive") {
  setIsScreenVisible(false);
  navigation.reset({
    index: 0,
    routes: [{ name: "Calculator" }], // Changes this to go to different screen
  });
}
```

**To change default screen:**
```typescript
routes: [{ name: "CodeEntry" }], // Go to CodeEntry instead
routes: [{ name: "Settings" }],  // Go to Settings
routes: [{ name: "Chat" }],      // Stay on Chat
```

---

## 🔗 Change Deep Link Target from Notification

**File:** `client/screens/ChatScreen.tsx`

**Location:** Lines 265-273 (Notification response handler)

**Current code:**
```typescript
const subscription = Notifications.addNotificationResponseReceivedListener(
  (response) => {
    console.log("[v0] Notification tapped, navigating to Calculator");
    navigation.reset({
      index: 0,
      routes: [{ name: "Calculator" }],  // Change this
    });
  }
);
```

**Change navigation target:**
```typescript
routes: [{ name: "Chat" }],        // Go to Chat instead
routes: [{ name: "Settings" }],    // Go to Settings
routes: [{ name: "CodeEntry" }],   // Go to Pairing screen
```

---

## 🎵 Change Notification Sound

**File:** `client/screens/ChatScreen.tsx`

**Location:** Line 359

**Current code:**
```typescript
content: {
  title: "New XD Calculations Available!",
  body: "Check now",
  sound: "default",  // Change this
  badge: 1,
```

**Options:**
```typescript
sound: "default",     // System default sound
sound: null,          // Silent (no sound)
sound: "custom",      // Custom sound (if available)
```

**To use custom sound file:**
1. Add audio file to `assets/sounds/`
2. Change to: `sound: "custom-sound-name"`
3. May require native configuration

---

## 👤 Change Settings Screen Appearance

**File:** `client/screens/SettingsScreen.tsx`

**Location:** Various sections

**Add new setting item:**
```typescript
<Pressable style={styles.settingItem} onPress={() => {}}>
  <View style={styles.settingLeft}>
    <Feather name="your-icon" size={20} color={ChatColors.readReceiptBlue} style={styles.icon} />
    <View>
      <Text style={styles.settingLabel}>Your Setting Name</Text>
      <Text style={styles.settingValue}>Description</Text>
    </View>
  </View>
  <Feather name="chevron-right" size={20} color={ChatColors.textSecondary} />
</Pressable>
```

---

## 📦 Add New Icon Option

**File:** `client/screens/SettingsScreen.tsx`

**Location:** Lines 9-16

**Current code:**
```typescript
const AVAILABLE_ICONS = [
  { id: 'calculator', name: 'Calculator', icon: 'grid-3x3' },
  { id: 'secure', name: 'Secure', icon: 'lock' },
  { id: 'shield', name: 'Shield', icon: 'shield' },
  { id: 'code', name: 'Code', icon: 'code' },
  { id: 'key', name: 'Key', icon: 'key' },
];
```

**Add new icon:**
```typescript
const AVAILABLE_ICONS = [
  { id: 'calculator', name: 'Calculator', icon: 'grid-3x3' },
  { id: 'secure', name: 'Secure', icon: 'lock' },
  { id: 'shield', name: 'Shield', icon: 'shield' },
  { id: 'code', name: 'Code', icon: 'code' },
  { id: 'key', name: 'Key', icon: 'key' },
  { id: 'heart', name: 'Heart', icon: 'heart' },        // NEW
  { id: 'star', name: 'Star', icon: 'star' },            // NEW
  { id: 'zap', name: 'Power', icon: 'zap' },             // NEW
];
```

**Available Feather Icons:**
- Common: `lock`, `shield`, `key`, `code`, `grid-3x3`, `heart`, `star`, `zap`, `smile`, `user`, `settings`, `menu`, `search`, `bell`, `mail`, `phone`, `camera`, `image`, `file`, `folder`

See https://feathericons.com for full icon list.

---

## 🔧 Common Customizations Summary

| What | File | Line | Field |
|------|------|------|-------|
| Notification title | ChatScreen.tsx | 359 | `title:` |
| Notification body | ChatScreen.tsx | 360 | `body:` |
| Background color | theme.ts | 3 | `BACKGROUND` |
| Text color | theme.ts | 4 | `PRIMARY_TEXT` |
| Accent/Button color | theme.ts | 6 | `ACCENT` |
| Sender bubble color | theme.ts | 33 | `senderBubble:` |
| Receiver bubble color | theme.ts | 34 | `receiverBubble:` |
| Default PIN | storage.ts | 14 | `DEFAULT_PASSCODE` |
| App name | app.json | 3 | `name:` |
| Default screen | ChatScreen.tsx | 277 | `routes:` |
| Notification target | ChatScreen.tsx | 268 | `routes:` |
| Icon options | SettingsScreen.tsx | 10-15 | `AVAILABLE_ICONS` |

---

## ✅ Testing After Changes

After making changes, always:

1. **Rebuild the app:**
   ```bash
   npm run dev
   ```

2. **Test on device:**
   - For notifications: Send message between paired devices
   - For colors: Check all screens (Chat, Settings, Calculator, Code)
   - For icons: Open Settings and verify selector

3. **Check for errors:**
   - Look for red error messages in terminal
   - Check device console for warnings

4. **Force reload if needed:**
   - Shake device (physical)
   - Press 'r' in terminal (if using Expo CLI)
   - Fully close and reopen app

---

## 🚀 Ready to Customize!

All key customization points are documented here. Pick what you want to change and follow the examples above. Happy customizing! 🎉
