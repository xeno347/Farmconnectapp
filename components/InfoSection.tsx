import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { motion } from './motion';

const MotionView = motion.create(View);

export const InfoSection = memo(function InfoSection({
  index,
  title,
  icon,
  rows,
}: {
  index: number;
  title: string;
  icon: React.ReactNode;
  rows: Array<{ label: string; value: string; leftIcon?: React.ReactNode }>;
}) {
  return (
    <MotionView
      style={styles.card as any}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      <View style={{ marginTop: 12, gap: 10 }}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <View style={styles.rowLeft}>
              {r.leftIcon}
              <Text style={styles.rowLabel}>{r.label}</Text>
            </View>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>
    </MotionView>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  rowValue: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
});
