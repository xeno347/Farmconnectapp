import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';

export function IPhoneMockup({ children }: { children: ReactNode }) {
  return (
    <View style={styles.outer}>
      <View style={styles.device}>
        <View style={styles.screen}>{children}</View>
        <View style={styles.notch} />
        <View style={styles.homeIndicator} />
        <View style={styles.chromeTopRow} pointerEvents="none">
          <Text style={styles.time}>9:41</Text>
          <View style={styles.chromeIcons}>
            <View style={styles.signalBars}>
              <View style={[styles.bar, { height: 6 }]} />
              <View style={[styles.bar, { height: 8 }]} />
              <View style={[styles.bar, { height: 10 }]} />
              <View style={[styles.bar, { height: 12 }]} />
            </View>
            <View style={styles.wifi} />
            <View style={styles.battery}>
              <View style={styles.batteryFill} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  device: {
    borderRadius: 48,
    borderWidth: 14,
    borderColor: '#000',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 20,
    width: 390 + 28,
    height: 844 + 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: {
    width: 390,
    height: 844,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  notch: {
    position: 'absolute',
    top: 14 + 8,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 30,
    backgroundColor: '#000',
    borderRadius: 16,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 14 + 10,
    left: '50%',
    marginLeft: -(134 / 2),
    width: 134,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  chromeTopRow: {
    position: 'absolute',
    top: 14 + 10,
    left: 14 + 18,
    right: 14 + 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chromeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalBars: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
  },
  bar: {
    width: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    opacity: 0.9,
  },
  wifi: {
    width: 16,
    height: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#fff',
    opacity: 0.9,
  },
  battery: {
    width: 22,
    height: 10,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#fff',
    padding: 1,
    opacity: 0.9,
  },
  batteryFill: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
});
