import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { CalculatorColors, Spacing } from "@/constants/theme";
import {
  hasUnlockBeenUsed,
  markUnlockUsed,
  isPaired,
  getPasscode,
  clearAllData,
} from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUTTON_MARGIN = 8;
const BUTTON_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - BUTTON_MARGIN * 8) / 4;

const FACTORY_RESET_CODE = "5678";

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 200,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CalcButtonProps {
  label: string;
  onPress: () => void;
  type?: "number" | "operator" | "function" | "equals";
  wide?: boolean;
}

function CalcButton({
  label,
  onPress,
  type = "number",
  wide = false,
}: CalcButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "operator":
      case "equals":
        return CalculatorColors.operatorAccent;
      case "function":
        return CalculatorColors.functionButton;
      default:
        return CalculatorColors.numberButton;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "operator":
      case "equals":
        return "#FFFFFF";
      default:
        return CalculatorColors.textPrimary;
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          width: wide ? BUTTON_SIZE * 2 + BUTTON_MARGIN * 2 : BUTTON_SIZE,
        },
        animatedStyle,
      ]}
      testID={`calc-button-${label}`}
    >
      <Text style={[styles.buttonText, { color: getTextColor() }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

type CalculatorNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CalculatorNavigationProp>();

  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [preview, setPreview] = useState("");
  const [lastOperator, setLastOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [previousValue, setPreviousValue] = useState<number | null>(null);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setPreview("");
    setLastOperator(null);
    setWaitingForOperand(false);
    setPreviousValue(null);
  }, []);

  // Calculate live preview
  const calculateResult = useCallback((expr: string): string => {
    try {
      // Replace display operators with JS operators
      let sanitized = expr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-");

      // Remove trailing operator
      sanitized = sanitized.replace(/[+\-*/]$/, "");

      if (!sanitized) return "";

      // Safe evaluation using Function
      const result = new Function(`return ${sanitized}`)();

      if (typeof result === "number" && isFinite(result)) {
        // Format the result
        if (Number.isInteger(result)) {
          return result.toString();
        }
        return parseFloat(result.toFixed(8)).toString();
      }
      return "";
    } catch {
      return "";
    }
  }, []);

  // Update preview when expression changes
  useEffect(() => {
    if (expression) {
      const result = calculateResult(expression);
      setPreview(result);
    } else {
      setPreview("");
    }
  }, [expression, calculateResult]);

  const handleNumber = useCallback(
    (num: string) => {
      if (waitingForOperand) {
        setDisplay(num);
        setExpression((prev) => prev + num);
        setWaitingForOperand(false);
      } else {
        const newDisplay = display === "0" ? num : display + num;
        setDisplay(newDisplay);
        if (expression === "" || expression === "0") {
          setExpression(num);
        } else {
          setExpression((prev) => prev + num);
        }
      }
    },
    [display, expression, waitingForOperand]
  );

  const handleOperator = useCallback(
    (op: string) => {
      const opSymbol =
        op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : op;

      if (waitingForOperand && lastOperator) {
        // Replace the last operator
        setExpression((prev) => prev.slice(0, -1) + opSymbol);
        setLastOperator(op);
        return;
      }

      setExpression((prev) => (prev || display) + opSymbol);
      setLastOperator(op);
      setWaitingForOperand(true);
      setPreviousValue(parseFloat(display));
    },
    [display, waitingForOperand, lastOperator]
  );

  const handleEquals = useCallback(async () => {
    // Check for codes
    const currentExpression = expression || display;
    const unlockCode = await getPasscode();

    if (currentExpression === FACTORY_RESET_CODE) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      await clearAllData();
      handleClear();
      return;
    }

    if (currentExpression === unlockCode) {
      const unlockUsed = await hasUnlockBeenUsed();
      const paired = await isPaired();

      if (paired) {
        // Already paired, go to chat
        await markUnlockUsed();
        navigation.navigate("Chat");
        handleClear();
        return;
      }

      if (!unlockUsed) {
        // First time unlock, go to pairing
        await markUnlockUsed();
        navigation.navigate("PairingChoice");
        handleClear();
        return;
      }
    }

    // Normal calculation
    const result = calculateResult(expression || display);
    if (result) {
      setDisplay(result);
      setExpression("");
      setPreview("");
      setLastOperator(null);
      setWaitingForOperand(false);
      setPreviousValue(null);
    }
  }, [display, expression, calculateResult, navigation, handleClear]);

  const handlePercent = useCallback(() => {
    const current = parseFloat(display);
    const result = current / 100;
    const resultStr = result.toString();
    setDisplay(resultStr);

    if (expression) {
      // Replace the last number in expression with percentage
      const match = expression.match(/(\d+\.?\d*)$/);
      if (match) {
        setExpression(expression.slice(0, -match[0].length) + resultStr);
      }
    } else {
      setExpression(resultStr);
    }
  }, [display, expression]);

  const handleDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay("0.");
      setExpression((prev) => prev + "0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
      setExpression((prev) => (prev || "0") + ".");
    }
  }, [display, waitingForOperand]);

  const handlePlusMinus = useCallback(() => {
    if (display !== "0") {
      const newDisplay = display.startsWith("-")
        ? display.slice(1)
        : "-" + display;
      setDisplay(newDisplay);

      // Update expression
      if (expression) {
        const match = expression.match(/-?(\d+\.?\d*)$/);
        if (match) {
          const num = match[0];
          const newNum = num.startsWith("-") ? num.slice(1) : "-" + num;
          setExpression(expression.slice(0, -num.length) + newNum);
        }
      } else {
        setExpression(newDisplay);
      }
    }
  }, [display, expression]);

  // Format display for large numbers
  const formatDisplay = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    if (Math.abs(num) >= 1e9) {
      return num.toExponential(4);
    }

    if (value.length > 12) {
      return parseFloat(num.toPrecision(10)).toString();
    }

    return value;
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.md,
          paddingBottom: insets.bottom + Spacing.md,
        },
      ]}
    >
      {/* Display Area */}
      <View style={styles.displayContainer}>
        {/* Expression/Preview */}
        <Text style={styles.previewText} numberOfLines={1}>
          {expression || " "}
        </Text>

        {/* Live Preview Result */}
        {preview && expression ? (
          <Text style={styles.livePreviewText} numberOfLines={1}>
            = {preview}
          </Text>
        ) : null}

        {/* Main Result */}
        <Text
          style={styles.resultText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {formatDisplay(display)}
        </Text>
      </View>

      {/* Button Grid */}
      <View style={styles.buttonGrid}>
        {/* Row 1 */}
        <View style={styles.buttonRow}>
          <CalcButton label="C" onPress={handleClear} type="function" />
          <CalcButton label="±" onPress={handlePlusMinus} type="function" />
          <CalcButton label="%" onPress={handlePercent} type="function" />
          <CalcButton
            label="÷"
            onPress={() => handleOperator("/")}
            type="operator"
          />
        </View>

        {/* Row 2 */}
        <View style={styles.buttonRow}>
          <CalcButton label="7" onPress={() => handleNumber("7")} />
          <CalcButton label="8" onPress={() => handleNumber("8")} />
          <CalcButton label="9" onPress={() => handleNumber("9")} />
          <CalcButton
            label="×"
            onPress={() => handleOperator("*")}
            type="operator"
          />
        </View>

        {/* Row 3 */}
        <View style={styles.buttonRow}>
          <CalcButton label="4" onPress={() => handleNumber("4")} />
          <CalcButton label="5" onPress={() => handleNumber("5")} />
          <CalcButton label="6" onPress={() => handleNumber("6")} />
          <CalcButton
            label="−"
            onPress={() => handleOperator("-")}
            type="operator"
          />
        </View>

        {/* Row 4 */}
        <View style={styles.buttonRow}>
          <CalcButton label="1" onPress={() => handleNumber("1")} />
          <CalcButton label="2" onPress={() => handleNumber("2")} />
          <CalcButton label="3" onPress={() => handleNumber("3")} />
          <CalcButton
            label="+"
            onPress={() => handleOperator("+")}
            type="operator"
          />
        </View>

        {/* Row 5 */}
        <View style={styles.buttonRow}>
          <CalcButton label="0" onPress={() => handleNumber("0")} wide />
          <CalcButton label="." onPress={handleDecimal} />
          <CalcButton label="=" onPress={handleEquals} type="equals" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CalculatorColors.displayBackground,
  },
  displayContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  previewText: {
    fontSize: 20,
    color: CalculatorColors.textSecondary,
    textAlign: "right",
    marginBottom: Spacing.xs,
  },
  livePreviewText: {
    fontSize: 24,
    color: CalculatorColors.textSecondary,
    textAlign: "right",
    marginBottom: Spacing.sm,
  },
  resultText: {
    fontSize: 56,
    fontWeight: "300",
    color: CalculatorColors.textPrimary,
    textAlign: "right",
  },
  buttonGrid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: BUTTON_MARGIN,
  },
  button: {
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: BUTTON_MARGIN / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: "400",
  },
});
