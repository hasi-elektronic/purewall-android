import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LICENSE_API = 'https://purewall-api.hguencavdi.workers.dev';

export default function SettingsScreen() {
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseData, setLicenseData] = useState<any>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => { loadLicense(); }, []);

  async function loadLicense() {
    const key = await AsyncStorage.getItem('license_key');
    const data = await AsyncStorage.getItem('license_data');
    if (key) setLicenseKey(key);
    if (data) setLicenseData(JSON.parse(data));
  }

  async function activate() {
    const key = licenseKey.trim().toUpperCase();
    if (!key) return;
    setActivating(true);
    try {
      const resp = await fetch(`${LICENSE_API}/validate?key=${encodeURIComponent(key)}`);
      const data = await resp.json();
      if (data.valid) {
        await AsyncStorage.setItem('license_key', key);
        await AsyncStorage.setItem('license_data', JSON.stringify(data));
        setLicenseData(data);
        Alert.alert('✓ Activated!', `Welcome to Purewall ${data.plan.toUpperCase()}!`);
      } else {
        Alert.alert('Invalid Key', 'This license key is not valid or has expired.');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to license server. Check your connection.');
    }
    setActivating(false);
  }

  async function deactivate() {
    Alert.alert('Remove License', 'Return to Free plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('license_key');
          await AsyncStorage.removeItem('license_data');
          setLicenseData(null);
          setLicenseKey('');
        }
      }
    ]);
  }

  const isPro = licenseData?.valid && (licenseData.plan === 'pro' || licenseData.plan === 'business');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* License Status */}
      <View style={styles.licenseCard}>
        <View style={styles.licenseHeader}>
          <View style={[styles.licenseIcon, isPro && styles.licenseIconPro]}>
            <Ionicons name={isPro ? 'shield-checkmark' : 'lock-closed'} size={24} color={isPro ? colors.accent : colors.muted} />
          </View>
          <View style={styles.licenseInfo}>
            <Text style={styles.licensePlan}>
              {isPro ? `Purewall ${licenseData.plan.toUpperCase()}` : 'Free Plan'}
            </Text>
            <Text style={styles.licenseDesc}>
              {isPro ? (licenseData.email || 'All Pro features unlocked') : 'Upgrade to unlock all filter lists'}
            </Text>
          </View>
          <View style={[styles.licenseBadge, isPro && styles.licenseBadgePro]}>
            <Text style={[styles.licenseBadgeText, isPro && styles.licenseBadgeTextPro]}>
              {isPro ? licenseData.plan.toUpperCase() : 'FREE'}
            </Text>
          </View>
        </View>

        {!isPro ? (
          <>
            <View style={styles.keyInputRow}>
              <TextInput
                style={styles.keyInput}
                placeholder="PWPRO-XXXX-XXXX-XXXX-XXXX"
                placeholderTextColor={colors.muted}
                value={licenseKey}
                onChangeText={t => setLicenseKey(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.activateBtn, activating && styles.activateBtnDisabled]}
                onPress={activate}
                disabled={activating}
              >
                <Text style={styles.activateBtnText}>
                  {activating ? '...' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => Linking.openURL('https://getpurewall.com/#pricing')}
            >
              <Ionicons name="star" size={14} color="#0a0c10" />
              <Text style={styles.upgradeBtnText}>Get Pro — €4.99/year</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.deactivateBtn} onPress={deactivate}>
            <Text style={styles.deactivateBtnText}>Remove License</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pro Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pro Features</Text>
        {[
          { label: 'AdGuard Filters (5 lists)', locked: !isPro },
          { label: 'uBlock Origin Filters (5 lists)', locked: !isPro },
          { label: 'All Country Filters (12 countries)', locked: !isPro },
          { label: 'Priority Updates (6h interval)', locked: !isPro },
          { label: 'EasyList + EasyPrivacy', locked: false },
          { label: 'Malware Protection', locked: false },
          { label: 'Statistics Dashboard', locked: false },
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureCheck, !item.locked && styles.featureCheckActive]}>
              <Ionicons
                name={item.locked ? 'remove' : 'checkmark'}
                size={12}
                color={item.locked ? colors.muted : colors.green}
              />
            </View>
            <Text style={[styles.featureLabel, item.locked && styles.featureLabelLocked]}>
              {item.label}
            </Text>
            {item.locked && !isPro && (
              <TouchableOpacity onPress={() => Linking.openURL('https://getpurewall.com/#pricing')}>
                <Text style={styles.featureUpgrade}>Upgrade →</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Version</Text>
            <Text style={styles.aboutVal}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Developer</Text>
            <Text style={styles.aboutVal}>Hasi Elektronic</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Website</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://getpurewall.com')}>
              <Text style={[styles.aboutVal, { color: colors.accent }]}>getpurewall.com</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://purewall-privacy.pages.dev')}>
              <Text style={[styles.aboutVal, { color: colors.accent }]}>View Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  licenseCard: {
    margin: spacing.md,
    backgroundColor: colors.s1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  licenseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  licenseIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(107,114,128,0.12)',
    borderWidth: 1, borderColor: 'rgba(107,114,128,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  licenseIconPro: {
    backgroundColor: 'rgba(14,165,233,0.12)',
    borderColor: 'rgba(14,165,233,0.3)',
  },
  licenseInfo: { flex: 1 },
  licensePlan: { fontSize: 14, fontWeight: '700', color: colors.text },
  licenseDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  licenseBadge: {
    backgroundColor: 'rgba(107,114,128,0.12)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  licenseBadgePro: { backgroundColor: 'rgba(14,165,233,0.12)' },
  licenseBadgeText: { fontSize: 10, fontWeight: '700', color: colors.muted },
  licenseBadgeTextPro: { color: colors.accent2 },
  keyInputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  keyInput: {
    flex: 1,
    backgroundColor: colors.s2,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  activateBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 90,
  },
  activateBtnDisabled: { opacity: 0.5 },
  activateBtnText: { fontSize: 13, fontWeight: '700', color: '#0a0c10' },
  upgradeBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  upgradeBtnText: { fontSize: 14, fontWeight: '700', color: '#0a0c10' },
  deactivateBtn: {
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: radius.sm, padding: spacing.md, alignItems: 'center',
  },
  deactivateBtnText: { fontSize: 13, color: colors.red },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.s1, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  featureCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.s3, alignItems: 'center', justifyContent: 'center',
  },
  featureCheckActive: { backgroundColor: 'rgba(52,211,153,0.12)' },
  featureLabel: { flex: 1, fontSize: 13, color: colors.text },
  featureLabelLocked: { color: colors.muted },
  featureUpgrade: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  aboutCard: {
    backgroundColor: colors.s1, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  aboutRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  aboutKey: { fontSize: 13, color: colors.muted },
  aboutVal: { fontSize: 13, color: colors.text, fontWeight: '500' },
});
