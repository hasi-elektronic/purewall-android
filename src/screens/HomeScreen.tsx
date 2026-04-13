import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, Animated, Dimensions,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { dnsService, BlockStat } from '../services/dns';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState({ totalBlocked: 0, domainsLoaded: 0 });
  const [recentLog, setRecentLog] = useState<BlockStat[]>([]);
  const [todayBlocked, setTodayBlocked] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  async function loadData() {
    await dnsService.initialize();
    const status = dnsService.getStatus();
    setIsActive(status.isActive);
    setStats({ totalBlocked: status.totalBlocked, domainsLoaded: status.domainsLoaded });
    const log = await dnsService.loadLog();
    setRecentLog(log.slice(0, 10));
    // Today blocked
    const today = Date.now() - 86400000;
    setTodayBlocked(log.filter(l => l.timestamp > today).length);
  }

  async function toggleDNS(value: boolean) {
    if (value) {
      await dnsService.start();
    } else {
      await dnsService.stop();
    }
    setIsActive(value);
    loadData();
  }

  const typeColor = (type: BlockStat['type']) => {
    if (type === 'ad') return colors.red;
    if (type === 'tracker') return colors.accent;
    return colors.yellow;
  };

  const typeLabel = (type: BlockStat['type']) => {
    if (type === 'ad') return 'AD';
    if (type === 'tracker') return 'TRACK';
    return 'MALWARE';
  };

  const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero — Power Button */}
      <View style={styles.heroSection}>
        {/* Glow rings */}
        {isActive && (
          <>
            <Animated.View style={[styles.glowRing, styles.glowRing3, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.glowRing, styles.glowRing2, { transform: [{ scale: pulseAnim }] }]} />
          </>
        )}

        <TouchableOpacity
          style={[styles.powerBtn, isActive && styles.powerBtnActive]}
          onPress={() => toggleDNS(!isActive)}
          activeOpacity={0.85}
        >
          <Ionicons
            name="power"
            size={48}
            color={isActive ? colors.accent : colors.muted}
          />
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {isActive ? 'Protection Active' : 'Protection Off'}
        </Text>
        <Text style={styles.statusSub}>
          {isActive
            ? `${stats.domainsLoaded.toLocaleString()} domains blocked`
            : 'Tap to enable DNS blocking'}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{todayBlocked.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.text }]}>
            {stats.totalBlocked.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>All Time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.green }]}>
            {stats.domainsLoaded.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Rules</Text>
        </View>
      </View>

      {/* Quick Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Settings</Text>
        {[
          { label: 'Block Ads', desc: 'Banners, video, popups', icon: 'ban-outline', key: 'ads' },
          { label: 'Block Trackers', desc: 'Analytics, pixels, beacons', icon: 'eye-off-outline', key: 'trackers' },
          { label: 'Block Malware', desc: 'Phishing & malicious domains', icon: 'shield-outline', key: 'malware' },
        ].map((item) => (
          <View key={item.key} style={styles.toggleRow}>
            <View style={styles.toggleIcon}>
              <Ionicons name={item.icon as any} size={18} color={colors.accent} />
            </View>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>{item.label}</Text>
              <Text style={styles.toggleDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={toggleDNS}
              trackColor={{ false: colors.s3, true: 'rgba(14,165,233,0.3)' }}
              thumbColor={isActive ? colors.accent : colors.muted}
            />
          </View>
        ))}
      </View>

      {/* Recent Blocked */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recently Blocked</Text>
        {recentLog.length === 0 ? (
          <View style={styles.emptyLog}>
            <Ionicons name="checkmark-circle-outline" size={32} color={colors.muted} />
            <Text style={styles.emptyText}>No blocked requests yet</Text>
          </View>
        ) : (
          recentLog.map((item, i) => (
            <View key={i} style={styles.logRow}>
              <View style={[styles.logType, { backgroundColor: typeColor(item.type) + '20', borderColor: typeColor(item.type) + '40' }]}>
                <Text style={[styles.logTypeText, { color: typeColor(item.type) }]}>
                  {typeLabel(item.type)}
                </Text>
              </View>
              <Text style={styles.logDomain} numberOfLines={1}>{item.domain}</Text>
              <Text style={styles.logTime}>{timeAgo(item.timestamp)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  glowRing2: {
    width: 140, height: 140,
    opacity: 0.2,
    top: 48 - 10,
  },
  glowRing3: {
    width: 180, height: 180,
    opacity: 0.1,
    top: 48 - 30,
  },
  powerBtn: {
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: colors.s1,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  powerBtnActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(14,165,233,0.08)',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  statusSub: {
    fontSize: 13,
    color: colors.muted,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  toggleRow: {
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
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(14,165,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleInfo: { flex: 1 },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  toggleDesc: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  emptyLog: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.s1,
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  logType: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  logTypeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logDomain: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
  },
  logTime: {
    fontSize: 10,
    color: colors.muted,
  },
});
