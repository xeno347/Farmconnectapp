import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, X, Info } from 'lucide-react-native';

export type ToastKind = 'success' | 'error' | 'info';

export function Toast({
  message,
  kind = 'info',
  onHide,
  durationMs = 2500,
}: {
  message: string;
  kind?: ToastKind;
  onHide: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    const id = setTimeout(onHide, durationMs);
    return () => clearTimeout(id);
  }, [durationMs, onHide]);

  const bg =
    kind === 'success' ? '#10b981' : kind === 'error' ? '#ef4444' : '#111827';
  const Icon = kind === 'success' ? Check : kind === 'error' ? X : Info;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={[styles.pill, { backgroundColor: bg }]}>
        <Icon size={16} color="#fff" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
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
