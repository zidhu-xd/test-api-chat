import React, { useContext } from "react";
import { View, StyleSheet, Pressable, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ThemeContext } from "@/context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OptionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay?: number;
}

function OptionButton({
  icon,
  title,
  subtitle,
  onPress,
  delay = 0,
}: OptionButtonProps) {
  const { theme } = useContext(ThemeContext);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(400)}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.optionButton, { backgroundColor: theme.backgroundSecondary }, animatedStyle]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.link + '20'}]}>
          <Feather name={icon} size={32} color={theme.link} />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.optionSubtitle, { color: theme.tabIconDefault }]}>{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={24} color={theme.tabIconDefault} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function PairingChoiceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useContext(ThemeContext);

  const handleGenerate = () => {
    navigation.navigate("CodeDisplay");
  };

  const handleEnter = () => {
    navigation.navigate("CodeEntry");
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing["3xl"],
          paddingBottom: insets.bottom + Spacing.xl,
          backgroundColor: theme.backgroundDefault,
        },
      ]}
    >
      <Animated.View
        style={styles.headerContainer}
        entering={FadeIn.duration(400)}
      >
        <View style={[styles.lockIconContainer, { backgroundColor: theme.link + '20'}]}>
          <Feather name="lock" size={48} color={theme.link} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Secure Pairing</Text>
        <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>
          Connect with your partner to start a private conversation. Only two
          devices can be linked.
        </Text>
      </Animated.View>

      <View style={styles.optionsContainer}>
        <OptionButton
          icon="plus-circle"
          title="Generate Code"
          subtitle="Create a code for your partner to enter"
          onPress={handleGenerate}
          delay={100}
        />

        <OptionButton
          icon="edit-3"
          title="Enter Code"
          subtitle="Enter a code from your partner"
          onPress={handleEnter}
          delay={200}
        />
      </View>

      <Animated.View
        style={styles.footerContainer}
        entering={FadeIn.delay(300).duration(400)}
      >
        <Text style={[styles.footerText, { color: theme.tabIconDefault }]}>
          Codes expire after 7 minutes for security
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  lockIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  optionsContainer: {
    gap: Spacing.lg,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  footerContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    textAlign: "center",
  },
});
