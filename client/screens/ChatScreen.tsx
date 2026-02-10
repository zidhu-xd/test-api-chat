import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  AppState,
  AppStateStatus,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  SlideInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ScreenCapture from "expo-screen-capture";
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from "expo-notifications";

import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getPairingData, PairingData } from "@/lib/storage";
import {
  pollMessages,
  sendMessage,
  sendTypingIndicator,
  markMessagesRead,
  clearChat,
  Message,
} from "@/lib/api";
import { ThemeContext } from "@/context/ThemeContext";
import { initializeFirebaseNotifications, setupNotificationHandlers } from "@/lib/firebase-setup";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedImage = Animated.createAnimatedComponent(Image);

const POLL_INTERVAL = 1000;

interface MessageBubbleProps {
    message: Message;
    isSender: boolean;
    isLastSenderMessage: boolean;
}

// Typing indicator component with animated dots
function TypingIndicator() {
  const { theme } = useContext(ThemeContext);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ),
      -1,
      true
    );

    setTimeout(() => {
      dot2.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        true
      );
    }, 100);

    setTimeout(() => {
      dot3.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        true
      );
    }, 200);
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={styles.typingContainer}>
      <View style={[styles.typingBubble, { backgroundColor: theme.chat.receiverBubble }]}>
        <Animated.View style={[styles.typingDot, dot1Style, { backgroundColor: theme.chat.textOnBubbles }]} />
        <Animated.View style={[styles.typingDot, dot2Style, { backgroundColor: theme.chat.textOnBubbles }]} />
        <Animated.View style={[styles.typingDot, dot3Style, { backgroundColor: theme.chat.textOnBubbles }]} />
      </View>
    </View>
  );
}


// In MessageBubble component (modify to display images)
function MessageBubble({ message, isSender, isLastSenderMessage }: MessageBubbleProps) {
  const { theme } = useContext(ThemeContext);
  const isImage = message.content.startsWith('[IMAGE]:');
  const content = isImage ? message.content.replace('[IMAGE]:', '') : message.content;
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View
      style={[
        styles.messageBubbleContainer,
        isSender ? styles.senderContainer : styles.receiverContainer,
      ]}
      entering={isSender ? SlideInRight.duration(200) : FadeIn.duration(200)}
    >
      <View
        style={[
          styles.messageBubble,
          isSender ? [styles.senderBubble, { backgroundColor: theme.chat.senderBubble }] : [styles.receiverBubble, { backgroundColor: theme.chat.receiverBubble }],
        ]}
      >
        {isImage ? (
          <AnimatedImage source={{ uri: content }} style={{ width: 200, height: 200, borderRadius: 8 }} />
        ) : (
          <Text style={[styles.messageText, { color: theme.chat.textOnBubbles }]}>{content}</Text>
        )}
        <Text style={[styles.timestampText, { color: theme.chat.textOnBubbles + 'aa'}]}>{time}</Text>
      </View>
      {isSender && isLastSenderMessage && (
        <View style={styles.tickContainer}>
            <Feather name="check" size={12} color={message.read ? theme.chat.readReceiptBlue : theme.chat.tickGray} />
            <Feather name="check" size={12} color={message.read ? theme.chat.readReceiptBlue : theme.chat.tickGray} style={styles.secondTick} />
        </View>
      )}
    </Animated.View>
  );
}

