import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator, Alert, TextInput } from 'react-native';
import { motion } from './motion';
import type {
  ServiceRequest,
  ServiceCatalogItem,
  TrackedServiceRequest,
  ServiceTimelineStage,
  ServiceTimeline,
  ServiceStatus,
} from './types';
import { ServiceCard } from './ServiceCard';
import {
  X,
  Check,
  Calendar,
  Wrench,
  Users,
  Package,
  Droplet,
  Bug,
  TestTube,
  Sprout,
  Truck,
  Tractor,
  Plane,
  Inbox,
  Loader,
  FileCheck,
  Clock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { haptic } from './haptics';
import { getFarmerId } from './session';
import { getJson, postJson } from './api';

const MotionPressable = motion.create(Pressable);

type Tab = 'active' | 'all';

type Props = {
  items: ServiceRequest[];
  trackedRequests: TrackedServiceRequest[];
  onCreateTrackedRequest: (req: TrackedServiceRequest) => void;
  initialTab?: Tab;
  onOpenRequestsPage?: () => void;
};

type FormPriority = 'Low' | 'Normal' | 'High';

export function ServicesHub({ items, trackedRequests, onCreateTrackedRequest, initialTab = 'active', onOpenRequestsPage }: Props) {
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [hubMode, setHubMode] = useState<'track' | 'request'>(initialTab === 'all' ? 'track' : 'track');

  // Backend-loaded requests for the Request Service screen
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [backendRequests, setBackendRequests] = useState<ServiceRequest[] | null>(null);

  // Backend-loaded rate cards for creating a new request
  const [rateCardsLoading, setRateCardsLoading] = useState(false);
  const [backendRateCards, setBackendRateCards] = useState<ServiceCatalogItem[] | null>(null);

  const [formServiceKey, setFormServiceKey] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Timeline modal state
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineTitle, setTimelineTitle] = useState<string>('');
  const [timeline, setTimeline] = useState<ServiceTimeline | null>(null);

  const servicesCatalog: ServiceCatalogItem[] = useMemo(() => makeServiceCatalog(), []);

  const effectiveCatalog = useMemo(() => {
    // Prefer backend rate cards when available; fallback to local catalog.
    return backendRateCards && backendRateCards.length ? backendRateCards : servicesCatalog;
  }, [backendRateCards, servicesCatalog]);

  const toastVisible = !!toast;

  const createRequest = async (svc: ServiceCatalogItem) => {
    setCreating(true);

    try {
      const farmerId = getFarmerId();
      if (!farmerId) throw new Error('Not logged in. Missing farmer_id.');

      // Attempt backend request creation first.
      // NOTE: request/response fields may need adjustment once you confirm backend JSON.
      const res = await postJson<any>('/admin_rental/make_rental_request', {
        farmer_id: farmerId,
        service_key: svc.key,
        service_name: svc.title,
      });

      if (res.ok) {
        const now = new Date();
        const requestId = String((res.data as any)?.request_id ?? (res.data as any)?.id ?? `#SR-${Math.floor(2000 + Math.random() * 8000)}`);
        const scheduled = addDays(now, svc.daysUntilAvailable);

        const tl = buildTimelineFromStage('processing', now.toISOString(), scheduled.toISOString(), svc.title);

        const req: TrackedServiceRequest = {
          id: `${Date.now()}`,
          requestId,
          createdAt: now.toISOString(),
          service: svc,
          timeline: tl,
          scheduledDateLabel: scheduled.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        };

        onCreateTrackedRequest(req);

        setToast('Service request created!');
        setTimeout(() => setToast(null), 3000);

        return;
      }

      // If backend fails, fallback to existing simulated flow (keeps app usable during integration)
      // Simulated network delay 1-2 seconds
      await new Promise<void>((resolve) => setTimeout(resolve, 1200));

      const now = new Date();
      const requestId = `#SR-${Math.floor(2000 + Math.random() * 8000)}`;
      const scheduled = addDays(now, svc.daysUntilAvailable);

      const tl = buildTimelineFromStage('processing', now.toISOString(), scheduled.toISOString(), svc.title);

      const req: TrackedServiceRequest = {
        id: `${Date.now()}`,
        requestId,
        createdAt: now.toISOString(),
        service: svc,
        timeline: tl,
        scheduledDateLabel: scheduled.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      onCreateTrackedRequest(req);

      setToast('Service request created!');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setCreating(false);
      setShowServiceSelection(false);
    }
  };

  const selectedService = useMemo(
    () => effectiveCatalog.find((s) => s.key === (formServiceKey as any)) ?? null,
    [formServiceKey, effectiveCatalog],
  );

  const openTimeline = (title: string, tl: ServiceTimeline) => {
    haptic('selection');
    setTimelineTitle(title);
    setTimeline(tl);
    setTimelineOpen(true);
  };

  const canContinue = !!selectedService && termsAccepted && !creating;

  const submitInlineRequest = async () => {
    if (!selectedService) {
      haptic('warning');
      setToast('Please select a service.');
      setTimeout(() => setToast(null), 2500);
      return;
    }

    if (!termsAccepted) {
      haptic('warning');
      setToast('Please accept the terms to continue.');
      setTimeout(() => setToast(null), 2500);
      return;
    }

    haptic('medium');
    await createRequest(selectedService);

    haptic('success');

    setFormServiceKey('');
    setTermsAccepted(false);

    setHubMode('track');
    onOpenRequestsPage?.();
  };

  const nextAvailableLabel = useMemo(() => {
    if (!selectedService) return '';
    const d = addDays(new Date(), selectedService.daysUntilAvailable);
    return safeToLocaleDateString(d, { month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedService]);

  const selectedAccent = useMemo(() => {
    if (!selectedService) return { a: '#4b7a55', b: '#2f5f3b' };
    return { a: selectedService.colorA, b: selectedService.colorB };
  }, [selectedService]);

  const requestItems = useMemo(() => {
    // When we're in “request” mode, show backend list (if available) else fallback to provided items.
    if (hubMode === 'request' && backendRequests) return backendRequests.map(withServiceTimeline);
    return items.map(withServiceTimeline);
  }, [backendRequests, hubMode, items]);

  useEffect(() => {
    // Load rate cards once (or after login) so the request modal uses backend services.
    let cancelled = false;

    async function loadRateCards() {
      try {
        const farmerId = getFarmerId();
        if (!farmerId) return;

        setRateCardsLoading(true);

        const r1 = await getJson<any>(`/admin_rental/get_all_rental_rate_cards?farmer_id=${encodeURIComponent(farmerId)}`);
        const r2 = r1.ok ? r1 : await postJson<any>('/admin_rental/get_all_rental_rate_cards', { farmer_id: farmerId });

        if (!r2.ok) return;

        const raw = r2.data;
        const list = Array.isArray((raw as any)?.rate_cards)
          ? (raw as any).rate_cards
          : Array.isArray((raw as any)?.rental_rate_cards)
            ? (raw as any).rental_rate_cards
            : Array.isArray(raw)
              ? raw
              : [];

        const mapped: ServiceCatalogItem[] = list
          .map((c: any, idx: number) => {
            const title = String(c?.service_name ?? c?.name ?? c?.title ?? 'Service');
            const key = String(c?.service_key ?? c?.key ?? c?.id ?? title.toLowerCase().replace(/\s+/g, '_') ?? idx);

            // Price could be number or string.
            const priceRaw = c?.price ?? c?.service_price ?? c?.rate ?? c?.amount;
            const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw);
            const priceValue = Number.isFinite(price) ? (price as number) : 0;

            return {
              key,
              title,
              description: String(c?.description ?? ''),
              priceLabel: `₹${priceValue}`,
              priceValue,
              icon: 'tractor',
              colorA: '#3f7a63',
              colorB: '#1f4f3b',
              daysUntilAvailable: 2,
            } as unknown as ServiceCatalogItem;
          })
          .filter(Boolean);

        if (cancelled) return;
        if (mapped.length) setBackendRateCards(mapped);
      } finally {
        if (!cancelled) setRateCardsLoading(false);
      }
    }

    loadRateCards();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Fetch requests whenever the Request Service page is opened.
    if (hubMode !== 'request') return;

    let cancelled = false;

    async function load() {
      try {
        setLoadingRequests(true);

        const farmerId = getFarmerId();
        if (!farmerId) {
          throw new Error('Not logged in. Missing farmer_id.');
        }

        const r = await postJson<any>('/admin_rental/get_farmer_rental_requests', { farmer_id: farmerId });
        if (!r.ok) throw new Error(r.error);

        const json = r.data;
        const list = Array.isArray((json as any)?.farmer_rental_requests) ? (json as any).farmer_rental_requests : [];

        const mapped: ServiceRequest[] = list.map((r0: any, idx: number) => {
          const req = r0?.request_details ?? r0?.request ?? {};
          const statusRaw = String(req?.status ?? '').toLowerCase();

          const status: ServiceStatus =
            statusRaw === 'approved' || statusRaw === 'work_order'
              ? 'In Progress'
              : statusRaw === 'completed'
                ? 'Completed'
                : statusRaw
                  ? 'Processing'
                  : 'Pending';

          const requestedIso = String(req?.requested_date ?? new Date().toISOString());

          return {
            id: String(r0?.rental_id ?? r0?.id ?? `${Date.now()}-${idx}`),
            requestId: String(req?.request_id ?? r0?.request_id ?? `REQ-${idx + 1}`),
            title: String(r0?.service_name ?? r0?.service_title ?? 'Service Request'),
            category: 'Equipment',
            requestedDate: requestedIso,
            priority: 'Medium',
            status,
            description: `Area: ${req?.area ?? '\u2014'}${req?.farmer_name ? ` \u2022 Farmer: ${req.farmer_name}` : ''}`,
            assignedTo: '',
            color: 'teal',
            icon: 'wrench',
          };
        });

        if (cancelled) return;
        setBackendRequests(mapped);
      } catch (e: any) {
        if (cancelled) return;
        setBackendRequests(null);
        Alert.alert('Failed to load requests', String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoadingRequests(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [hubMode]);

  return (
    <View style={styles.root}>
      {/* Toast */}
      {toastVisible ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <Check size={16} color="#fff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.header, { backgroundColor: selectedAccent.a }]}>
        <View pointerEvents="none" style={[styles.headerOverlay, { backgroundColor: selectedAccent.b }]} />
        <Text style={styles.headerTitle}>Services Hub</Text>
        <Text style={styles.headerSubtitle}>Request and manage farm services</Text>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic('selection');
              setHubMode('request');
            }}
            style={[
              styles.actionBtn,
              hubMode === 'request' ? [styles.actionBtnPrimary, { backgroundColor: selectedAccent.a }] : null,
            ]}
          >
            <View style={styles.actionIconPill}>
              <Wrench size={20} color={hubMode === 'request' ? '#fff' : '#111827'} />
            </View>
            <Text style={[styles.actionText, hubMode === 'request' ? styles.actionTextPrimary : null]}>Request Service</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic('selection');
              setHubMode('track');
              onOpenRequestsPage?.();
            }}
            style={[
              styles.actionBtn,
              hubMode === 'track' ? [styles.actionBtnPrimary, { backgroundColor: selectedAccent.a }] : null,
            ]}
          >
            <View style={styles.actionIconPill}>
              <Inbox size={20} color={hubMode === 'track' ? '#fff' : '#111827'} />
            </View>
            <Text style={[styles.actionText, hubMode === 'track' ? styles.actionTextPrimary : null]}>Track Requests</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
      >
        {hubMode === 'request' ? (
          <>
            <Text style={styles.sectionTitle}>Request New Service</Text>
            {loadingRequests ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator />
                <Text style={{ marginTop: 10, color: '#7b845f', fontWeight: '800' }}>Loading your requests…</Text>
              </View>
            ) : null}
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Service Type</Text>
              <Pressable accessibilityRole="button" style={styles.selectLike} onPress={() => setShowServiceSelection(true)}>
                <View style={[styles.selectPill, { backgroundColor: selectedAccent.a }]}> 
                  {selectedService ? renderSvcIcon(selectedService.icon, 16, '#fff') : <Inbox size={16} color="#fff" />}
                </View>
                <Text style={[styles.selectLikeText, !selectedService ? styles.selectLikePlaceholder : null]}>
                  {selectedService ? selectedService.title : 'Select a service...'}
                </Text>
                <Text style={styles.selectLikeChevron}>⌄</Text>
              </Pressable>

              {/* Replace Description + Priority with Price + Service Date */}
              <View style={styles.metaGrid}>
                <View style={[styles.metaBox, { borderColor: selectedAccent.a }]}> 
                  <Text style={styles.metaLabel}>Price</Text>
                  <Text style={styles.metaValue}>{selectedService ? selectedService.priceLabel : '—'}</Text>
                </View>
                <View style={[styles.metaBox, { borderColor: selectedAccent.a }]}> 
                  <Text style={styles.metaLabel}>Service Date</Text>
                  <Text style={styles.metaValue}>{selectedService ? nextAvailableLabel : '—'}</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                onPress={() => setTermsAccepted((v) => !v)}
                style={styles.termsRow}
              >
                <View style={[styles.checkBox, termsAccepted ? styles.checkBoxChecked : null]}>
                  {termsAccepted ? <Check size={14} color="#fff" /> : null}
                </View>
                <Text style={styles.termsText}>I agree to the Terms & Conditions</Text>
              </Pressable>

              <MotionPressable
                accessibilityRole="button"
                onPress={submitInlineRequest}
                disabled={!canContinue}
                style={{ ...(styles.submitBtn as any), backgroundColor: selectedAccent.a, opacity: canContinue ? 1 : 0.55 }}
                whileTap={{ scale: canContinue ? 0.98 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                {creating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.submitText}>Creating...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitText}>Agree & Continue</Text>
                )}
              </MotionPressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Requests</Text>
            <View style={{ gap: 14 }}>
              {requestItems.slice(0, 10).map((s, i) => (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  onPress={() => {
                    if (s.timeline) openTimeline(s.title, s.timeline);
                  }}
                >
                  <ServiceCard item={s} index={i} onOpenTimeline={(title, tl) => openTimeline(title, tl)} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Service selection modal */}
      <Modal
        visible={showServiceSelection}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServiceSelection(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Service</Text>
              <Pressable accessibilityRole="button" onPress={() => setShowServiceSelection(false)} style={styles.modalClose}>
                <X size={18} color="#111827" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 14 }}>
              {servicesCatalog.map((svc) => {
                const active = svc.key === (formServiceKey as any);
                return (
                  <Pressable
                    key={svc.key}
                    style={[styles.serviceRow, active ? styles.serviceRowActive : null]}
                    onPress={() => {
                      haptic('selection');
                      setFormServiceKey(String(svc.key));
                      setShowServiceSelection(false);
                    }}
                  >
                    <View style={styles.serviceRowLeft}>
                      <View style={[styles.serviceIcon, { backgroundColor: svc.colorA + '22' }]}>
                        {renderSvcIcon(svc.icon, 18, svc.colorA)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceTitle}>{svc.title}</Text>
                        <Text style={styles.serviceDesc}>{svc.description}</Text>
                      </View>
                    </View>
                    <Text style={[styles.servicePrice, { color: svc.colorA }]}>{svc.priceLabel}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Timeline modal (parcel-tracking style) */}
      <Modal visible={timelineOpen} transparent animationType="fade" onRequestClose={() => setTimelineOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.timelineModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{timelineTitle}</Text>
              <Pressable accessibilityRole="button" onPress={() => setTimelineOpen(false)} style={styles.modalClose}>
                <X size={18} color="#111827" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 26 }}>
              {timeline ? renderTimelineFromTimeline(timeline, selectedAccent.a) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function safeDate(input: string | Date) {
  if (input instanceof Date) return input;

  // Try native parsing first
  const d1 = new Date(input);
  if (!Number.isNaN(d1.getTime())) return d1;

  // Fallback for strings like "Jan 17, 2026"
  const m = input.trim().match(/^([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const [, monRaw, dayRaw, yearRaw] = m;
    const monKey = monRaw.slice(0, 3).toLowerCase();
    const months: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const month = months[monKey];
    if (month !== undefined) {
      const day = Number(dayRaw);
      const year = Number(yearRaw);
      const d2 = new Date(Date.UTC(year, month, day, 12, 0, 0));
      if (!Number.isNaN(d2.getTime())) return d2;
    }
  }

  // Last resort: current date (prevents crash)
  return new Date();
}

function safeToLocaleDateString(d: Date, options?: Intl.DateTimeFormatOptions) {
  try {
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, options);
  } catch {
    return '';
  }
}

function buildTimelineFromStage(
  stage: ServiceTimelineStage,
  createdAtIso: string,
  scheduledAtIso: string,
  title: string,
): ServiceTimeline {
  const createdAt = safeDate(createdAtIso);
  const scheduledAt = safeDate(scheduledAtIso);

  const scheduledLabel = safeToLocaleDateString(scheduledAt, { month: 'short', day: 'numeric', year: 'numeric' });

  const events = [
    {
      stage: 'submitted' as const,
      at: createdAt.toISOString(),
      title: 'Request Submitted',
      description: `We received your request for ${title}.`,
    },
    {
      stage: 'processing' as const,
      at: addMinutes(createdAt, 30).toISOString(),
      title: 'Processing',
      description: 'Our team is reviewing the details and preparing assignment.',
    },
    {
      stage: 'assigned' as const,
      at: addHours(createdAt, 4).toISOString(),
      title: 'Assigned',
      description: 'A service agent has been assigned to your request.',
    },
    {
      stage: 'scheduled' as const,
      at: scheduledAt.toISOString(),
      title: 'Scheduled',
      description: `Service is scheduled for ${scheduledLabel || 'TBD'}.`,
    },
    {
      stage: 'completed' as const,
      at: addHours(scheduledAt, 3).toISOString(),
      title: 'Completed',
      description: 'Service completed successfully.',
    },
  ];

  const idx = Math.max(0, events.findIndex((e) => e.stage === stage));
  return { current: events[idx]?.stage ?? 'submitted', events: events.slice(0, Math.max(1, idx + 1)) };
}

function withServiceTimeline(s: ServiceRequest): ServiceRequest {
  if (s.timeline) return s;

  // requestedDate in mock data is like "Jan 17, 2026" (not ISO); use safe parsing
  const createdAt = safeDate(s.requestedDate);
  const scheduledAt = addDays(createdAt, 2);

  const stage: ServiceTimelineStage =
    s.status === 'Completed'
      ? 'completed'
      : s.status === 'Processing'
        ? 'processing'
        : s.status === 'In Progress'
          ? 'assigned'
          : 'submitted';

  return {
    ...s,
    timeline: buildTimelineFromStage(stage, createdAt.toISOString(), scheduledAt.toISOString(), s.title),
  };
}

function addMinutes(d: Date, minutes: number) {
  const out = new Date(d);
  out.setMinutes(out.getMinutes() + minutes);
  return out;
}

function addHours(d: Date, hours: number) {
  const out = new Date(d);
  out.setHours(out.getHours() + hours);
  return out;
}

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function labelForAvailableDate(days: number) {
  const d = addDays(new Date(), days);
  return safeToLocaleDateString(d, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeLabel(iso: string) {
  const d = safeDate(iso);
  return safeToLocaleDateString(d, { month: 'short', day: 'numeric' });
}

function makeServiceCatalog(): ServiceCatalogItem[] {
  return [
    {
      key: 'tractorRepair',
      title: 'Tractor Repair',
      description: 'Professional tractor maintenance and repair',
      priceLabel: '$250',
      priceValue: 250,
      daysUntilAvailable: 2,
      colorA: '#ef4444',
      colorB: '#f97316',
      icon: 'wrench',
    },
    {
      key: 'agronomistConsultation',
      title: 'Agronomist Consultation',
      description: 'Expert advice on crop management',
      priceLabel: '$180',
      priceValue: 180,
      daysUntilAvailable: 3,
      colorA: '#a855f7',
      colorB: '#8b5cf6',
      icon: 'users',
    },
    {
      key: 'fertilizerDelivery',
      title: 'Fertilizer Delivery',
      description: 'Premium fertilizer supply and delivery',
      priceLabel: '$320',
      priceValue: 320,
      daysUntilAvailable: 1,
      colorA: '#22c55e',
      colorB: '#10b981',
      icon: 'package',
    },
    {
      key: 'irrigationSetup',
      title: 'Irrigation System Setup',
      description: 'Complete irrigation system installation',
      priceLabel: '$500',
      priceValue: 500,
      daysUntilAvailable: 5,
      colorA: '#3b82f6',
      colorB: '#06b6d4',
      icon: 'droplet',
    },
    {
      key: 'pestControl',
      title: 'Pest Control Service',
      description: 'Comprehensive pest management solutions',
      priceLabel: '$150',
      priceValue: 150,
      daysUntilAvailable: 1,
      colorA: '#f59e0b',
      colorB: '#f97316',
      icon: 'bug',
    },
    {
      key: 'soilAnalysis',
      title: 'Soil Analysis',
      description: 'Detailed soil composition testing',
      priceLabel: '$200',
      priceValue: 200,
      daysUntilAvailable: 4,
      colorA: '#14b8a6',
      colorB: '#06b6d4',
      icon: 'testtube',
    },
    {
      key: 'seedSupply',
      title: 'Seed Supply',
      description: 'High-quality seed varieties',
      priceLabel: '$400',
      priceValue: 400,
      daysUntilAvailable: 2,
      colorA: '#84cc16',
      colorB: '#22c55e',
      icon: 'sprout',
    },
    {
      key: 'equipmentRental',
      title: 'Equipment Rental',
      description: 'Farm equipment rental service',
      priceLabel: '$350/day',
      priceValue: 350,
      daysUntilAvailable: 1,
      colorA: '#6366f1',
      colorB: '#3b82f6',
      icon: 'truck',
    },
    {
      key: 'harvestingService',
      title: 'Harvesting Service',
      description: 'Professional harvesting assistance',
      priceLabel: '$600',
      priceValue: 600,
      daysUntilAvailable: 7,
      colorA: '#f43f5e',
      colorB: '#ec4899',
      icon: 'tractor',
    },
    {
      key: 'droneMonitoring',
      title: 'Drone Monitoring',
      description: 'Aerial crop monitoring with drones',
      priceLabel: '$280',
      priceValue: 280,
      daysUntilAvailable: 3,
      colorA: '#d946ef',
      colorB: '#a855f7',
      icon: 'plane',
    },
  ];
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f2ea' },

  header: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: '#4b7a55',
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
    backgroundColor: '#2f5f3b',
    opacity: 0.32,
  },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900' },
  headerSubtitle: { marginTop: 6, color: 'rgba(255,255,255,0.88)', fontWeight: '700' },

  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 14,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#eef2ea',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  actionBtnPrimary: {
    backgroundColor: '#4b7a55',
  },
  actionIcon: { color: '#fff', fontWeight: '900', fontSize: 28, marginBottom: 6 },
  actionIconBox: { color: '#1f2937', fontWeight: '900', fontSize: 22, marginBottom: 6 },
  actionText: { color: '#1f2937', fontWeight: '900', fontSize: 16 },
  actionTextPrimary: { color: '#fff' },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },

  sectionTitle: { color: '#111827', fontWeight: '900', fontSize: 20, marginTop: 6, marginBottom: 14 },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },

  fieldLabel: { color: '#111827', fontWeight: '800', fontSize: 14, marginBottom: 10 },

  selectLike: {
    borderWidth: 1,
    borderColor: '#d1e7da',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  selectLikeText: { color: '#111827', fontWeight: '800', fontSize: 14 },
  selectLikePlaceholder: { color: '#9ca3af', fontWeight: '700' },
  selectLikeChevron: { color: '#111827', fontWeight: '900', fontSize: 18 },

  textArea: {
    borderWidth: 1,
    borderColor: '#d1e7da',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 110,
    textAlignVertical: 'top',
    color: '#111827',
    fontWeight: '700',
    backgroundColor: '#fff',
  },

  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1e7da',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  priorityPillActive: {
    backgroundColor: '#eef2ea',
    borderColor: '#4b7a55',
  },
  priorityPillText: { color: '#111827', fontWeight: '900', fontSize: 12 },
  priorityPillTextActive: { color: '#1f2937' },

  termsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4b7a55',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkBoxChecked: {
    backgroundColor: '#4b7a55',
  },
  termsText: {
    color: '#7b845f',
    fontWeight: '800',
    fontSize: 12,
    flexShrink: 1,
  },

  submitBtn: {
    marginTop: 16,
    backgroundColor: '#4b7a55',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  submitText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  toastWrap: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  toastText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: 680,
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { color: '#111827', fontWeight: '900', fontSize: 16, flex: 1, paddingRight: 12 },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ea',
  },
  serviceRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceRowActive: {
    backgroundColor: '#eef2ea',
  },
  serviceRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#f4f2ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: { color: '#111827', fontWeight: '900', fontSize: 14 },
  serviceDesc: { marginTop: 4, color: '#6b7280', fontSize: 12, fontWeight: '600' },
  servicePrice: { fontWeight: '900', fontSize: 14 },

  metaGrid: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  metaBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef2ea',
  },
  metaLabel: { color: '#7b845f', fontWeight: '900', fontSize: 12 },
  metaValue: { marginTop: 8, color: '#111827', fontWeight: '900', fontSize: 14 },

  // Timeline styles (required by renderTimelineFromTimeline)
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  timelineLeft: { width: 26, alignItems: 'center' },
  timelineLine: { position: 'absolute', top: 26, width: 2, height: 62, backgroundColor: '#e5e7eb' },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eef2ea',
  },
  timelineCardActive: {
    borderColor: '#111827',
  },
  timelineCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  timelineTitle: { color: '#111827', fontWeight: '900', fontSize: 13, flex: 1 },
  timelineTime: { color: '#6b7280', fontWeight: '800', fontSize: 11 },
  timelineDesc: { marginTop: 6, color: '#7b845f', fontWeight: '700', fontSize: 12, lineHeight: 16 },

  timelineModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: 680,
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
  },

  selectPill: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionIconPill: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});

function renderSvcIcon(icon: ServiceCatalogItem['icon'], size: number, color: string) {
  const map: Record<ServiceCatalogItem['icon'], any> = {
    wrench: Wrench,
    users: Users,
    package: Package,
    droplet: Droplet,
    bug: Bug,
    testtube: TestTube,
    sprout: Sprout,
    truck: Truck,
    tractor: Tractor,
    plane: Plane,
  };
  const Icon = map[icon] ?? Wrench;
  return <Icon size={size} color={color} />;
}

function renderTimelineFromTimeline(tl: ServiceTimeline, accent: string) {
  const events = tl.events;
  const currentIndex = Math.max(0, events.findIndex((e) => e.stage === tl.current));

  return (
    <View style={{ marginTop: 12 }}>
      {events.map((e, idx) => {
        const isDone = idx < currentIndex;
        const isActive = idx === currentIndex;

        const Icon =
          e.stage === 'submitted'
            ? FileCheck
            : e.stage === 'processing'
              ? Clock
              : e.stage === 'assigned'
                ? UserCheck
                : e.stage === 'scheduled'
                  ? Calendar
                  : CheckCircle2;

        return (
          <View key={`${e.stage}-${e.at}`} style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineLine, idx === events.length - 1 ? { height: 22 } : null]} />
              <View
                style={[
                  styles.timelineNode,
                  isDone ? { backgroundColor: accent, borderColor: accent } : isActive ? { borderColor: accent } : null,
                ]}
              >
                {isDone ? <Check size={16} color="#fff" /> : <Icon size={16} color={isActive ? accent : '#9ca3af'} />}
              </View>
            </View>

            <View style={[styles.timelineCard, isActive ? styles.timelineCardActive : null]}>
              <View style={styles.timelineCardTop}>
                <Text style={styles.timelineTitle}>{e.title}</Text>
                <Text style={styles.timelineTime}>{formatTimeLabel(e.at)}</Text>
              </View>
              <Text style={styles.timelineDesc}>{e.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
