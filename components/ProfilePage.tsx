import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { motion } from './motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
} from 'lucide-react-native';
import type { UserProfile } from './types';
import { pickAccent } from './theme';

const MotionPressable = motion.create(Pressable);

export function ProfilePage({
  profile,
  onLogout,
}: {
  profile: UserProfile;
  onLogout: () => void;
}) {
  const accent = useMemo(() => {
    // use a stable accent for profile; can later be driven by user preference
    return pickAccent('violet');
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { backgroundColor: accent.a }]}> 
        <View pointerEvents="none" style={[styles.headerOverlay, { backgroundColor: accent.b }]} />
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 }}
      >
        <View style={styles.profileCardShadow}>
          <View style={styles.profileCard}>
            <View style={styles.avatarShadow}>
              <View style={[styles.avatar, { backgroundColor: accent.a }]}>
                <User size={34} color="#fff" />
              </View>
            </View>

            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>{profile.role}</Text>

            <View style={styles.infoList}>
              <InfoRow icon={<Mail size={18} color={accent.a} />} label="Email" value={profile.email} />
              <InfoRow icon={<Phone size={18} color={accent.a} />} label="Phone" value={profile.phone} />
              <InfoRow icon={<MapPin size={18} color={accent.a} />} label="Farm Location" value={profile.location} />
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statTileShadow}>
            <View style={[styles.statTile, { borderColor: accent.a }]}> 
              <Text style={[styles.statValue, { color: accent.a }]}>{profile.stats.tasks}</Text>
              <Text style={styles.statLabel}>Tasks Completed</Text>
            </View>
          </View>
          <View style={styles.statTileShadow}>
            <View style={[styles.statTile, { borderColor: accent.a }]}> 
              <Text style={[styles.statValue, { color: accent.a }]}>{profile.stats.fields}</Text>
              <Text style={styles.statLabel}>Active Services</Text>
            </View>
          </View>
        </View>

        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Logout"
          onPress={onLogout}
          style={styles.logoutBtn as any}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          <LogOut size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </MotionPressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('More', 'Additional profile options are not implemented in this demo.')}
          style={{ marginTop: 12, alignSelf: 'center' }}
        >
          <Text style={{ color: '#7b845f', fontWeight: '800' }}>More options</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f2ea' },
  header: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    opacity: 0.32,
  },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900' },

  profileCardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
  },
  avatarShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: 12, color: '#111827', fontSize: 20, fontWeight: '900' },
  role: { marginTop: 6, color: '#7b845f', fontWeight: '800' },

  infoList: {
    marginTop: 18,
    width: '100%',
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { color: '#7b845f', fontWeight: '800', fontSize: 12 },
  infoValue: { marginTop: 2, color: '#111827', fontWeight: '900', fontSize: 14 },

  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 14,
  },
  statTileShadow: {
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  statTile: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eef2ea',
  },
  statValue: {
    fontWeight: '900',
    fontSize: 22,
  },
  statLabel: {
    marginTop: 6,
    color: '#7b845f',
    fontWeight: '800',
    fontSize: 12,
  },

  logoutBtn: {
    marginTop: 18,
    backgroundColor: '#e11d48',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  logoutText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
