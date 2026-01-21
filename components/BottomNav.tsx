import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { ScreenName } from './types';
import {
  LayoutDashboard,
  Map,
  Briefcase,
  User,
} from 'lucide-react-native';
import { motion } from './motion';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from './haptics';

const MotionPressable = motion.create(Pressable);

function NavItem({
  label,
  active,
  onPress,
  Icon,
  gradient,
  ariaLabel,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  gradient: [string, string];
  ariaLabel: string;
}) {
  const activeA = gradient[0];
  const activeB = gradient[1];

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      onPress={onPress}
      style={styles.item as any}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
      <View style={[styles.iconPill, active ? { backgroundColor: hexToRgba(activeA, 0.16) } : null]}>
        <View
          style={[
            styles.iconCircle,
            active
              ? {
                  backgroundColor: activeA,
                  shadowColor: activeA,
                }
              : { backgroundColor: '#f3f4f6' },
          ]}
        >
          <Icon size={22} color={active ? '#fff' : '#6b7280'} />
        </View>

        <Text style={[styles.label, active ? { color: activeA } : null]}>{label}</Text>
      </View>

      {/* subtle color underline for inactive state to keep it colorful */}
      {!active ? <View style={[styles.underline, { backgroundColor: hexToRgba(activeB, 0.35) }]} /> : null}
    </MotionPressable>
  );
}

export function BottomNav({
  active,
  onChange,
}: {
  active: ScreenName;
  onChange: (s: ScreenName) => void;
}) {
  const { width } = useWindowDimensions();

  const tabs = useMemo(
    () => [
      { key: 'dashboard' as const, label: 'Home', ariaLabel: 'Dashboard', Icon: LayoutDashboard, gradient: ['#22c55e', '#10b981'] as [string, string] },
      { key: 'fieldVisits' as const, label: 'Visits', ariaLabel: 'Field Visits', Icon: Map, gradient: ['#3b82f6', '#06b6d4'] as [string, string] },
      { key: 'services' as const, label: 'Services', ariaLabel: 'Services', Icon: Briefcase, gradient: ['#f97316', '#ef4444'] as [string, string] },
      { key: 'profile' as const, label: 'Profile', ariaLabel: 'Profile', Icon: User, gradient: ['#a855f7', '#8b5cf6'] as [string, string] },
    ],
    [],
  );

  const index = Math.max(0, tabs.findIndex((t) => t.key === active));

  const segW = (width - 16 * 2) / 4;
  const indicatorX = useSharedValue(segW * index + segW / 2);

  useEffect(() => {
    indicatorX.value = withSpring(segW * index + segW / 2, { stiffness: 420, damping: 26 });
  }, [index, segW, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value - 22 }],
    };
  });

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.container}>
        <Animated.View pointerEvents="none" style={[styles.activeDot, indicatorStyle]} />

        {tabs.map((t) => (
          <NavItem
            key={t.key}
            label={t.label}
            ariaLabel={t.ariaLabel}
            active={active === t.key}
            onPress={() => {
              if (active !== t.key) haptic('selection');
              onChange(t.key);
            }}
            Icon={t.Icon}
            gradient={t.gradient}
          />
        ))}
      </View>
    </View>
  );
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  container: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 26,
    paddingHorizontal: 10,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  iconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    minWidth: 78,
    gap: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
  },
  underline: {
    marginTop: 8,
    width: 30,
    height: 4,
    borderRadius: 999,
  },
  activeDot: {
    position: 'absolute',
    bottom: 6,
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.08,
  },
});