// Empty state component
function EmptyState() {
    const { theme } = useContext(ThemeContext);
  return (
    <View style={styles.emptyStateContainer}>
      <View style={[styles.emptyStateIconContainer, { backgroundColor: theme.backgroundSecondary}]}>
        <Feather name="lock" size={48} color={theme.tabIconDefault} />
      </View>
      <Text style={[styles.emptyStateTitle, { color: theme.tabIconDefault }]}>Calc-XD</Text>
      <Text style={[styles.emptyStateSubtitle, { color: theme.tabIconDefault }]}>
        Welcome to Calc-XD.{"\n"}Start typing to send a message.
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useContext(ThemeContext);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [pairingData, setPairingData] = useState<PairingData | null>(null);
  const [isScreenVisible, setIsScreenVisible] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const lastMessageCountRef = useRef<number>(0);

  const sendButtonScale = useSharedValue(1);
  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  // Inside ChatScreen component
  const handlePickImage = async () => {
    if (!pairingData) return;
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
        // Logic to upload image via existing backend would go here
        // For now, we simulate sending the URI if the backend supports it
        await sendMessage(pairingData.pairId, pairingData.deviceId, `[IMAGE]:${result.assets[0].uri}`);
    }
  };

  // Prevent screenshots
  useEffect(() => {
    if (Platform.OS !== "web") {
      ScreenCapture.preventScreenCaptureAsync();
    }

    return () => {
      if (Platform.OS !== "web") {
        ScreenCapture.allowScreenCaptureAsync();
      }
    };
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Set notification handler
    const unsubscribeHandler = setupNotificationHandlers();

    // Initialize FCM notifications
    initializeFirebaseNotifications().then((success) => {
      if (success) {
        console.log("[v0] Notifications initialized successfully");
      } else {
        console.log("[v0] Failed to initialize notifications");
      }
    });

    // Handle notification taps (when user taps notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("[v0] Notification tapped, navigating to Calculator");
        navigation.reset({
          index: 0,
          routes: [{ name: "Calculator" }],
        });
      }
    );

    return () => {
      if (unsubscribeHandler) unsubscribeHandler();
      subscription.remove();
    };
  }, [navigation]);

  // Handle app state changes for stealth
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        setIsScreenVisible(false);
        // Navigate back to calculator when app goes to background
        navigation.reset({
          index: 0,
          routes: [{ name: "Calculator" }],
        });
      } else if (nextAppState === "active") {
        setIsScreenVisible(true);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  // Load pairing data
  useEffect(() => {
    async function loadPairingData() {
      const data = await getPairingData();
      if (data) {
        setPairingData(data);
      } else {
        // Not paired, go back to calculator
        navigation.reset({
          index: 0,
          routes: [{ name: "Calculator" }],
        });
      }
    }

    loadPairingData();
  }, [navigation]);

  // Poll for messages
  const fetchMessages = useCallback(async () => {
    if (!pairingData || !isScreenVisible) return;

    try {
      const response = await pollMessages(pairingData.pairId, pairingData.deviceId);

      if (response.success && response.data) {
        const newMessages = response.data.messages;

        // Check for new incoming messages (from partner)
        const incomingMessages = newMessages.filter(
          (msg) => msg.senderId !== pairingData.deviceId
        );
        const previousCount = lastMessageCountRef.current;
        const currentCount = incomingMessages.length;

        // If there are new messages from partner, send notification
        if (currentCount > previousCount && previousCount > 0 && Platform.OS !== "web") {
          const newCount = currentCount - previousCount;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "New XD Calculations Available!",
              body: "Check now",
              sound: "default",
              badge: newCount,
              data: {
                screen: "Chat",
              },
            },
            trigger: null, // Send immediately
          });
        }

        lastMessageCountRef.current = currentCount;
        setMessages(newMessages);
        setPartnerTyping(response.data.partnerTyping);

        // Mark unread messages as read
        const unreadMessages = newMessages.filter(
          (msg) => !msg.read && msg.senderId !== pairingData.deviceId
        );

        if (unreadMessages.length > 0) {
          await markMessagesRead(
            pairingData.pairId,
            pairingData.deviceId,
            unreadMessages.map((msg) => msg.id)
          );
        }
      }
    } catch {
      // Silently fail
    }
  }, [pairingData, isScreenVisible]);

  useEffect(() => {
    if (!pairingData) return;

    // Initial fetch
    fetchMessages();

    // Set up polling
    pollIntervalRef.current = setInterval(fetchMessages, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pairingData, fetchMessages]);

  // Handle typing indicator
  const handleTyping = useCallback(async () => {
    if (!pairingData) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 1000) {
      lastTypingSentRef.current = now;
      await sendTypingIndicator(pairingData.pairId, pairingData.deviceId, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(async () => {
      if (pairingData) {
        await sendTypingIndicator(pairingData.pairId, pairingData.deviceId, false);
      }
    }, 2000);
  }, [pairingData]);

  // Handle text change
  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text) {
      handleTyping();
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() || !pairingData) return;

    const content = inputText.trim();
    setInputText("");

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    await sendTypingIndicator(pairingData.pairId, pairingData.deviceId, false);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const response = await sendMessage(pairingData.pairId, pairingData.deviceId, content);

      if (response.success && response.data) {
        // Add optimistic message
        const newMessage: Message = {
          id: response.data.messageId,
          senderId: pairingData.deviceId,
          content,
          timestamp: response.data.timestamp,
          read: false,
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    } catch {
      // Show error feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  // Handle exit
  const handleExit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.reset({
      index: 0,
      routes: [{ name: "Calculator" }],
    });
  };

  // Handle clear chat
  const handleClearChat = async () => {
    if (!pairingData) return;

    setShowMenu(false);

    try {
      const response = await clearChat(pairingData.pairId, pairingData.deviceId);
      if (response.success) {
        setMessages([]);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch {
      // Silently fail
    }
  };

  const hasInput = inputText.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: theme.backgroundDefault
        },
      ]}
    >
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.backgroundTertiary }]}>
        <Pressable
          onPress={handleExit}
          style={styles.headerButton}
          hitSlop={16}
          testID="exit-button"
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Secure Chat</Text>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setShowMenu(!showMenu)}
            style={styles.headerButton}
            hitSlop={16}
          >
            <Feather name="more-vertical" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Menu Dropdown */}
      {showMenu ? (
        <Animated.View style={[styles.menuDropdown, { backgroundColor: theme.backgroundSecondary }]} entering={FadeIn.duration(150)}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('Settings');
            }}
          >
            <Feather name="settings" size={18} color={theme.text} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleClearChat}>
            <Feather name="trash-2" size={18} color={theme.danger} />
            <Text style={[styles.menuItemText, { color: theme.danger }]}>Clear Chat</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages.length > 0 ? [...messages].reverse() : []}
          keyExtractor={(item) => item.id}
          inverted={messages.length > 0}
          renderItem={({ item, index }) => {
            const isSender = item.senderId === pairingData?.deviceId;
            const isLastSenderMessage = isSender && (index === 0 || !messages.slice(0, index).some(m => m.senderId === pairingData?.deviceId));

            return (
              <MessageBubble
                message={item}
                isSender={isSender}
                isLastSenderMessage={isLastSenderMessage}
              />
            );
          }}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
          ListHeaderComponent={
            partnerTyping ? <TypingIndicator /> : null
          }
        />

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            { 
                paddingBottom: Math.max(insets.bottom, Spacing.md),
                backgroundColor: theme.backgroundSecondary, 
                borderTopColor: theme.backgroundTertiary 
            },
          ]}
        >
          <Pressable onPress={handlePickImage} style={styles.attachButton}>
            <Feather name="plus" size={24} color={theme.link} />
          </Pressable>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Message"
            placeholderTextColor={theme.tabIconDefault}
            multiline
            maxLength={1000}
            testID="message-input"
          />

          <AnimatedPressable
            onPress={handleSend}
            onPressIn={() => {
              sendButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
            }}
            onPressOut={() => {
              sendButtonScale.value = withSpring(1, { damping: 15, stiffness: 200 });
            }}
            disabled={!hasInput}
            style={[
              styles.sendButton,
              { backgroundColor: theme.link },
              sendButtonAnimatedStyle,
              !hasInput && styles.sendButtonDisabled,
            ]}
            testID="send-button"
          >
            <Feather name="send" size={20} color={theme.buttonText} />
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuDropdown: {
    position: "absolute",
    top: 100,
    right: Spacing.lg,
    borderRadius: BorderRadius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: 16,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexGrow: 1,
  },
  messagesListEmpty: {
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubbleContainer: {
    marginBottom: Spacing.sm,
    maxWidth: "75%",
  },
  senderContainer: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  receiverContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  senderBubble: {
    borderBottomRightRadius: Spacing.xs,
  },
  receiverBubble: {
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestampText: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  tickContainer: {
    flexDirection: "row",
    marginTop: 2,
    marginRight: 4,
  },
  secondTick: {
    marginLeft: -8,
  },
  typingContainer: {
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  typingBubble: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderBottomLeftRadius: Spacing.xs,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  attachButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
