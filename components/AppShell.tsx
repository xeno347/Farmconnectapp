import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatePresence, motion } from './motion';
import type { ScreenName } from './types';
import { BottomNav } from './BottomNav';

const MotionView = motion.create(View);

export function AppShell({
  screen,
  children,
  onChangeScreen,
}: {
  screen: ScreenName;
  children: React.ReactNode;
  onChangeScreen: (s: ScreenName) => void;
}) {
  return (
    <View style={styles.root}>
      <AnimatePresence>
        <MotionView
          key={screen}
          style={styles.stage as any}
          exit={{ opacity: 0, scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {children}
        </MotionView>
      </AnimatePresence>

      <BottomNav active={screen} onChange={onChangeScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: { flex: 1 },
});
