import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Spacing, BorderRadius, ChatColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getDeviceId, savePairingData } from "@/lib/storage";
import { joinWithCode } from "@/lib/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CodeEntryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeX = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleCodeChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== 4) {
      setError("Please enter all 4 digits");
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const deviceId = await getDeviceId();
      const response = await joinWithCode(deviceId, fullCode);

      if (response.success && response.data) {
        await savePairingData({
          pairId: response.data.pairId,
          deviceId: response.data.deviceId,
          partnerDeviceId: response.data.partnerDeviceId,
          pairedAt: new Date().toISOString(),
        });

        setSuccess(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Navigate to chat
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Calculator" }, { name: "Chat" }],
          });
        }, 1000);
      } else {
        setError(response.error || "Invalid or expired code");
        setLoading(false);
        shakeX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch {
      setError("Failed to connect to server");
      setLoading(false);
    }
  };

  const isComplete = code.every((digit) => digit !== "");

  if (success) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View
          style={styles.successIconContainer}
          entering={FadeIn.duration(300)}
        >
          <Feather name="check-circle" size={64} color="#34C759" />
        </Animated.View>
        <Text style={styles.successText}>Paired Successfully!</Text>
        <Text style={styles.successSubtext}>Opening secure chat...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing["3xl"],
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Animated.View
        style={styles.headerContainer}
        entering={FadeIn.duration(400)}
      >
        <Text style={styles.title}>Enter Pairing Code</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code displayed on your partner's device.
        </Text>
      </Animated.View>

      <Animated.View
        style={[styles.codeInputContainer, shakeStyle]}
        entering={FadeInDown.delay(200).duration(400)}
      >
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.codeInput,
              digit && styles.codeInputFilled,
              error && styles.codeInputError,
            ]}
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            testID={`code-input-${index}`}
          />
        ))}
      </Animated.View>

      {error ? (
        <Animated.View
          style={styles.errorContainer}
          entering={FadeIn.duration(200)}
        >
          <Feather name="alert-circle" size={16} color={ChatColors.errorRed} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      <Animated.View
        style={styles.buttonContainer}
        entering={FadeIn.delay(400).duration(400)}
      >
        <AnimatedPressable
          onPress={handleSubmit}
          onPressIn={() => {
            buttonScale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
          }}
          onPressOut={() => {
            buttonScale.value = withSpring(1, { damping: 15, stiffness: 200 });
          }}
          disabled={loading || !isComplete}
          style={[
            styles.submitButton,
            buttonAnimatedStyle,
            (!isComplete || loading) && styles.submitButtonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Connect</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </>
          )}
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.lg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  codeInput: {
    width: 64,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F5F5F5",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    color: "#000000",
  },
  codeInputFilled: {
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderWidth: 2,
    borderColor: ChatColors.senderBubble,
  },
  codeInputError: {
    borderWidth: 2,
    borderColor: ChatColors.errorRed,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: ChatColors.errorRed,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ChatColors.senderBubble,
    borderRadius: BorderRadius.full,
    height: 56,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  successIconContainer: {
    marginBottom: Spacing.xl,
  },
  successText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#34C759",
    marginBottom: Spacing.sm,
  },
  successSubtext: {
    fontSize: 16,
    color: "#8E8E93",
  },
});
