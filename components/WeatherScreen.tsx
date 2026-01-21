import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CloudSun, Droplet, Wind } from 'lucide-react-native';

export function WeatherScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather</Text>
        <Text style={styles.subtitle}>Forecast (placeholder)</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <CloudSun size={24} color="#3b82f6" />
          <Text style={styles.main}>Sunny, 72°F</Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Droplet size={18} color="#06b6d4" />
            <Text style={styles.gridText}>Humidity: 42%</Text>
          </View>
          <View style={styles.gridItem}>
            <Wind size={18} color="#14b8a6" />
            <Text style={styles.gridText}>Wind: 8 mph</Text>
          </View>
        </View>
        <Text style={styles.note}>
          Hook this up to a real weather API when ready.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: '#3b82f6',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: '700', fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    margin: 24,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  main: { color: '#111827', fontWeight: '900', fontSize: 16 },
  grid: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gridText: { color: '#374151', fontWeight: '700', fontSize: 12 },
  note: { marginTop: 12, color: '#6b7280', fontWeight: '600', fontSize: 12 },
});
