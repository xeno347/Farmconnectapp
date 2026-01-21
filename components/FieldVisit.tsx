import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { motion } from './motion';
import { Calendar } from 'lucide-react-native';
import type { FieldVisit as Visit, VisitStatus } from './types';
import { VisitCard } from './VisitCard';
import { pickAccent } from './theme';
import { haptic } from './haptics';

const MotionPressable = motion.create(Pressable);

type Filter = 'All Visits' | VisitStatus;

export function FieldVisit({ visits }: { visits: Visit[] }) {
  const [filter, setFilter] = useState<Filter>('All Visits');

  const filtered = useMemo(() => {
    if (filter === 'All Visits') return visits;
    return visits.filter((v) => v.status === filter);
  }, [filter, visits]);

  const chips: Filter[] = ['All Visits', 'Scheduled', 'Completed', 'Overdue'];

  const headerAccent = useMemo(() => {
    const first = visits?.[0];
    if (!first) return pickAccent('green');
    return pickAccent(first.gradient as any);
  }, [visits]);

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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 4 }}
        >
          {chips.map((c) => {
            const active = c === filter;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  if (c !== filter) haptic('selection');
                  setFilter(c);
                }}
                style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
      >
        <View style={styles.sectionRow}>
          <View style={styles.sectionIcon}>
            <Calendar size={16} color="#4b7a55" />
          </View>
          <Text style={styles.sectionTitle}>Upcoming Visits</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Calendar size={24} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No visits scheduled</Text>
            <Text style={styles.emptySub}>Try changing the filter.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {filtered.map((v, i) => (
              <VisitCard key={v.id} visit={v} index={i} />
            ))}
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
