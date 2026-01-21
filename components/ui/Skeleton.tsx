import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function Skeleton({
  style,
  radius = 12,
}: {
  style?: StyleProp<ViewStyle>;
  radius?: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t]);

  const anim = useAnimatedStyle(() => {
    const opacity = interpolate(t.value, [0, 1], [0.55, 0.85]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: '#e5e7eb',
          borderRadius: radius,
        },
        style as any,
        anim,
      ]}
    />
  );
}
