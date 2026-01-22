import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
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
import { getJson } from './api';
import { getFarmerId } from './session';

const MotionPressable = motion.create(Pressable);

export function ProfilePage({
  profile,
  onLogout,
}: {
  profile: UserProfile;
  onLogout: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<FarmerDetailsResponse['farmer'] | null>(null);

  const accent = useMemo(() => {
    // use a stable accent for profile; can later be driven by user preference
    return pickAccent('violet');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      try {
        setLoading(true);

        const farmerId = getFarmerId();
        if (!farmerId) {
          if (!cancelled) setDetails(null);
          return;
        }

        // Note: endpoint spelling is from backend: "managment"
        const r = await getJson<FarmerDetailsResponse>(`/farmer_managment/farmer_details/${encodeURIComponent(farmerId)}`);
        if (!r.ok) return;

        const farmer = (r.data as any)?.farmer ?? null;
        if (!cancelled) setDetails(farmer);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, []);

  const farmerData = details?.farmer_data;
  const kycData = details?.kyc_data;
  const coords = farmerData?.land_coordinates;
  const lat = typeof coords?.[0] === 'number' ? coords[0] : Number(coords?.[0]);
  const lon = typeof coords?.[1] === 'number' ? coords[1] : Number(coords?.[1]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  const displayName = String(farmerData?.full_name ?? profile.name ?? '');
  const displayRole = profile.role || 'Farmer';

  const phonePrimary = String(farmerData?.phone_number ?? profile.phone ?? '');
  const location = [farmerData?.village, farmerData?.taluka, farmerData?.district, farmerData?.state]
    .filter(Boolean)
    .map(String)
    .join(', ');

  const openInMaps = () => {
    if (!hasCoords) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`;
    Linking.openURL(url).catch(() => {
      // ignore
    });
  };

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

            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.role}>{displayRole}</Text>

            <View style={styles.infoList}>
              <InfoRow icon={<Mail size={18} color={accent.a} />} label="Email" value={profile.email} />
              <InfoRow icon={<Phone size={18} color={accent.a} />} label="Phone" value={phonePrimary} />
              <InfoRow icon={<MapPin size={18} color={accent.a} />} label="Farm Location" value={location || profile.location} />
            </View>
          </View>
        </View>

        {/* Land Coordinates Map */}
        <View style={styles.sectionCardShadow}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Land Coordinates</Text>
              {hasCoords ? (
                <Pressable accessibilityRole="button" onPress={openInMaps}>
                  <Text style={[styles.sectionLink, { color: accent.a }]}>Open in Maps</Text>
                </Pressable>
              ) : null}
            </View>

            {loading ? (
              <Text style={styles.muted}>Loading…</Text>
            ) : hasCoords ? (
              <LandMap lat={lat} lon={lon} accent={accent.a} />
            ) : (
              <Text style={styles.muted}>Land coordinates not available.</Text>
            )}

            {hasCoords ? (
              <Text style={styles.coordsText}>{`${lat}, ${lon}`}</Text>
            ) : null}
          </View>
        </View>

        {/* Farmer Data */}
        <View style={styles.sectionCardShadow}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Farmer Data</Text>
            {loading ? (
              <Text style={styles.muted}>Loading…</Text>
            ) : farmerData ? (
              <View style={styles.kvList}>
                <KeyValue label="Full Name" value={String(farmerData.full_name ?? '—')} />
                <KeyValue label="Phone" value={String(farmerData.phone_number ?? '—')} />
                <KeyValue label="Alternate Phone" value={String(farmerData.alternate_phone_number ?? '—')} />
                <KeyValue label="State" value={String(farmerData.state ?? '—')} />
                <KeyValue label="District" value={String(farmerData.district ?? '—')} />
                <KeyValue label="Taluka" value={String(farmerData.taluka ?? '—')} />
                <KeyValue label="Village" value={String(farmerData.village ?? '—')} />
                <KeyValue label="Farming Option" value={String(farmerData.farming_option ?? '—')} />
                <KeyValue label="Lead Source" value={String(farmerData.lead_source ?? '—')} />
                <KeyValue label="Estimated Land Area" value={formatNumberOrDash(farmerData.estimated_land_area)} />
                <KeyValue label="Water Available" value={formatBoolOrDash(farmerData.water_available)} />
              </View>
            ) : (
              <Text style={styles.muted}>No farmer details found.</Text>
            )}
          </View>
        </View>

        {/* KYC Data */}
        <View style={styles.sectionCardShadow}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>KYC Data</Text>
            {loading ? (
              <Text style={styles.muted}>Loading…</Text>
            ) : kycData ? (
              <View style={styles.kvList}>
                <KeyValue label="Aadhar Number" value={String(kycData.adhar_number ?? '—')} />
                <KeyValue label="Account Number" value={String(kycData.accound_number ?? '—')} />
                <KeyValue label="PAN Number" value={String(kycData.pan_numnber ?? '—')} />
                <KeyValue label="IFSC Code" value={String(kycData.IFSC_code ?? '—')} />
                <KeyValue label="Permanent Address" value={String(kycData.permanent_address ?? '—')} />
                <KeyValue label="Updated At" value={formatDateTimeOrDash(kycData.updated_at)} />
              </View>
            ) : (
              <Text style={styles.muted}>No KYC details found.</Text>
            )}
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

type FarmerDetailsResponse = {
  farmer?: {
    farmer_data?: {
      land_coordinates?: [number, number] | number[];
      note?: string | null;
      estimated_land_area?: number;
      lead_source?: string;
      farming_option?: string;
      full_name?: string;
      water_available?: boolean;
      taluka?: string;
      district?: string;
      alternate_phone_number?: string | null;
      phone_number?: string;
      state?: string;
      village?: string;
    };
    kyc_data?: {
      adhar_number?: string;
      accound_number?: string;
      pan_numnber?: string;
      permanent_address?: string;
      updated_at?: string;
      IFSC_code?: string;
    };
    created_at?: string;
    farmer_id?: string;
    agreement_data?: Record<string, unknown>;
    // credentials intentionally omitted from UI
  };
};

function formatNumberOrDash(n: unknown) {
  const num = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(num) ? String(num) : '—';
}

function formatBoolOrDash(b: unknown) {
  if (typeof b === 'boolean') return b ? 'Yes' : 'No';
  return '—';
}

function formatDateTimeOrDash(s: unknown) {
  const str = typeof s === 'string' ? s : '';
  if (!str) return '—';
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleString();
}

function LandMap({
  lat,
  lon,
  accent,
}: {
  lat: number;
  lon: number;
  accent: string;
}) {
  // Map support is optional at runtime to avoid hard-crashing if react-native-maps
  // isn't installed/configured yet. If it is, we render it.
  let MapView: any = null;
  let Marker: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch {
    MapView = null;
  }

  if (!MapView) {
    return (
      <View style={styles.mapFallback}>
        <MapPin size={18} color={accent} />
        <Text style={styles.muted}>Map view requires react-native-maps.</Text>
      </View>
    );
  }

  const region = {
    latitude: lat,
    longitude: lon,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.mapWrap}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} />
      {Marker ? <Marker coordinate={{ latitude: lat, longitude: lon }} /> : null}
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

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
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

  sectionCardShadow: {
    marginTop: 14,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 16,
  },
  sectionLink: {
    fontWeight: '900',
    fontSize: 12,
  },
  muted: {
    color: '#6b7280',
    fontWeight: '700',
    fontSize: 12,
  },
  coordsText: {
    marginTop: 10,
    color: '#374151',
    fontWeight: '800',
    fontSize: 12,
  },
  mapWrap: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#eef2ea',
  },
  mapFallback: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#eef2ea',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },

  kvList: {
    marginTop: 10,
    gap: 12,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  kvLabel: {
    flex: 1,
    color: '#7b845f',
    fontWeight: '900',
    fontSize: 12,
  },
  kvValue: {
    flex: 1,
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'right',
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
