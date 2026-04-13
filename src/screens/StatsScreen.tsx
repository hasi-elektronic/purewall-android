import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { dnsService, BlockStat } from '../services/dns';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [log, setLog] = useState<BlockStat[]>([]);
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [filter, setFilter] = useState<'all' | 'ad' | 'tracker' | 'malware'>('all');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 3000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    const l = await dnsService.loadLog();
    setLog(l);
    setTotalBlocked(dnsService.getTotalBlocked());
  }

  async function resetStats() {
    await dnsService.resetStats();
    setLog([]);
    setTotalBlocked(0);
  }

  const filtered = filter === 'all' ? log : log.filter(l => l.type === filter);

  const adCount      = log.filter(l => l.type === 'ad').length;
  const trackerCount = log.filter(l => l.type === 'tracker').length;
  const malwareCount = log.filter(l => l.type === 'malware').length;
  const total        = log.length || 1;

  const typeColor = (type: string) => {
    if (type === 'ad') return colors.red;
    if (type === 'tracker') return colors.accent;
    return colors.yellow;
  };

  const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s/60)}m`;
    return `${Math.floor(s/3600)}h`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalNum}>{totalBlocked.toLocaleString()}</Text>
        <Text style={styles.totalLabel}>Total Blocked</Text>
        <TouchableOpacity onPress={resetStats} style={styles.resetBtn}>
          <Ionicons name="trash-outline" size={14} color={colors.muted} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakCard}>
          <Text style={[styles.breakNum, { color: colors.red }]}>{adCount}</Text>
          <Text style={styles.breakLabel}>Ads</Text>
        </View>
        <View style={styles.breakCard}>
          <Text style={[styles.breakNum, { color: colors.accent }]}>{trackerCount}</Text>
          <Text style={styles.breakLabel}>Trackers</Text>
        </View>
        <View style={styles.breakCard}>
          <Text style={[styles.breakNum, { color: colors.yellow }]}>{malwareCount}</Text>
          <Text style={styles.breakLabel}>Malware</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Breakdown</Text>
        {[
          { label: 'Ads',      count: adCount,      color: colors.red },
          { label: 'Trackers', count: trackerCount,  color: colors.accent },
          { label: 'Malware',  count: malwareCount,  color: colors.yellow },
        ].map(item => (
          <View key={item.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barTrack}>
              <View style={[
                styles.barFill,
                { width: `${(item.count / total) * 100}%`, backgroundColor: item.color }
              ]} />
            </View>
            <Text style={[styles.barCount, { color: item.color }]}>{item.count}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'ad', 'tracker', 'malware'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : f === 'ad' ? 'Ads' : f === 'tracker' ? 'Trackers' : 'Malware'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Log */}
      <View style={styles.logSection}>
        {filtered.length === 0 ? (
          <View style={styles.emptyLog}>
            <Ionicons name="checkmark-circle-outline" size={32} color={colors.muted} />
            <Text style={styles.emptyText}>No blocked requests</Text>
          </View>
        ) : (
          filtered.map((item, i) => (
            <View key={i} style={styles.logRow}>
              <View style={[styles.logType, {
                backgroundColor: typeColor(item.type) + '20',
                borderColor: typeColor(item.type) + '40',
              }]}>
                <Text style={[styles.logTypeText, { color: typeColor(item.type) }]}>
                  {item.type === 'ad' ? 'AD' : item.type === 'tracker' ? 'TRK' : 'MAL'}
                </Text>
              </View>
              <View style={styles.logInfo}>
                <Text style={styles.logDomain} numberOfLines={1}>{item.domain}</Text>
                {item.appName && (
                  <Text style={styles.logApp} numberOfLines={1}>{item.appName}</Text>
                )}
              </View>
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
  container: { flex: 1, backgroundColor: colors.bg },
  totalCard: {
    margin: spacing.md,
    backgroundColor: colors.s1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalNum: {
    fontSize: 52,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -2,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: { fontSize: 12, color: colors.muted },
  breakdownRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  breakCard: {
    flex: 1,
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakNum: { fontSize: 20, fontWeight: '700' },
  breakLabel: { fontSize: 10, color: colors.muted, marginTop: 3, fontWeight: '600', textTransform: 'uppercase' },
  chartCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  chartTitle: { fontSize: 12, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  barLabel: { fontSize: 12, color: colors.muted, width: 60 },
  barTrack: { flex: 1, height: 6, backgroundColor: colors.s3, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  barCount: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTab: {
    flex: 1, paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.s1,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  filterTabActive: { backgroundColor: 'rgba(14,165,233,0.12)', borderColor: colors.accent },
  filterTabText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  filterTabTextActive: { color: colors.accent },
  logSection: { paddingHorizontal: spacing.md },
  emptyLog: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.s1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  emptyText: { fontSize: 13, color: colors.muted },
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
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  logTypeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  logInfo: { flex: 1 },
  logDomain: { fontSize: 12, color: colors.text, fontFamily: 'monospace' },
  logApp: { fontSize: 10, color: colors.muted, marginTop: 1 },
  logTime: { fontSize: 10, color: colors.muted },
});
