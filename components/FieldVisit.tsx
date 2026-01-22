import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { motion } from './motion';
import { Calendar } from 'lucide-react-native';
import type { FieldVisit as Visit } from './types';
import { pickAccent } from './theme';
import { haptic } from './haptics';
import { getJson } from './api';
import { getFarmerId } from './session';

const MotionPressable = motion.create(Pressable);

type RemoteFieldVisitRow = {
  date?: string;
  activity?: string;
  assigned_acres?: number;
  farm_id?: string;
};

function safeDate(input: string | Date): Date | null {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;

  const s = String(input).trim();
  if (!s) return null;

  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mon = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mon - 1, d, 12, 0, 0));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const dt2 = new Date(s);
  return Number.isNaN(dt2.getTime()) ? null : dt2;
}

function safeToLocaleDateString(d: Date | null, options?: Intl.DateTimeFormatOptions) {
  try {
    if (!d || Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, options);
  } catch {
    return '';
  }
}

export function FieldVisit({ visits }: { visits: Visit[] }) {
  const [rows, setRows] = useState<RemoteFieldVisitRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerAccent = useMemo(() => {
    const first = rows?.[0];
    if (!first) return pickAccent('green');

    // Keep this screen consistently "green" for now.
    return pickAccent('green');
  }, [rows]);

  async function loadRemote(nextIsRefreshing: boolean) {
    let didSetRefreshing = false;
    try {
      if (nextIsRefreshing) {
        setRefreshing(true);
        didSetRefreshing = true;
      } else {
        setLoading(true);
      }

      const farmerId = getFarmerId();
      if (!farmerId) {
        setRows([]);
        return;
      }

      // Note: endpoint spelling is from backend: "feild"
      const r = await getJson<any>(`/admin_cultivation/farmer_feild_visits/${encodeURIComponent(farmerId)}`);
      if (!r.ok) {
        setRows([]);
        return;
      }

      const raw = r.data;
      const list = Array.isArray(raw) ? raw : [];
      const mapped: RemoteFieldVisitRow[] = list
        .map((x: any) => {
          const activity = String(x?.activity ?? '').trim();
          const date = x?.date ? String(x.date) : undefined;
          const farm_id = x?.farm_id ? String(x.farm_id) : undefined;
          if (!activity && !date && !farm_id) return null;
          return {
            activity,
            date,
            farm_id,
            assigned_acres: typeof x?.assigned_acres === 'number' ? x.assigned_acres : Number(x?.assigned_acres),
          } satisfies RemoteFieldVisitRow;
        })
        .filter(Boolean) as RemoteFieldVisitRow[];

      setRows(mapped);
    } finally {
      setLoading(false);
      if (didSetRefreshing) setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadRemote(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { backgroundColor: headerAccent.a }]}>
        <View pointerEvents="none" style={[styles.headerOverlay, { backgroundColor: headerAccent.b }]} />

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Field Visits</Text>
            <Text style={styles.subtitle}>Schedule and track supervisor inspections</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <MotionPressable
            accessibilityRole="button"
            onPress={() => {
              haptic('selection');
              loadRemote(true);
            }}
            style={[styles.chip, styles.chipInactive]}
            whileTap={{ scale: 0.98 }}
          >
            <Text style={[styles.chipText, styles.chipTextInactive]}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
          </MotionPressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
      >
        <View style={styles.sectionRow}>
          <View style={styles.sectionIcon}>
            <Calendar size={16} color="#4b7a55" />
          </View>
          <Text style={styles.sectionTitle}>Field Visits</Text>
        </View>

        {loading ? (
          <View style={{ gap: 14 }}>
            {[0, 1, 2, 3].map((k) => (
              <View key={k} style={styles.card}>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={[styles.farmPill, { backgroundColor: '#f3f4f6' }]}>
                      <View style={{ width: 72, height: 12, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
                    </View>
                    <View style={{ width: 90, height: 12, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
                  </View>
                  <View style={{ width: '70%', height: 16, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
                  <View style={{ width: '55%', height: 14, backgroundColor: '#e5e7eb', borderRadius: 8 }} />
                </View>
              </View>
            ))}
          </View>
        ) : (rows ?? []).length === 0 ? (
          <View style={styles.empty}>
            <Calendar size={24} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No visits scheduled</Text>
            <Text style={styles.emptySub}>No field visit records found.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {(rows ?? []).map((r, i) => {
              const d = safeDate(r.date ?? '');
              const dateLabel = safeToLocaleDateString(d, { month: 'short', day: 'numeric', year: 'numeric' }) || (r.date ?? '—');
              const activity = String(r.activity ?? 'Field Visit');
              const farmId = String(r.farm_id ?? '');
              const farmSuffix = farmId ? farmId.slice(-5) : '—';

              return (
                <View key={`${farmId}-${r.date ?? 'd'}-${i}`} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.farmPill}>
                      <Text style={styles.farmPillText}>FARM {farmSuffix}</Text>
                    </View>
                    <Text style={styles.dateTextRow}>{dateLabel}</Text>
                  </View>

                  <Text style={styles.activityText} numberOfLines={2}>
                    {activity}
                  </Text>
                  <Text style={styles.metaText} numberOfLines={1}>
                    Farm ID: {farmId || '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f2ea' },
  header: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    opacity: 0.32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontWeight: '700',
    fontSize: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 10,
  },
  chipActive: { backgroundColor: '#eef2ea' },
  chipInactive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  chipText: { fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: '#1f2937' },
  chipTextInactive: { color: 'rgba(255,255,255,0.88)' },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#eef2ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { color: '#1f2937', fontWeight: '900', fontSize: 18 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmPill: {
    backgroundColor: '#eef2ea',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  farmPillText: {
    color: '#1f2937',
    fontWeight: '900',
    fontSize: 11,
  },
  dateTextRow: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 12,
  },
  activityText: {
    marginTop: 10,
    color: '#111827',
    fontWeight: '900',
    fontSize: 16,
  },
  metaText: {
    marginTop: 8,
    color: '#6b7280',
    fontWeight: '700',
    fontSize: 12,
  },

  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { color: '#111827', fontWeight: '900' },
  emptySub: { color: '#6b7280', fontWeight: '600', fontSize: 12 },
});
