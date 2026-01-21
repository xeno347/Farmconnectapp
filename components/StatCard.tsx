import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { motion } from './motion';

const MotionView = motion.create(View);

export const StatCard = memo(function StatCard({
  index,
  title,
  value,
  subtitle,
  icon,
  colors,
}: {
  index: number;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  colors: [string, string];
}) {
  return (
    <MotionView
      style={{ ...(styles.card as any), backgroundColor: colors[0] }}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring' }}
    >
      <View style={styles.iconRow}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
    </MotionView>
  );
});

const styles = StyleSheet.create({
  card: {
    minWidth: 140,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  iconRow: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  sub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
