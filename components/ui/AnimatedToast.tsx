import React, { useEffect } from 'react';
import { Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Check, X, Info } from 'lucide-react-native';

export type ToastKind = 'success' | 'error' | 'info';

export function AnimatedToast({
  message,
  kind = 'info',
  onHide,
  durationMs = 2400,
}: {
  message: string;
  kind?: ToastKind;
  onHide: () => void;
  durationMs?: number;
}) {
  const progress = useSharedValue(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: 420, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) return;
        progress.value = withDelay(
          durationMs,
          withTiming(2, { duration: 320, easing: Easing.in(Easing.cubic) }, (done) => {
            if (done) runOnJS(onHide)();
          }),
        );
      },
    );
  }, [durationMs, onHide, progress]);

  const bg = kind === 'success' ? '#10b981' : kind === 'error' ? '#ef4444' : '#111827';
  const Icon = kind === 'success' ? Check : kind === 'error' ? X : Info;

  const animStyle = useAnimatedStyle(() => {
    // 0->1 in, 1->2 out
    const t = progress.value;
    const inT = Math.min(1, t);
    const outT = t <= 1 ? 0 : Math.min(1, t - 1);

    const yIn = interpolate(inT, [0, 1], [-16, 0]);
    const yOut = interpolate(outT, [0, 1], [0, -12]);
    const opacity = t <= 1 ? inT : 1 - outT;

    return {
      transform: [{ translateY: yIn + yOut }, { scale: t <= 1 ? interpolate(inT, [0, 1], [0.98, 1]) : 1 }],
      opacity,
    };
  });

  return (
    <Animated.View pointerEvents="none" style={styles.wrap}>
      <Animated.View style={[styles.pill, { backgroundColor: bg, maxWidth: width - 36 }, animStyle]}>
        <Icon size={16} color="#fff" />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});
