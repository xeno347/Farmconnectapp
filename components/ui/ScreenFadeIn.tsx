import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function ScreenFadeIn({ children }: { children: React.ReactNode }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [t]);

  const style = useAnimatedStyle(() => {
    return {
      opacity: t.value,
      transform: [{ translateY: (1 - t.value) * 6 }],
    };
  });

  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}
