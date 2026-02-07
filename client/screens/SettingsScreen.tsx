import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Spacing, BorderRadius, ChatColors } from '@/constants/theme';
import { getPasscode, setPasscode, clearAllData } from '@/lib/storage';

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [currentPasscode, setCurrentPasscode] = useState('1234');

  React.useEffect(() => {
    getPasscode().then(setCurrentPasscode);
  }, []);

  const handleUnpair = async () => {
    await clearAllData();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Calculator' }],
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <View style={styles.item}>
            <View>
              <Text style={styles.itemLabel}>Calculator Passcode</Text>
              <Text style={styles.itemValue}>{currentPasscode}</Text>
            </View>
            <Pressable onPress={() => {/* Logic to change passcode */}}>
              <Feather name="edit-2" size={20} color="#007AFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAIRING</Text>
          <Pressable style={styles.item} onPress={handleUnpair}>
            <Text style={[styles.itemLabel, { color: ChatColors.errorRed }]}>Unpair Device</Text>
            <Feather name="log-out" size={20} color={ChatColors.errorRed} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.item}>
            <Text style={styles.itemLabel}>App Icon</Text>
            <Text style={styles.itemValue}>Default</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  section: { marginTop: Spacing.xl },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  itemLabel: { fontSize: 16, color: '#000' },
  itemValue: { fontSize: 14, color: '#8E8E93' },
});
