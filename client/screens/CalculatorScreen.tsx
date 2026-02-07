import React, { useState, useCallback, useRef } from "react";
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

import { CalculatorColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  hasUnlockBeenUsed,
  markUnlockUsed,
  isPaired,
  getPasscode,
  fullDeviceReset,
  getDeviceId,
} from "@/lib/storage";
import { resetDevice } from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { CalculatorModel } from "@/lib/CalculatorModel";

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

  // MVP Pattern: Model instance
  const modelRef = useRef(new CalculatorModel());
  
  // View state: synced from model
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [preview, setPreview] = useState("");

  /**
   * Sync view from model
   * Called after any model state change
   */
  const syncViewFromModel = useCallback(() => {
    const state = modelRef.current.getState();
    setDisplay(state.display);
    setExpression(state.expression);
    setPreview(state.preview);
  }, []);

  /**
   * Presenter: Handle clear action
   */
  const handleClear = useCallback(() => {
    modelRef.current.clear();
    syncViewFromModel();
  }, [syncViewFromModel]);



  /**
   * Presenter: Handle number input
   */
  const handleNumber = useCallback(
    (num: string) => {
      modelRef.current.inputNumber(num);
      syncViewFromModel();
    },
    [syncViewFromModel]
  );

  /**
   * Presenter: Handle operator input
   */
  const handleOperator = useCallback(
    (op: string) => {
      modelRef.current.inputOperator(op);
      syncViewFromModel();
    },
    [syncViewFromModel]
  );

  /**
   * Presenter: Handle equals button
   * Delegates to model for calculation, then checks for special codes
   * PIN structure preserved: 4-digit unlock codes still work
   */
  const handleEquals = useCallback(async () => {
    // Get current input BEFORE finalization (for PIN checking)
    const currentInput = modelRef.current.getCurrentInput();
    const unlockCode = await getPasscode();

    // Check for factory reset code (5678)
    if (currentInput === FACTORY_RESET_CODE) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      try {
        const deviceId = await getDeviceId();
        await resetDevice(deviceId);
      } catch {
        console.log("[v0] Server reset failed, continuing with local reset");
      }
      
      await fullDeviceReset();
      handleClear();
      navigation.reset({
        index: 0,
        routes: [{ name: "Calculator" }],
      });
      return;
    }

    // Check for unlock code (4-digit PIN)
    if (currentInput === unlockCode) {
      const unlockUsed = await hasUnlockBeenUsed();
      const paired = await isPaired();

      if (paired) {
        await markUnlockUsed();
        navigation.navigate("Chat");
        handleClear();
        return;
      }

      if (!unlockUsed) {
        await markUnlockUsed();
        navigation.navigate("PairingChoice");
        handleClear();
        return;
      }
    }

    // Normal calculation: finalize result
    modelRef.current.finalize();
    syncViewFromModel();
  }, [navigation, handleClear, syncViewFromModel]);

  /**
   * Presenter: Handle percent button
   */
  const handlePercent = useCallback(() => {
    modelRef.current.inputPercent();
    syncViewFromModel();
  }, [syncViewFromModel]);

  /**
   * Presenter: Handle decimal input
   */
  const handleDecimal = useCallback(() => {
    modelRef.current.inputDecimal();
    syncViewFromModel();
  }, [syncViewFromModel]);

  /**
   * Presenter: Handle plus/minus toggle
   */
  const handlePlusMinus = useCallback(() => {
    modelRef.current.togglePlusMinus();
    syncViewFromModel();
  }, [syncViewFromModel]);

  /**
   * Format display for view (delegates to model)
   */
  const formatDisplay = (value: string): string => {
    return modelRef.current.formatDisplay(value);
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
    fontWeight: "600",
  },
  livePreviewText: {
    fontSize: 24,
    color: CalculatorColors.textSecondary,
    textAlign: "right",
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  resultText: {
    fontSize: 56,
    fontWeight: "700",
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
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: BUTTON_MARGIN / 2,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: "700",
  },
});
