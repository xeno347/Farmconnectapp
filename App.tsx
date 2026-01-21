/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar, Text, Pressable, View, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './components/LoginScreen';
import { AppShell } from './components/AppShell';
import { TaskDashboard } from './components/TaskDashboard';
import { FieldVisit } from './components/FieldVisit';
import { ServicesHub } from './components/ServicesHub';
import { ProfilePage } from './components/ProfilePage';
import type { ScreenName, Task, TrackedServiceRequest, UserProfile } from './components/types';
import { postJson, getJson } from './components/api';
import { getFarmerId } from './components/session';
import { pickAccent } from './components/theme';
import { ScreenFadeIn } from './components/ui/ScreenFadeIn';

function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [screen, setScreen] = useState<ScreenName>('dashboard');

  // Dashboard UI state
  const [showAllTasks, setShowAllTasks] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [trackedRequests, setTrackedRequests] = useState<TrackedServiceRequest[]>([]);

  const [visits, setVisits] = useState<any[]>([] as any);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    role: '',
    email: '',
    phone: '',
    location: '',
    memberSince: '',
    farmName: '',
    totalArea: '',
    primaryCrops: '',
    livestock: '',
    stats: { fields: 0, tasks: 0, efficiency: '' },
  });

  useEffect(() => {
    if (!isAuthed) return;

    let cancelled = false;

    async function loadTasks() {
      try {
        setTasksLoading(true);

        const farmerId = getFarmerId();
        if (!farmerId) return;

        // NOTE: awaiting your API response JSON shape for this endpoint.
        // For now we optimistically try both GET and POST variants.
        const r1 = await getJson<any>(`/admin_all_task/get_all_tasks?farmer_id=${encodeURIComponent(farmerId)}`);
        const r2 = r1.ok ? r1 : await postJson<any>('/admin_all_task/get_all_tasks', { farmer_id: farmerId });

        if (!r2.ok) throw new Error(r2.error);

        const raw = r2.data;
        const list = Array.isArray(raw?.tasks) ? raw.tasks : Array.isArray(raw) ? raw : [];

        const mapped: Task[] = list.map((t: any, idx: number) => {
          const statusRaw = String(t?.status ?? t?.task_status ?? '').toLowerCase();
          const status: Task['status'] =
            statusRaw === 'completed'
              ? 'Completed'
              : statusRaw === 'urgent'
                ? 'Urgent'
                : statusRaw === 'in_progress' || statusRaw === 'in progress'
                  ? 'In Progress'
                  : 'Pending';

          return {
            id: String(t?.task_id ?? t?.id ?? idx),
            title: String(t?.title ?? t?.task_title ?? 'Task'),
            field: String(t?.field ?? t?.plot_name ?? t?.location ?? '—'),
            description: String(t?.description ?? ''),
            status,
            harvestDate: t?.due_date ? String(t.due_date) : undefined,
            progress: typeof t?.progress === 'number' ? t.progress : undefined,
            color: 'green',
            icon: 'sprout',
          };
        });

        if (cancelled) return;
        if (mapped.length) setTasks(mapped);
      } catch {
        // Keep mock tasks if backend fails until we have final schemas.
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    }

    async function loadFieldVisits() {
      try {
        const farmerId = getFarmerId();
        if (!farmerId) return;

        // NEXT integration: Field Visits.
        // Your backend endpoint name/shape is not confirmed yet, so we try common variants.
        const r1 = await getJson<any>(`/field_visits/get_farmer_visits?farmer_id=${encodeURIComponent(farmerId)}`);
        const r2 = r1.ok ? r1 : await postJson<any>('/field_visits/get_farmer_visits', { farmer_id: farmerId });
        if (!r2.ok) return;

        const raw = r2.data;
        const list = Array.isArray((raw as any)?.visits)
          ? (raw as any).visits
          : Array.isArray((raw as any)?.field_visits)
            ? (raw as any).field_visits
            : Array.isArray(raw)
              ? raw
              : [];

        const mapped = list.map((v: any, idx: number) => {
          const statusRaw = String(v?.status ?? v?.visit_status ?? '').toLowerCase();
          const status = (statusRaw === 'completed'
            ? 'Completed'
            : statusRaw === 'overdue'
              ? 'Overdue'
              : 'Scheduled') as any;

          return {
            id: String(v?.visit_id ?? v?.id ?? idx),
            title: String(v?.title ?? v?.visit_title ?? 'Field Visit'),
            supervisor: String(v?.supervisor ?? v?.inspector ?? 'Supervisor'),
            date: String(v?.date ?? v?.visit_date ?? new Date().toISOString()),
            status,
            notes: String(v?.notes ?? v?.remark ?? ''),
            gradient: 'green',
          };
        });

        if (!cancelled && mapped.length) setVisits(mapped);
      } catch {
        // Ignore; keep mock visits.
      }
    }

    async function loadProfile() {
      try {
        const farmerId = getFarmerId();
        if (!farmerId) return;

        // NEXT integration: Profile.
        // Tries common endpoint naming patterns (GET first, POST fallback).
        const r1 = await getJson<any>(`/farmer_managment/get_profile?farmer_id=${encodeURIComponent(farmerId)}`);
        const r2 = r1.ok ? r1 : await postJson<any>('/farmer_managment/get_profile', { farmer_id: farmerId });

        const r3 = r2.ok ? r2 : await getJson<any>(`/farmer_management/get_profile?farmer_id=${encodeURIComponent(farmerId)}`);
        const r4 = r3.ok ? r3 : await postJson<any>('/farmer_management/get_profile', { farmer_id: farmerId });

        const r = r4.ok ? r4 : r2.ok ? r2 : r1.ok ? r1 : r3;
        if (!r.ok) return;

        const raw = r.data as any;
        const p = raw?.profile ?? raw?.farmer ?? raw?.data ?? raw;

        const mapped: UserProfile = {
          name: String(p?.name ?? p?.farmer_name ?? profile.name),
          role: String(p?.role ?? 'Farmer'),
          email: String(p?.email ?? p?.mail ?? profile.email),
          phone: String(p?.phone ?? p?.mobile ?? profile.phone),
          location: String(p?.location ?? p?.address ?? profile.location),
          memberSince: String(p?.member_since ?? p?.created_at ?? profile.memberSince),
          farmName: String(p?.farm_name ?? profile.farmName),
          totalArea: String(p?.total_area ?? p?.area ?? profile.totalArea),
          primaryCrops: String(p?.primary_crops ?? p?.crops ?? profile.primaryCrops),
          livestock: String(p?.livestock ?? profile.livestock),
          stats: {
            fields: Number(p?.stats?.fields ?? profile.stats.fields),
            tasks: Number(p?.stats?.tasks ?? profile.stats.tasks),
            efficiency: String(p?.stats?.efficiency ?? profile.stats.efficiency),
          },
        };

        if (!cancelled) setProfile(mapped);
      } catch {
        // Keep mock profile.
      }
    }

    loadTasks();
    loadFieldVisits();
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  async function updateTaskStatusOnBackend(updated: Task) {
    // Update UI immediately
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    const farmerId = getFarmerId();
    if (!farmerId) return;

    // NOTE: awaiting exact request/response schema for update_task_status.
    // We'll patch this to match your backend once you share its JSON.
    await postJson<any>('/admin_all_task/update_task_status', {
      farmer_id: farmerId,
      task_id: updated.id,
      status: updated.status,
    });
  }

  const statusBar = useMemo(() => {
    if (!isAuthed) return 'light-content' as const;
    if (screen === 'dashboard') return 'light-content' as const;
    if (screen === 'fieldVisits') return 'light-content' as const;
    if (screen === 'services') return 'light-content' as const;
    if (screen === 'serviceRequests') return 'light-content' as const;
    if (screen === 'profile') return 'light-content' as const;
    return 'dark-content' as const;
  }, [isAuthed, screen]);

  const notificationsAccent = pickAccent('cyan');

  const content = !isAuthed ? (
    <ScreenFadeIn>
      <LoginScreen
        onLogin={() => {
          setIsAuthed(true);
          setScreen('dashboard');
        }}
      />
    </ScreenFadeIn>
  ) : (
    <AppShell
      screen={screen}
      onChangeScreen={(s) => {
        setScreen(s);
      }}
    >
      {screen === 'dashboard' ? (
        <TaskDashboard
          tasks={showAllTasks ? tasks : tasks}
          onUpdateTask={updateTaskStatusOnBackend}
          onQuickAction={(action) => {
            if (action === 'newVisit') setScreen('fieldVisits');
            if (action === 'requestService') setScreen('services');
            if (action === 'addTask') setScreen('dashboard');
            if (action === 'notifications') {
              setScreen('notifications');
            }
            if (action === 'viewAllTasks') {
              setShowAllTasks(true);
              setScreen('dashboard');
            }
          }}
        />
      ) : screen === 'notifications' ? (
        <ScreenFadeIn>
          <View style={{ flex: 1, backgroundColor: '#f4f2ea' }}>
            <View
              style={{
                paddingHorizontal: 18,
                paddingTop: 56,
                paddingBottom: 16,
                backgroundColor: notificationsAccent.a,
                borderBottomLeftRadius: 26,
                borderBottomRightRadius: 26,
                overflow: 'hidden',
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 220,
                  backgroundColor: notificationsAccent.b,
                  opacity: 0.32,
                }}
              />
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>Notifications</Text>
              <Text style={{ marginTop: 6, color: 'rgba(255,255,255,0.88)', fontWeight: '700' }}>
                Updates and reminders
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
            >
              {/* Simple demo list */}
              {[] /* No notifications yet */ }

              <Pressable
                accessibilityRole="button"
                onPress={() => setScreen('dashboard')}
                style={{
                  marginTop: 8,
                  backgroundColor: notificationsAccent.a,
                  borderRadius: 18,
                  paddingVertical: 16,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.14,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 12 },
                  elevation: 16,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Back to Dashboard</Text>
              </Pressable>
            </ScrollView>
          </View>
        </ScreenFadeIn>
      ) : screen === 'fieldVisits' ? (
        <FieldVisit visits={visits} />
      ) : screen === 'services' ? (
        <ServicesHub
          items={[] as any}
          trackedRequests={trackedRequests}
          initialTab="active"
          onOpenRequestsPage={() => setScreen('serviceRequests')}
          onCreateTrackedRequest={(req: TrackedServiceRequest) => {
            setTrackedRequests((prev) => [req, ...prev]);
            setScreen('serviceRequests');
          }}
        />
      ) : screen === 'serviceRequests' ? (
        <ServicesHub
          items={[] as any}
          trackedRequests={trackedRequests}
          initialTab="all"
          onOpenRequestsPage={() => setScreen('serviceRequests')}
          onCreateTrackedRequest={(req: TrackedServiceRequest) => {
            setTrackedRequests((prev) => [req, ...prev]);
            setScreen('serviceRequests');
          }}
        />
      ) : (
        <ProfilePage
          profile={profile}
          onLogout={() => {
            setIsAuthed(false);
            setShowAllTasks(false);
          }}
        />
      )}
    </AppShell>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={statusBar} />
      {content}
    </SafeAreaProvider>
  );
}

export default App;
