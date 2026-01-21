import React from 'react';
import { Pressable, View, Animated } from 'react-native';

// Minimal Motion-like wrapper for React Native.
// This is intentionally JS-only (no Reanimated/worklets) and must remain compatible
// with our existing code that passes motion-only props.

function stripMotionProps(props: any) {
  // Remove motion-only props so they don't get forwarded to native components.
  // (Forwarding unknown props often breaks rendering / interactions.)
  const {
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    onPressIn,
    onPressOut,
    ...rest
  } = props;

  // Keep onPressIn/onPressOut if the caller provided them.
  if (props.onPressIn) rest.onPressIn = props.onPressIn;
  if (props.onPressOut) rest.onPressOut = props.onPressOut;

  return rest;
}

function getBaseComponent(Component: any) {
  // We frequently call motion.create(View) / motion.create(Pressable)
  // but sometimes pass in already-animated components.
  if (!Component) return View;
  return Component;
}

export const motion = {
  create(Component: any) {
    const Base = getBaseComponent(Component);

    return React.forwardRef<any, any>(function MotionCompat(props, ref) {
      const { style } = props;
      const cleaned = stripMotionProps(props);

      // IMPORTANT:
      // - Do NOT use Animated.createAnimatedComponent here; we aren't actually animating.
      // - On Android, forwarding unknown props to Pressable/View can break interaction.
      // - Keep it dumb + reliable.
      return <Base ref={ref} style={style} {...cleaned} />;
    });
  },
};

export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
