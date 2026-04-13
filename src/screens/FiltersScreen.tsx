import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { DEFAULT_FILTER_LISTS, FilterList } from '../services/dns';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORY_COLORS: Record<string, string> = {
  ads:      colors.red,
  trackers: colors.accent,
  malware:  colors.yellow,
  regional: colors.green,
};

const CATEGORY_LABELS: Record<string, string> = {
  ads:      'Ads',
  trackers: 'Trackers',
  malware:  'Security',
  regional: 'Regional',
};

export default function FiltersScreen() {
  const [lists, setLists] = useState<FilterList[]>(DEFAULT_FILTER_LISTS);
  const [isPro, setIsPro] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadLists();
    checkPro();
  }, []);

  async function loadLists() {
    try {
      const saved = await AsyncStorage.getItem('filter_lists');
      if (saved) setLists(JSON.parse(saved));
    } catch (e) {}
  }

  async function saveLists(newLists: FilterList[]) {
    setLists(newLists);
    await AsyncStorage.setItem('filter_lists', JSON.stringify(newLists));
  }

  async function checkPro() {
    const license = await AsyncStorage.getItem('license_data');
    if (license) {
      const data = JSON.parse(license);
      setIsPro(data.valid && (data.plan === 'pro' || data.plan === 'business'));
    }
  }

  function toggleList(id: string, value: boolean) {
    const list = lists.find(l => l.id === id);
    if (list?.isPro && !isPro) {
      Alert.alert(
        'Pro Feature',
        'This filter list requires Purewall Pro. Upgrade for €4.99/year to unlock all filter lists.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => {} },
        ]
      );
      return;
    }
    saveLists(lists.map(l => l.id === id ? { ...l, enabled: value } : l));
  }

  async function updateList(id: string) {
    setUpdating(id);
    // Simüle liste güncelleme
    await new Promise(r => setTimeout(r, 1500));
    saveLists(lists.map(l => l.id === id ? { ...l, count: Math.floor(Math.random() * 50000 + 10000) } : l));
    setUpdating(null);
  }

  const grouped = lists.reduce((acc, list) => {
    if (!acc[list.category]) acc[list.category] = [];
    acc[list.category].push(list);
    return acc;
  }, {} as Record<string, FilterList[]>);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {!isPro && (
        <TouchableOpacity style={styles.proBanner}>
          <Ionicons name="star" size={16} color={colors.yellow} />
          <Text style={styles.proBannerText}>Upgrade to Pro — unlock all filter lists</Text>
          <Text style={styles.proBannerPrice}>€4.99/yr →</Text>
        </TouchableOpacity>
      )}

      {Object.entries(grouped).map(([cat, catLists]) => (
        <View key={cat} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
            <Text style={styles.sectionTitle}>{CATEGORY_LABELS[cat]}</Text>
            <Text style={styles.sectionCount}>
              {catLists.filter(l => l.enabled).length}/{catLists.length} active
            </Text>
          </View>

          {catLists.map(list => (
            <View key={list.id} style={styles.listCard}>
              <View style={styles.listMain}>
                <View style={styles.listNameRow}>
                  <Text style={styles.listName}>{list.name}</Text>
                  {list.isPro && !isPro && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
                <View style={styles.listMeta}>
                  {list.count ? (
                    <Text style={styles.listCount}>✓ {list.count.toLocaleString()} rules</Text>
                  ) : (
                    <Text style={styles.listCountPending}>
                      {list.enabled ? '⏳ Pending update' : '— Disabled'}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.listActions}>
                {updating === list.id ? (
                  <Ionicons name="refresh" size={18} color={colors.accent} />
                ) : (
                  <TouchableOpacity onPress={() => updateList(list.id)} style={styles.refreshBtn}>
                    <Ionicons name="refresh-outline" size={16} color={colors.muted} />
                  </TouchableOpacity>
                )}
                <Switch
                  value={list.enabled}
                  onValueChange={(v) => toggleList(list.id, v)}
                  trackColor={{ false: colors.s3, true: 'rgba(14,165,233,0.3)' }}
                  thumbColor={list.enabled ? colors.accent : colors.muted}
                  disabled={list.isPro && !isPro}
                />
              </View>
            </View>
          ))}
        </View>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    margin: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  proBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  proBannerPrice: {
    fontSize: 13,
    color: colors.yellow,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  sectionCount: {
    fontSize: 11,
    color: colors.muted,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  listMain: { flex: 1 },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  proBadge: {
    backgroundColor: 'rgba(14,165,233,0.12)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  listMeta: {
    marginTop: 3,
  },
  listCount: {
    fontSize: 11,
    color: colors.accent2,
    fontWeight: '600',
  },
  listCountPending: {
    fontSize: 11,
    color: colors.muted,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
