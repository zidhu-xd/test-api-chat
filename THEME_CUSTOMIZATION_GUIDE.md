# Theme Customization Guide

This guide explains how to customize the app's theme colors and create custom themes.

## Current Theme System

The app uses a **dark minimal + bold contrast** theme by default:

- **Background**: `#0B0D10` (very dark)
- **Primary Text**: `#FFFFFF` (white)
- **Secondary Text**: `#9AA0A6` (light gray)
- **Accent**: `#4F8BFF` (blue)
- **Danger**: `#FF4D4F` (red)
- **Message Sender Bubble**: `#4F8BFF` (blue)
- **Message Receiver Bubble**: `#1C2128` (dark gray)

## Step 1: Understanding the Color System

Colors are defined in `/client/constants/theme.ts`:

```typescript
// Primary Colors
const BACKGROUND = "#0B0D10";
const PRIMARY_TEXT = "#FFFFFF";
const SECONDARY_TEXT = "#9AA0A6";
const ACCENT = "#4F8BFF";
const DANGER = "#FF4D4F";

export const ChatColors = {
  senderBubble: ACCENT,
  receiverBubble: "#262D33",
  backgroundGradientStart: BACKGROUND,
  backgroundGradientEnd: BACKGROUND,
  surface: "#161B22",
  textOnBubbles: PRIMARY_TEXT,
  textSecondary: SECONDARY_TEXT,
  readReceiptBlue: ACCENT,
  errorRed: DANGER,
  tickGray: SECONDARY_TEXT,
};
```

## Step 2: Changing the Theme Colors

### Option A: Direct Theme Modification (Single Theme)

Edit `/client/constants/theme.ts` to change the color palette:

```typescript
// NEW COLOR SCHEME EXAMPLE - Light Theme
const BACKGROUND = "#FFFFFF";
const PRIMARY_TEXT = "#000000";
const SECONDARY_TEXT = "#666666";
const ACCENT = "#007AFF";
const DANGER = "#FF3B30";

export const ChatColors = {
  senderBubble: ACCENT,           // Blue bubbles
  receiverBubble: "#E5E5EA",       // Light gray bubbles
  backgroundGradientStart: BACKGROUND,
  backgroundGradientEnd: BACKGROUND,
  surface: "#F8F8F8",
  textOnBubbles: PRIMARY_TEXT,
  textSecondary: SECONDARY_TEXT,
  readReceiptBlue: ACCENT,
  errorRed: DANGER,
  tickGray: SECONDARY_TEXT,
};
```

### Option B: Dynamic Theme Switching

To allow users to switch themes at runtime:

1. **Update `client/lib/storage.ts`** with theme preferences:

```typescript
export interface ThemePreset {
  name: string;
  isDark: boolean;
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  danger: string;
  senderBubble: string;
  receiverBubble: string;
}

const THEME_PRESETS: Record<string, ThemePreset> = {
  dark: {
    name: "Dark (Default)",
    isDark: true,
    background: "#0B0D10",
    surface: "#161B22",
    primary: "#FFFFFF",
    secondary: "#9AA0A6",
    accent: "#4F8BFF",
    danger: "#FF4D4F",
    senderBubble: "#4F8BFF",
    receiverBubble: "#1C2128",
  },
  light: {
    name: "Light",
    isDark: false,
    background: "#FFFFFF",
    surface: "#F8F8F8",
    primary: "#000000",
    secondary: "#666666",
    accent: "#007AFF",
    danger: "#FF3B30",
    senderBubble: "#007AFF",
    receiverBubble: "#E5E5EA",
  },
  ocean: {
    name: "Ocean",
    isDark: true,
    background: "#0A1628",
    surface: "#0F1F35",
    primary: "#E8F0FF",
    secondary: "#7FA3C0",
    accent: "#00D9FF",
    danger: "#FF6B6B",
    senderBubble: "#00D9FF",
    receiverBubble: "#1A2F45",
  },
};

export async function getThemePreset(themeName: string): Promise<ThemePreset> {
  return THEME_PRESETS[themeName] || THEME_PRESETS.dark;
}

export async function saveThemePreference(themeName: string): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, themeName);
  } catch {}
}

export async function getThemePreference(): Promise<string> {
  try {
    return await AsyncStorage.getItem(THEME_KEY) || 'dark';
  } catch {
    return 'dark';
  }
}
```

