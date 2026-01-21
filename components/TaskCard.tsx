import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { motion } from './motion';
import {
  Droplet,
  Sprout,
  Bug,
  Tractor,
  FileText,
  Package,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import type { Task } from './types';
import { pickAccent, hexToRgba } from './theme';
import { haptic } from './haptics';

const MotionView = motion.create(View);
const MotionPressable = motion.create(Pressable);

const ICONS = {
  droplet: Droplet,
  sprout: Sprout,
  bug: Bug,
  tractor: Tractor,
  filetext: FileText,
  package: Package,
} as const;

export const TaskCard = memo(function TaskCard({
  task,
  index,
  onMarkDone,
}: {
  task: Task;
  index: number;
  onMarkDone: (t: Task) => void;
}) {
  const Icon = ICONS[task.icon] ?? FileText;

  const accent = useMemo(() => pickAccent(task.color === 'purple' ? ('violet' as any) : (task.color as any)), [task.color]);

  const statusPill = useMemo(() => {
    if (task.status === 'Completed') return { bg: '#dcfce7', text: '#166534', label: 'Done' };
    if (task.status === 'Urgent') return { bg: '#fee2e2', text: '#991b1b', label: 'Urgent' };
    if (task.status === 'In Progress') return { bg: '#dbeafe', text: '#1e40af', label: 'In Progress' };
    return { bg: '#fef9c3', text: '#854d0e', label: 'Pending' };
  }, [task.status]);

  return (
    <MotionView
      style={styles.card as any}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 360, damping: 26 }}
    >
      <View style={styles.row}>
        <View style={[styles.leftIcon, { backgroundColor: hexToRgba(accent.a, 0.10), borderColor: hexToRgba(accent.a, 0.25) }]}>
          <Icon size={18} color={accent.a} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
          <View style={styles.metaRow}>
            <MapPin size={14} color="#7b845f" />
            <Text style={styles.metaText} numberOfLines={1}>{task.field}</Text>
          </View>
          {task.harvestDate ? (
            <View style={styles.metaRow}>
              <Calendar size={14} color="#7b845f" />
              <Text style={styles.metaText}>Due: {task.harvestDate}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightCol}>
          <View style={[styles.statusPill, { backgroundColor: statusPill.bg }]}>
            <Text style={[styles.statusText, { color: statusPill.text }]}>{statusPill.label}</Text>
          </View>

          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Mark task done"
            onPress={() => {
              haptic(task.status === 'Completed' ? 'selection' : 'success');
              onMarkDone(task);
            }}
            style={styles.checkBtn as any}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          >
            {task.status === 'Completed' ? (
              <CheckCircle2 size={22} color="#16a34a" />
            ) : (
              <View style={styles.emptyCircle} />
            )}
          </MotionPressable>
        </View>
      </View>

      {!!task.description ? (
        <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>
      ) : null}
    </MotionView>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  leftIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 16,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#7b845f',
    fontWeight: '700',
    fontSize: 12,
    flexShrink: 1,
  },
  desc: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: '900',
    fontSize: 11,
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#7b845f',
    opacity: 0.65,
  },
});
