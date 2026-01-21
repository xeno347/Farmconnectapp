import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { motion } from './motion';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react-native';
import type { FieldVisit } from './types';
import { pickAccent, hexToRgba } from './theme';

const MotionView = motion.create(View);
const MotionPressable = motion.create(Pressable);

export const VisitCard = memo(function VisitCard({
  visit,
  index,
}: {
  visit: FieldVisit;
  index: number;
}) {
  const status = useMemo(() => {
    if (visit.status === 'Completed') return { bg: '#dcfce7', text: '#166534' };
    if (visit.status === 'Overdue') return { bg: '#fee2e2', text: '#991b1b' };
    return { bg: '#dbeafe', text: '#1e40af' };
  }, [visit.status]);

  const accent = useMemo(() => pickAccent(visit.gradient as any), [visit.gradient]);

  return (
    <MotionView
      style={styles.cardShadow as any}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <View style={[styles.card, { borderColor: hexToRgba(accent.a, 0.55) }]}>
        <View style={styles.topRow}>
          <View style={styles.leftCol}>
            <View style={[styles.iconBadge, { backgroundColor: hexToRgba(accent.a, 0.12) }]}>
              <Calendar size={18} color={accent.a} />
            </View>

            <View>
              <Text style={styles.dateText}>{visit.date}</Text>
              <View style={styles.metaRow}>
                <Clock size={14} color="#7b845f" />
                <Text style={styles.metaText}>{visit.time}</Text>
              </View>
            </View>
          </View>

          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Open visit"
            onPress={() => {}}
            style={[styles.openBtn as any, { backgroundColor: hexToRgba(accent.a, 0.12) }]}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          >
            <ChevronRight size={18} color={accent.a} />
          </MotionPressable>
        </View>

        <View style={[styles.infoBox, { backgroundColor: hexToRgba(accent.a, 0.10) }]}>
          <View style={styles.metaRow}>
            <User size={14} color={accent.a} />
            <Text style={styles.infoLabel}>Assigned Supervisor</Text>
          </View>
          <Text style={styles.infoValue}>{visit.supervisor}</Text>
        </View>

        <View style={{ marginTop: 12, gap: 8 }}>
          <View style={styles.metaRow}>
            <MapPin size={14} color={accent.a} />
            <Text style={styles.locText}>{visit.fieldName}</Text>
          </View>
          <Text style={styles.descText}>{visit.findings}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{visit.status}</Text>
          </View>
        </View>
      </View>
    </MotionView>
  );
});

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#eef2ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    color: '#7b845f',
    fontWeight: '700',
    fontSize: 12,
  },
  openBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  infoBox: {
    marginTop: 12,
    backgroundColor: '#eef2ea',
    borderRadius: 14,
    padding: 12,
  },
  infoLabel: {
    color: '#7b845f',
    fontWeight: '800',
    fontSize: 12,
  },
  infoValue: {
    marginTop: 4,
    color: '#111827',
    fontWeight: '900',
    fontSize: 14,
  },
  locText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 13,
    flexShrink: 1,
  },
  descText: {
    color: '#7b845f',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
  },
  bottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: '900',
    fontSize: 12,
  },
});
