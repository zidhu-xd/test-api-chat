# Custom App Icons Guide

This guide explains how to add custom app icons to your Calculator app and switch between them dynamically.

## Overview

The app currently supports multiple icon variants that can be switched at runtime. The icon selection is stored in AsyncStorage and persists across app sessions.

## Step 1: Create Your Icon Assets

Icons should be created as PNG files with transparency. Recommended sizes:

- **iOS Icon**: 1024x1024 px (highest quality)
- **Android Adaptive Icon**: 
  - Foreground: 1024x1024 px (with safe zone of 72px padding)
  - Background: 1024x1024 px (solid color or gradient)

### File Structure

Place your custom icons in `/assets/images/` with descriptive names:

```
/assets/images/
├── icon.png (main app icon for app store)
├── icon-calculator.png (calculator variant)
├── icon-secure.png (secure/lock variant)
├── icon-shield.png (shield variant)
├── icon-code.png (code variant)
├── icon-key.png (key variant)
├── android-icon-foreground.png (adaptive icon foreground)
└── android-icon-background.png (adaptive icon background)
```

## Step 2: Configure app.json

Update `app.json` to reference your custom icons:

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.calculator.app"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#0B0D10",
        "foregroundImage": "./assets/images/android-icon-foreground.png"
      }
    }
  }
}
```

## Step 3: Update Icon Selection in SettingsScreen

The SettingsScreen already has an icon selector UI. To add new icons, update the `AVAILABLE_ICONS` array in `client/screens/SettingsScreen.tsx`:

```typescript
const AVAILABLE_ICONS = [
  { id: 'calculator', name: 'Calculator', icon: 'grid-3x3' },
  { id: 'secure', name: 'Secure', icon: 'lock' },
  { id: 'shield', name: 'Shield', icon: 'shield' },
  { id: 'code', name: 'Code', icon: 'code' },
  { id: 'key', name: 'Key', icon: 'key' },
  // Add your custom icons here:
  // { id: 'custom-name', name: 'Display Name', icon: 'feather-icon-name' },
];
```

## Step 4: Store Icon Selection

The icon selection is automatically stored in AsyncStorage via these functions in `client/lib/storage.ts`:

```typescript
// Get the currently selected icon
const selectedIcon = await getSelectedIcon(); // returns: 'calculator'

// Set the selected icon
await setSelectedIcon('secure'); // stores icon selection
```

## Step 5: Native Icon Switching (Advanced)

To actually switch the app icon natively on iOS/Android, you'll need to use the `expo-alternate-app-icons` library:

### Install the library:
```bash
npx expo install expo-alternate-app-icons
```

### Update app.json to reference alternate icons:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-alternate-app-icons",
        {
          "primaryIcon": "icon",
          "icons": {
            "calculator": "./assets/images/icon-calculator.png",
            "secure": "./assets/images/icon-secure.png",
            "shield": "./assets/images/icon-shield.png",
            "code": "./assets/images/icon-code.png",
            "key": "./assets/images/icon-key.png"
          }
        }
      ]
    ]
  }
}
```

### Update SettingsScreen to use native icon switching:

```typescript
import * as AppIcon from 'expo-alternate-app-icons';

const handleIconSelect = async (iconId: string) => {
  setSelectedIconState(iconId);
  await setSelectedIcon(iconId);
  
  // Switch the native app icon
  if (Platform.OS !== 'web' && AppIcon.isSupported) {
    try {
      await AppIcon.setIcon(iconId);
    } catch (error) {
      console.log("[v0] Icon switching not supported on this device");
    }
  }
  
  setShowIconModal(false);
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};
```

## Step 6: Design Guidelines for Custom Icons

### Icon Requirements:
- **PNG format** with transparency (for iOS)
- **1024x1024 pixels** minimum (will be scaled down by OS)
- **24px safe zone padding** from edges (important for Android adaptive icons)
- **Bold, minimal design** matching the app's aesthetic
- **Distinctive** - should be different from other icons
- **Recognizable at small sizes** (testing at 60x60px is recommended)

### Color Recommendations:
- Primary: `#4F8BFF` (blue accent)
- Background: `#0B0D10` (dark background)
- Foreground: `#FFFFFF` (white text/primary elements)

## Step 7: Testing Icon Changes

1. **Locally**: Use the Settings screen to select different icons
2. **Android**: Build with `eas build --platform android`
3. **iOS**: Build with `eas build --platform ios`

After installing a new build, the app icon on your home screen will update based on the native icon switching configuration.

## Troubleshooting

### Icon not updating
- Clear app cache: Settings > Apps > Calculator > Storage > Clear Cache
- Rebuild the app with `eas build`
- Ensure icon file paths in `app.json` are correct

### Icon selection not persisting
- Check that `AsyncStorage` permissions are granted
- Verify icon ID matches exactly in both UI and storage

### Native icon switching not working
- `expo-alternate-app-icons` not supported on web
- May not work on all Android devices (particularly pre-Android 12)
- Test on physical device, not emulator

## Summary

The app now supports:
✅ Multiple icon variants via UI selection  
✅ Persistent icon selection in AsyncStorage  
✅ Optional native icon switching (requires additional setup)  
✅ Easy addition of new icons  
✅ Theme-aware icon colors  

All icon preferences are automatically saved and restored when the app is relaunched.
