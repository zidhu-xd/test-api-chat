import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TextInput, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, BorderRadius, ChatColors, Colors } from '@/constants/theme';
import { getPasscode, setPasscode, getSelectedIcon, setSelectedIcon, getDeviceId } from '@/lib/storage';
import { resetDevice } from '@/lib/api';

const AVAILABLE_ICONS = [
  { id: 'calculator', name: 'Calculator', icon: 'grid-3x3' },
  { id: 'secure', name: 'Secure', icon: 'lock' },
  { id: 'shield', name: 'Shield', icon: 'shield' },
  { id: 'code', name: 'Code', icon: 'code' },
  { id: 'key', name: 'Key', icon: 'key' },
];

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [currentPasscode, setCurrentPasscode] = useState('1234');
  const [selectedIcon, setSelectedIconState] = useState('calculator');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('current');

  React.useEffect(() => {
    Promise.all([getPasscode(), getSelectedIcon()]).then(([p, i]) => {
      setCurrentPasscode(p);
      setSelectedIconState(i);
    });
  }, []);

  const resetPinModal = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinStep('current');
    setShowPinModal(false);
  };

  const handlePinSubmit = async () => {
    if (pinStep === 'current') {
      if (currentPin === currentPasscode) {
        setPinStep('new');
        setCurrentPin('');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Error', 'Current PIN is incorrect');
        setCurrentPin('');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else if (pinStep === 'new') {
      if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        Alert.alert('Error', 'PIN must be exactly 4 digits');
        return;
      }
      setPinStep('confirm');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (pinStep === 'confirm') {
      if (newPin === confirmPin) {
        await setPasscode(newPin);
        setCurrentPasscode(newPin);
        Alert.alert('Success', 'Calculator PIN updated');
        resetPinModal();
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Error', 'PINs do not match');
        setConfirmPin('');
      }
    }
  };

  const handleIconSelect = async (iconId: string) => {
    setSelectedIconState(iconId);
    await setSelectedIcon(iconId);
    setShowIconModal(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleResetDevice = async () => {
    Alert.alert(
      'Reset Device',
      'This will completely reset your device and unpair it. Enter 5678 on the calculator to perform factory reset.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const currentIconLabel = AVAILABLE_ICONS.find(i => i.id === selectedIcon)?.name || 'Unknown';

  const currentPinInput = pinStep === 'current' ? currentPin : pinStep === 'new' ? newPin : confirmPin;
  const setCurrentPinInput = pinStep === 'current' ? setCurrentPin : pinStep === 'new' ? setNewPin : setConfirmPin;
  const pinStepLabel = pinStep === 'current' ? 'Enter Current PIN' : pinStep === 'new' ? 'Enter New PIN' : 'Confirm New PIN';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: ChatColors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={ChatColors.textOnBubbles} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SECURITY SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          {/* Change PIN */}
          <Pressable style={styles.settingItem} onPress={() => setShowPinModal(true)}>
            <View style={styles.settingLeft}>
              <Feather name="lock" size={20} color={ChatColors.readReceiptBlue} style={styles.icon} />
              <View>
                <Text style={styles.settingLabel}>Change PIN</Text>
                <Text style={styles.settingValue}>Update calculator unlock PIN</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ChatColors.textSecondary} />
          </Pressable>

          {/* Reset Device */}
          <Pressable style={styles.settingItem} onPress={handleResetDevice}>
            <View style={styles.settingLeft}>
              <Feather name="refresh-cw" size={20} color={ChatColors.errorRed} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: ChatColors.errorRed }]}>Reset Device</Text>
                <Text style={styles.settingValue}>Enter 5678 to factory reset</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ChatColors.errorRed} />
          </Pressable>

          {/* Calculator Lock */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="shield" size={20} color={ChatColors.readReceiptBlue} style={styles.icon} />
              <View>
                <Text style={styles.settingLabel}>Calculator Lock</Text>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ON</Text>
            </View>
          </View>
        </View>

        {/* APPEARANCE SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          {/* App Icon Selector */}
          <Pressable style={styles.settingItem} onPress={() => setShowIconModal(true)}>
            <View style={styles.settingLeft}>
              <Feather name="image" size={20} color={ChatColors.readReceiptBlue} style={styles.icon} />
              <View>
                <Text style={styles.settingLabel}>App Icon</Text>
                <Text style={styles.settingValue}>{currentIconLabel}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ChatColors.textSecondary} />
          </Pressable>

          {/* Theme */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="moon" size={20} color={ChatColors.readReceiptBlue} style={styles.icon} />
              <View>
                <Text style={styles.settingLabel}>Theme</Text>
                <Text style={styles.settingValue}>Dark (Minimal Bold)</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ON</Text>
            </View>
          </View>
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>About</Text>
          
          {/* App Version */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="info" size={20} color={ChatColors.readReceiptBlue} style={styles.icon} />
              <View>
                <Text style={styles.settingLabel}>App Version</Text>
                <Text style={styles.settingValue}>1.0.0</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ChatColors.textSecondary} />
          </View>

          {/* Device ID */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="hash" size={20} color={ChatColors.readReceiptBlue} style={styles.icon} />
              <View>
                <Text style={styles.settingLabel}>Device ID</Text>
                <Text style={styles.settingValueSmall}>Unique identifier</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ChatColors.textSecondary} />
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{pinStepLabel}</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="••••"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              value={currentPinInput}
              onChangeText={setCurrentPinInput}
              placeholderTextColor={ChatColors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={resetPinModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.submitButton, !currentPinInput && styles.submitButtonDisabled]} 
                onPress={handlePinSubmit}
                disabled={!currentPinInput}
              >
                <Text style={styles.submitButtonText}>Next</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Selector Modal */}
      <Modal visible={showIconModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select App Icon</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((icon) => (
                <Pressable 
                  key={icon.id} 
                  style={[
                    styles.iconOption, 
                    selectedIcon === icon.id && styles.iconOptionSelected
                  ]}
                  onPress={() => handleIconSelect(icon.id)}
                >
                  <Feather 
                    name={icon.icon as any} 
                    size={32} 
                    color={selectedIcon === icon.id ? ChatColors.readReceiptBlue : ChatColors.textSecondary}
                  />
                  <Text style={[
                    styles.iconLabel, 
                    selectedIcon === icon.id && styles.iconLabelSelected
                  ]}>
                    {icon.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.closeButton} onPress={() => setShowIconModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: ChatColors.surface
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ChatColors.textSecondary + '20',
  },
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700',
    color: ChatColors.textOnBubbles
  },
  content: { 
    flex: 1, 
    paddingHorizontal: Spacing.lg
  },
  sectionContainer: {
    marginTop: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ChatColors.textSecondary,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: ChatColors.receiverBubble,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: Spacing.lg,
  },
  settingLabel: { 
    fontSize: 16, 
    fontWeight: '600',
    color: ChatColors.textOnBubbles,
    marginBottom: Spacing.xs,
  },
  settingValue: { 
    fontSize: 13, 
    color: ChatColors.textSecondary,
    marginTop: Spacing.xs,
  },
  settingValueSmall: {
    fontSize: 12,
    color: ChatColors.textSecondary,
    marginTop: Spacing.xs,
  },
  badge: {
    backgroundColor: ChatColors.readReceiptBlue + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ChatColors.readReceiptBlue,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: ChatColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '85%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChatColors.textOnBubbles,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: ChatColors.receiverBubble,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: 24,
    fontWeight: '700',
    color: ChatColors.textOnBubbles,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: ChatColors.receiverBubble,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ChatColors.textSecondary,
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: ChatColors.readReceiptBlue,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ChatColors.textOnBubbles,
    textAlign: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  iconOption: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: ChatColors.receiverBubble,
    marginBottom: Spacing.md,
  },
  iconOptionSelected: {
    backgroundColor: ChatColors.readReceiptBlue + '30',
    borderWidth: 2,
    borderColor: ChatColors.readReceiptBlue,
  },
  iconLabel: {
    fontSize: 12,
    color: ChatColors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  iconLabelSelected: {
    color: ChatColors.readReceiptBlue,
  },
  closeButton: {
    backgroundColor: ChatColors.readReceiptBlue,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ChatColors.textOnBubbles,
    textAlign: 'center',
  },
});