2. **Create a Theme Context** (`client/context/ThemeContext.tsx`):

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getThemePreset, getThemePreference, saveThemePreference } from '@/lib/storage';

interface ThemePreset {
  // ... (see above)
}

interface ThemeContextType {
  theme: ThemePreset;
  themeName: string;
  setTheme: (themeName: string) => Promise<void>;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset | null>(null);
  const [themeName, setThemeNameState] = useState('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedTheme = await getThemePreference();
    const themePreset = await getThemePreset(savedTheme);
    setThemeNameState(savedTheme);
    setThemeState(themePreset);
  };

  const setTheme = async (newThemeName: string) => {
    const newTheme = await getThemePreset(newThemeName);
    setThemeNameState(newThemeName);
    setThemeState(newTheme);
    await saveThemePreference(newThemeName);
  };

  if (!theme) return null;

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        themeName, 
        setTheme,
        availableThemes: Object.keys(THEME_PRESETS)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

3. **Update SettingsScreen** to show theme options:

```typescript
import { useTheme } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const { themeName, setTheme, availableThemes } = useTheme();

  const handleThemeChange = async (theme: string) => {
    await setTheme(theme);
    // Refresh styles
  };

  return (
    <View>
      {/* ... other settings ... */}
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Theme</Text>
        {availableThemes.map((theme) => (
          <Pressable 
            key={theme}
            style={[
              styles.themeOption,
              themeName === theme && styles.themeOptionSelected
            ]}
            onPress={() => handleThemeChange(theme)}
          >
            <Text style={styles.themeOptionText}>{theme}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

## Step 3: Creating a Custom Color Palette

### Use a Color Picker Tool
1. Go to https://coolors.co
2. Create a color palette matching your design
3. Note the hex codes

### Color Contrast Guidelines
- Text on light backgrounds: Use dark text (`#000000` - `#333333`)
- Text on dark backgrounds: Use light text (`#FFFFFF` - `#E8E8E8`)
- Ensure WCAG AA contrast ratio (4.5:1 for normal text)
- Test with https://webaim.org/resources/contrastchecker/

### Example: Purple Theme

```typescript
const purpleTheme: ThemePreset = {
  name: "Purple",
  isDark: true,
  background: "#1A0F2E",
  surface: "#2D1B4E",
  primary: "#F0E8FF",
  secondary: "#B8A8D8",
  accent: "#A78BFA",
  danger: "#FF6B6B",
  senderBubble: "#A78BFA",
  receiverBubble: "#3D2B5F",
};
```

## Step 4: Apply Theme Across Components

Update components to use theme context colors:

```typescript
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.background,
    },
    text: {
      color: theme.primary,
    },
    button: {
      backgroundColor: theme.accent,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Themed Text</Text>
    </View>
  );
}
```

## Step 5: System Theme Detection (Optional)

Detect if device is in dark/light mode:

```typescript
import { useColorScheme } from 'react-native';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'

  useEffect(() => {
    // Auto-load appropriate theme based on system settings
    if (systemColorScheme === 'dark') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [systemColorScheme]);

  // ... rest of provider
}
```

## Common Theme Combinations

### Dark Modern
- Background: `#0F0F0F`
- Accent: `#00D9FF` (cyan)
- Sender Bubble: `#00D9FF`

### Light Professional
- Background: `#FFFFFF`
- Accent: `#2563EB` (blue)
- Sender Bubble: `#2563EB`

### High Contrast
- Background: `#000000`
- Primary Text: `#FFFFFF`
- Accent: `#FFFF00` (yellow)
- Excellent accessibility

## Testing Your Theme

1. **Test at different brightness levels** - Ensure readable in both bright sunlight and dark rooms
2. **Test with colorblind simulation** - Use https://www.color-blindness.com/coblis-color-blindness-simulator/
3. **Check contrast** - Run through WCAG contrast checker
4. **Test on actual devices** - Colors look different on different screens

## Summary

✅ Default dark theme configured and working  
✅ Dynamic theme switching ready (with context setup)  
✅ Multiple theme presets available  
✅ Easy to add new custom themes  
✅ Colors persist across app sessions  
✅ WCAG accessibility considerations included  

Your app now has a flexible, customizable theme system that can be expanded with new color schemes as needed.
