import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { motion } from './motion';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
} from 'lucide-react-native';
import type { ServiceRequest, ServiceTimeline } from './types';
import { pickAccent, hexToRgba } from './theme';

const MotionView = motion.create(View);
const MotionPressable = motion.create(Pressable);

export const ServiceCard = memo(function ServiceCard({
  item,
  index,
  onOpenTimeline,
}: {
  item: ServiceRequest;
  index: number;
  onOpenTimeline?: (title: string, tl: ServiceTimeline) => void;
}) {
  const status = useMemo(() => {
    if (item.status === 'Completed') return { bg: '#dcfce7', text: '#166534', Icon: CheckCircle2 };
    if (item.status === 'Cancelled') return { bg: '#fee2e2', text: '#991b1b', Icon: XCircle };
    if (item.status === 'In Progress') return { bg: '#dbeafe', text: '#1e40af', Icon: Clock };
    if (item.status === 'Processing') return { bg: '#fef9c3', text: '#854d0e', Icon: AlertCircle };
    return { bg: '#fef9c3', text: '#854d0e', Icon: Clock };
  }, [item.status]);

  const accent = useMemo(() => pickAccent((item as any).color), [item]);

  return (
    <MotionView
      style={styles.cardShadow as any}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          </View>

          <View style={styles.rightTop}>
            <View style={[styles.statusIcon, { backgroundColor: hexToRgba(accent.a, 0.12) }]}>
              <status.Icon size={20} color={accent.a} />
            </View>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>{item.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <Calendar size={14} color={accent.a} />
          <Text style={styles.metaText}>{item.requestedDate}</Text>
        </View>

        {item.timeline && onOpenTimeline ? (
          <MotionPressable
            accessibilityRole="button"
            onPress={() => onOpenTimeline(item.title, item.timeline!)}
            style={[styles.viewTimelineBtn as any, { borderColor: hexToRgba(accent.a, 0.35) }]}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          >
            <Text style={[styles.viewTimelineBtnText, { color: accent.a }]}>View Timeline</Text>
            <ChevronRight size={18} color={accent.a} />
          </MotionPressable>
        ) : null}
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
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rightTop: {
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 2,
  },
  title: { color: '#111827', fontWeight: '900', fontSize: 18 },
  desc: { marginTop: 8, color: '#7b845f', fontWeight: '700', fontSize: 12, lineHeight: 16 },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: '#eef2ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    marginTop: 12,
    height: 1,
    backgroundColor: '#eef2ea',
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: { color: '#7b845f', fontWeight: '800', fontSize: 12 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusText: { fontWeight: '900', fontSize: 12 },
  viewTimelineBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  viewTimelineBtnText: { color: '#111827', fontWeight: '900' },
});
