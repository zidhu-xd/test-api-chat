import { Platform } from "react-native";

// NEW: Minimal + Bold Contrast Design System
const BACKGROUND = "#0B0D10";
const PRIMARY_TEXT = "#FFFFFF";
const SECONDARY_TEXT = "#9AA0A6";
const ACCENT = "#4F8BFF";
const DANGER = "#FF4D4F";

export const Colors = {
  light: {
    text: PRIMARY_TEXT,
    buttonText: PRIMARY_TEXT,
    tabIconDefault: SECONDARY_TEXT,
    tabIconSelected: ACCENT,
    link: ACCENT,
    backgroundRoot: BACKGROUND,
    backgroundDefault: "#161B22",
    backgroundSecondary: "#1C2128",
    backgroundTertiary: "#262D33",
  },
  dark: {
    text: PRIMARY_TEXT,
    buttonText: PRIMARY_TEXT,
    tabIconDefault: SECONDARY_TEXT,
    tabIconSelected: ACCENT,
    link: ACCENT,
    backgroundRoot: BACKGROUND,
    backgroundDefault: "#161B22",
    backgroundSecondary: "#1C2128",
    backgroundTertiary: "#262D33",
  },
};

export const CalculatorColors = {
  displayBackground: BACKGROUND,
  buttonBackground: "#161B22",
  operatorAccent: ACCENT,
  textPrimary: PRIMARY_TEXT,
  textSecondary: SECONDARY_TEXT,
  numberButton: "#1C2128",
  functionButton: "#262D33",
};

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

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  calculatorResult: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
  },
  calculatorPreview: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  pairingCode: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700" as const,
    letterSpacing: 8,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
