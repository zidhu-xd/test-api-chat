import { Platform } from "react-native";

// Base Colors
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GRAY = "#808080";
const GREEN = "#00FF00";
const RED = "#FF0000";

// Theme-specific color palettes
const DARK_THEME_PALETTE = {
  background: BLACK,
  primaryText: WHITE,
  secondaryText: GRAY,
  accent: GREEN,
  danger: RED,
};

const MATRIX_THEME_PALETTE = {
  background: "#000000",
  primaryText: "#00FF00",
  secondaryText: "#008F00",
  accent: "#00FF00",
  danger: "#FF0000",
};

const CYBERPUNK_THEME_PALETTE = {
  background: "#0C0C1E",
  primaryText: "#EC008C",
  secondaryText: "#A020F0",
  accent: "#00F0F0",
  danger: "#FFD300",
};

const CLASSIC_THEME_PALETTE = {
  background: "#F5F5F5",
  primaryText: "#333333",
  secondaryText: "#888888",
  accent: "#4285F4",
  danger: "#DB4437",
};

const LIGHT_THEME_PALETTE = {
    background: "#FFFFFF",
    primaryText: "#000000",
    secondaryText: "#808080",
    accent: "#0000FF",
    danger: "#FF0000",
}

export const Colors = {
  dark: {
    text: DARK_THEME_PALETTE.primaryText,
    buttonText: DARK_THEME_PALETTE.primaryText,
    tabIconDefault: DARK_THEME_PALETTE.secondaryText,
    tabIconSelected: DARK_THEME_PALETTE.accent,
    link: DARK_THEME_PALETTE.accent,
    danger: DARK_THEME_PALETTE.danger,
    backgroundRoot: DARK_THEME_PALETTE.background,
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#2A2A2A",
    backgroundTertiary: "#3A3A3A",
    calculator: {
        displayBackground: "#000000",
        buttonBackground: "#1A1A1A",
        operatorAccent: "#00FF00",
        textPrimary: "#FFFFFF",
        textSecondary: "#808080",
        numberButton: "#2A2A2A",
        functionButton: "#3A3A3A",
    },
    chat: {
        senderBubble: "#00FF00",
        receiverBubble: "#3A3A3A",
        backgroundGradientStart: "#000000",
        backgroundGradientEnd: "#000000",
        surface: "#1A1A1A",
        textOnBubbles: "#FFFFFF",
        textSecondary: "#808080",
        readReceiptBlue: "#00FF00",
        errorRed: "#FF0000",
        tickGray: "#808080",
    }
  },
  light: {
    text: LIGHT_THEME_PALETTE.primaryText,
    buttonText: LIGHT_THEME_PALETTE.background,
    tabIconDefault: LIGHT_THEME_PALETTE.secondaryText,
    tabIconSelected: LIGHT_THEME_PALETTE.accent,
    link: LIGHT_THEME_PALETTE.accent,
    danger: LIGHT_THEME_PALETTE.danger,
    backgroundRoot: LIGHT_THEME_PALETTE.background,
    backgroundDefault: "#F0F0F0",
    backgroundSecondary: "#EAEAEA",
    backgroundTertiary: "#DEDEDE",
    calculator: {
        displayBackground: "#F0F0F0",
        buttonBackground: "#EAEAEA",
        operatorAccent: "#0000FF",
        textPrimary: "#000000",
        textSecondary: "#808080",
        numberButton: "#DEDEDE",
        functionButton: "#CFCFCF",
    },
    chat: {
        senderBubble: "#0000FF",
        receiverBubble: "#EAEAEA",
        backgroundGradientStart: "#FFFFFF",
        backgroundGradientEnd: "#FFFFFF",
        surface: "#F0F0F0",
        textOnBubbles: "#FFFFFF",
        textSecondary: "#808080",
        readReceiptBlue: "#0000FF",
        errorRed: "#FF0000",
        tickGray: "#808080",
    }
  },
  matrix: {
    text: MATRIX_THEME_PALETTE.primaryText,
    buttonText: MATRIX_THEME_PALETTE.primaryText,
    tabIconDefault: MATRIX_THEME_PALETTE.secondaryText,
    tabIconSelected: MATRIX_THEME_PALETTE.accent,
    link: MATRIX_THEME_PALETTE.accent,
    danger: MATRIX_THEME_PALETTE.danger,
    backgroundRoot: MATRIX_THEME_PALETTE.background,
    backgroundDefault: "#001F00",
    backgroundSecondary: "#003300",
    backgroundTertiary: "#004700",
    calculator: {
        displayBackground: "#000000",
        buttonBackground: "#001F00",
        operatorAccent: "#00FF00",
        textPrimary: "#00FF00",
        textSecondary: "#008F00",
        numberButton: "#003300",
        functionButton: "#004700",
    },
    chat: {
        senderBubble: "#00FF00",
        receiverBubble: "#004700",
        backgroundGradientStart: "#000000",
        backgroundGradientEnd: "#001F00",
        surface: "#001F00",
        textOnBubbles: "#000000",
        textSecondary: "#008F00",
        readReceiptBlue: "#00FF00",
        errorRed: "#FF0000",
        tickGray: "#008F00",
    }
  },
  cyberpunk: {
    text: CYBERPUNK_THEME_PALETTE.primaryText,
    buttonText: CYBERPUNK_THEME_PALETTE.primaryText,
    tabIconDefault: CYBERPUNK_THEME_PALETTE.secondaryText,
    tabIconSelected: CYBERPUNK_THEME_PALETTE.accent,
    link: CYBERPUNK_THEME_PALETTE.accent,
    danger: CYBERPUNK_THEME_PALETTE.danger,
    backgroundRoot: CYBERPUNK_THEME_PALETTE.background,
    backgroundDefault: "#1A1A3A",
    backgroundSecondary: "#2A2A5A",
    backgroundTertiary: "#3A3A7A",
    calculator: {
        displayBackground: "#0C0C1E",
        buttonBackground: "#1A1A3A",
        operatorAccent: "#00F0F0",
        textPrimary: "#EC008C",
        textSecondary: "#A020F0",
        numberButton: "#2A2A5A",
        functionButton: "#3A3A7A",
    },
    chat: {
        senderBubble: "#00F0F0",
        receiverBubble: "#3A3A7A",
        backgroundGradientStart: "#0C0C1E",
        backgroundGradientEnd: "#1A1A3A",
        surface: "#1A1A3A",
        textOnBubbles: "#000000",
        textSecondary: "#A020F0",
        readReceiptBlue: "#00F0F0",
        errorRed: "#FFD300",
        tickGray: "#A020F0",
    }
  },
  classic: {
    text: CLASSIC_THEME_PALETTE.primaryText,
    buttonText: CLASSIC_THEME_PALETTE.background,
    tabIconDefault: CLASSIC_THEME_PALETTE.secondaryText,
    tabIconSelected: CLASSIC_THEME_PALETTE.accent,
    link: CLASSIC_THEME_PALETTE.accent,
    danger: CLASSIC_THEME_PALETTE.danger,
    backgroundRoot: CLASSIC_THEME_PALETTE.background,
    backgroundDefault: "#EAEAEA",
    backgroundSecondary: "#DEDEDE",
    backgroundTertiary: "#CFCFCF",
    calculator: {
        displayBackground: "#EAEAEA",
        buttonBackground: "#DEDEDE",
        operatorAccent: "#4285F4",
        textPrimary: "#333333",
        textSecondary: "#888888",
        numberButton: "#CFCFCF",
        functionButton: "#BDBDBD",
    },
    chat: {
        senderBubble: "#4285F4",
        receiverBubble: "#EAEAEA",
        backgroundGradientStart: "#F5F5F5",
        backgroundGradientEnd: "#EAEAEA",
        surface: "#EAEAEA",
        textOnBubbles: "#FFFFFF",
        textSecondary: "#888888",
        readReceiptBlue: "#4285F4",
        errorRed: "#DB4437",
        tickGray: "#888888",
    }
  }
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
