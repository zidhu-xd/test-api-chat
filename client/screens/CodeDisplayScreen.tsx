import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Spacing, BorderRadius, ChatColors, Typography } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getDeviceId, savePairingData } from "@/lib/storage";
import { generatePairingCode, checkPairingStatus } from "@/lib/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EXPIRY_MINUTES = 7;
const POLL_INTERVAL = 2000;

export default function CodeDisplayScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_MINUTES * 60);
  const [status, setStatus] = useState<"pending" | "paired">("pending");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  // Generate code on mount
  useEffect(() => {
    let mounted = true;

    async function generate() {
      try {
        const deviceId = await getDeviceId();
        deviceIdRef.current = deviceId;

        const response = await generatePairingCode(deviceId);

        if (!mounted) return;

        if (response.success && response.data) {
          setCode(response.data.code);
          setLoading(false);

          // Calculate time left from expiry
          const expiresAt = new Date(response.data.expiresAt).getTime();
          const now = Date.now();
          const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeLeft(secondsLeft);
        } else {
          setError(response.error || "Failed to generate code");
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setError("Failed to connect to server");
          setLoading(false);
        }
      }
    }

    generate();

    return () => {
      mounted = false;
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!code) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Code expired
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setError("Code expired. Please go back and generate a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [code]);

  // Poll for partner joining
  const checkStatus = useCallback(async () => {
    if (!code || !deviceIdRef.current) return;

    try {
      const response = await checkPairingStatus(deviceIdRef.current, code);

      if (response.success && response.data) {
        if (response.data.status === "paired") {
          setStatus("paired");

          // Save pairing data
          if (response.data.pairId && response.data.partnerDeviceId) {
            await savePairingData({
              pairId: response.data.pairId,
              deviceId: deviceIdRef.current,
              partnerDeviceId: response.data.partnerDeviceId,
              pairedAt: new Date().toISOString(),
            });

            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // Navigate to chat
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [
                  { name: "Calculator" },
                  { name: "Chat" },
                ],
              });
            }, 1000);
          }
        }
      }
    } catch {
      // Silently fail, will retry
    }
  }, [code, navigation]);

  useEffect(() => {
    if (!code) return;

    pollIntervalRef.current = setInterval(checkStatus, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [code, checkStatus]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isExpiringSoon = timeLeft < 120;

  if (loading) {
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
        <ActivityIndicator size="large" color={ChatColors.senderBubble} />
        <Text style={styles.loadingText}>Generating secure code...</Text>
      </View>
    );
  }

  if (error) {
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
        <View style={styles.errorIconContainer}>
          <Feather name="alert-circle" size={48} color={ChatColors.errorRed} />
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (status === "paired") {
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
        <Text style={styles.title}>Your Pairing Code</Text>
        <Text style={styles.subtitle}>
          Share this code with your partner. They need to enter it on their
          device.
        </Text>
      </Animated.View>

      <Animated.View
        style={styles.codeContainer}
        entering={FadeInDown.delay(200).duration(400)}
      >
        <Text style={styles.codeText}>{code}</Text>
      </Animated.View>

      <Animated.View
        style={styles.timerContainer}
        entering={FadeIn.delay(400).duration(400)}
      >
        <Feather
          name="clock"
          size={20}
          color={isExpiringSoon ? ChatColors.errorRed : "#8E8E93"}
        />
        <Text
          style={[
            styles.timerText,
            isExpiringSoon && styles.timerTextExpiring,
          ]}
        >
          Expires in {formatTime(timeLeft)}
        </Text>
      </Animated.View>

      <Animated.View
        style={styles.statusContainer}
        entering={FadeIn.delay(600).duration(400)}
      >
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="small" color={ChatColors.senderBubble} />
          <Text style={styles.waitingText}>Waiting for partner...</Text>
        </View>
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
  codeContainer: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing["2xl"],
    marginBottom: Spacing["2xl"],
  },
  codeText: {
    ...Typography.pairingCode,
    color: ChatColors.senderBubble,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
    gap: Spacing.sm,
  },
  timerText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  timerTextExpiring: {
    color: ChatColors.errorRed,
    fontWeight: "600",
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  waitingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: Spacing.xl,
  },
  errorIconContainer: {
    marginBottom: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: ChatColors.errorRed,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
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
