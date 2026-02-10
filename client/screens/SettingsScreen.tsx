import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TextInput, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { getPasscode, setPasscode, getSelectedIcon, setSelectedIcon, getDeviceId } from '@/lib/storage';
import { resetDevice } from '@/lib/api';
import { ThemeContext } from '@/context/ThemeContext';

const AVAILABLE_ICONS = [
  { id: 'calculator', name: 'Calculator', icon: 'grid-3x3' },
  { id: 'secure', name: 'Secure', icon: 'lock' },
  { id: 'shield', name: 'Shield', icon: 'shield' },
  { id: 'code', name: 'Code', icon: 'code' },
  { id: 'key', name: 'Key', icon: 'key' },
];

const AVAILABLE_THEMES = [
    { id: 'dark', name: 'Dark' },
    { id: 'matrix', name: 'Matrix' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'classic', name: 'Classic' },
  ];

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, themeName, setTheme } = useContext(ThemeContext);
  const [currentPasscode, setCurrentPasscode] = useState('1234');
  const [selectedIcon, setSelectedIconState] = useState('calculator');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
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

  const handleThemeSelect = async (themeId: keyof typeof Colors) => {
    setTheme(themeId);
    setShowThemeModal(false);
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
  const currentThemeLabel = AVAILABLE_THEMES.find(t => t.id === themeName)?.name || 'Unknown';

  const currentPinInput = pinStep === 'current' ? currentPin : pinStep === 'new' ? newPin : confirmPin;
  const setCurrentPinInput = pinStep === 'current' ? setCurrentPin : pinStep === 'new' ? setNewPin : setConfirmPin;
  const pinStepLabel = pinStep === 'current' ? 'Enter Current PIN' : pinStep === 'new' ? 'Enter New PIN' : 'Confirm New PIN';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.backgroundDefault }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.backgroundSecondary + '80' }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SECURITY SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.tabIconDefault }]}>Security</Text>
          
          {/* Change PIN */}
          <Pressable style={[styles.settingItem, { backgroundColor: theme.backgroundSecondary }]} onPress={() => setShowPinModal(true)}>
            <View style={styles.settingLeft}>
              <Feather name="lock" size={20} color={theme.link} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Change PIN</Text>
                <Text style={[styles.settingValue, { color: theme.tabIconDefault }]}>Update calculator unlock PIN</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tabIconDefault} />
          </Pressable>

          {/* Reset Device */}
          <Pressable style={[styles.settingItem, { backgroundColor: theme.backgroundSecondary }]} onPress={handleResetDevice}>
            <View style={styles.settingLeft}>
              <Feather name="refresh-cw" size={20} color={theme.link} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.link }]}>Reset Device</Text>
                <Text style={[styles.settingValue, { color: theme.tabIconDefault }]}>Enter 5678 to factory reset</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.link} />
          </Pressable>

          {/* Calculator Lock */}
          <View style={[styles.settingItem, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.settingLeft}>
              <Feather name="shield" size={20} color={theme.link} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Calculator Lock</Text>
                <Text style={[styles.settingValue, { color: theme.tabIconDefault }]}>Enabled</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.link + '20'}]}>
              <Text style={[styles.badgeText, { color: theme.link }]}>ON</Text>
            </View>
          </View>
        </View>

        {/* APPEARANCE SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.tabIconDefault }]}>Appearance</Text>
          
          {/* App Icon Selector */}
          <Pressable style={[styles.settingItem, { backgroundColor: theme.backgroundSecondary }]} onPress={() => setShowIconModal(true)}>
            <View style={styles.settingLeft}>
              <Feather name="image" size={20} color={theme.link} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>App Icon</Text>
                <Text style={[styles.settingValue, { color: theme.tabIconDefault }]}>{currentIconLabel}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tabIconDefault} />
          </Pressable>

          {/* Theme */}
          <Pressable style={[styles.settingItem, { backgroundColor: theme.backgroundSecondary }]} onPress={() => setShowThemeModal(true)}>
            <View style={styles.settingLeft}>
              <Feather name="moon" size={20} color={theme.link} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Theme</Text>
                <Text style={[styles.settingValue, { color: theme.tabIconDefault }]}>{currentThemeLabel}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tabIconDefault} />
          </Pressable>
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.tabIconDefault }]}>About</Text>
          
          {/* App Version */}
          <View style={[styles.settingItem, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.settingLeft}>
              <Feather name="info" size={20} color={theme.link} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>App Version</Text>
                <Text style={[styles.settingValue, { color: theme.tabIconDefault }]}>1.0.0</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tabIconDefault} />
          </View>

          {/* Device ID */}
          <View style={[styles.settingItem, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.settingLeft}>
              <Feather name="hash" size={20} color={theme.link} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Device ID</Text>
                <Text style={[styles.settingValueSmall, { color: theme.tabIconDefault }]}>Unique identifier</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.tabIconDefault} />
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{pinStepLabel}</Text>
            <TextInput
              style={[styles.pinInput, { backgroundColor: theme.backgroundDefault, color: theme.text }]} 
              placeholder="••••"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              value={currentPinInput}
              onChangeText={setCurrentPinInput}
              placeholderTextColor={theme.tabIconDefault}
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.cancelButton, { backgroundColor: theme.backgroundDefault }]} onPress={resetPinModal}>
                <Text style={[styles.cancelButtonText, { color: theme.tabIconDefault }]}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.submitButton, { backgroundColor: theme.link }, !currentPinInput && styles.submitButtonDisabled]} 
                onPress={handlePinSubmit}
                disabled={!currentPinInput}
              >
                <Text style={[styles.submitButtonText, { color: theme.buttonText }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Selector Modal */}
      <Modal visible={showIconModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select App Icon</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((icon) => (
                <Pressable 
                  key={icon.id} 
                  style={[
                    styles.iconOption, 
                    { backgroundColor: theme.backgroundDefault },
                    selectedIcon === icon.id && [styles.iconOptionSelected, { borderColor: theme.link, backgroundColor: theme.link + '20' }]
                  ]}
                  onPress={() => handleIconSelect(icon.id)}
                >
                  <Feather 
                    name={icon.icon as any} 
                    size={32} 
                    color={selectedIcon === icon.id ? theme.link : theme.tabIconDefault}
                  />
                  <Text style={[
                    styles.iconLabel, 
                    { color: theme.tabIconDefault },
                    selectedIcon === icon.id && [styles.iconLabelSelected, { color: theme.link }]
                  ]}>
                    {icon.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.link }]} onPress={() => setShowIconModal(false)}>
              <Text style={[styles.closeButtonText, { color: theme.buttonText }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Theme Selector Modal */}
      <Modal visible={showThemeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Theme</Text>
            <View style={styles.themeGrid}>
              {AVAILABLE_THEMES.map((availableTheme) => (
                <Pressable 
                  key={availableTheme.id} 
                  style={[
                    styles.themeOption, 
                    { backgroundColor: theme.backgroundDefault },
                    themeName === availableTheme.id && [styles.themeOptionSelected, { borderColor: theme.link, backgroundColor: theme.link + '20' }]
                  ]}
                  onPress={() => handleThemeSelect(availableTheme.id as keyof typeof Colors)}
                >
                  <Text style={[
                    styles.themeLabel, 
                    { color: theme.tabIconDefault },
                    themeName === availableTheme.id && [styles.themeLabelSelected, { color: theme.link }]
                  ]}>
                    {availableTheme.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.link }]} onPress={() => setShowThemeModal(false)}>
              <Text style={[styles.closeButtonText, { color: theme.buttonText }]}>Close</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
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
    marginBottom: Spacing.xs,
  },
  settingValue: { 
    fontSize: 13, 
    marginTop: Spacing.xs,
  },
  settingValueSmall: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '85%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  pinInput: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: 24,
    fontWeight: '700',
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
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: Spacing.md,
  },
  iconOptionSelected: {
    borderWidth: 2,
  },
  iconLabel: {
    fontSize: 12,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  iconLabelSelected: {},
  closeButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  themeOption: {
    width: '45%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  themeOptionSelected: {
    borderWidth: 2,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeLabelSelected: {},
});