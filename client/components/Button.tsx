import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, Text, Dimensions, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, CalculatorColors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUTTON_MARGIN = 8;
const BUTTON_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - BUTTON_MARGIN * 8) / 4;


interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CalcButtonProps {
    label: string;
    onPress: () => void;
    type?: "number" | "operator" | "function" | "equals";
    wide?: boolean;
  }
  
export function CalcButton({
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
    
    const styles = StyleSheet.create({
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
