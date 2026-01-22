import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { motion } from './motion';
import { Bell, CheckCircle2, Check, Clock, ArrowRight, Flame, CalendarDays } from 'lucide-react-native';
import { TaskCard } from './TaskCard';
import type { Task } from './types';
import { Toast } from './ui/Toast';
import { AnimatedToast } from './ui/AnimatedToast';
import { pickAccent } from './theme';
import { Skeleton } from './ui/Skeleton';
import { getJson } from './api';
import { getFarmerId } from './session';

const MotionView = motion.create(View);
const MotionPressable = motion.create(Pressable);

type CultivationPlanItem = {
  id: string;
  calendar_id?: string;
  plan_id?: string;
  block_id?: string;
  farm_id?: string;
  activity: string;
  index?: number;
  date?: string; // YYYY-MM-DD
  assigned_area?: number;
  status?: string;
};

function normStatus(s: unknown) {
  return String(s ?? '').trim().toLowerCase();
}

function isPendingForFarmer(status: unknown) {
  return normStatus(status) === 'pending';
}

function isPendingForSupervisor(status: unknown) {
  const v = normStatus(status);
  return (
    v === 'pending approval' ||
    v === 'pending_approval' ||
    v === 'approval pending' ||
    v === 'approval_pending' ||
    v === 'awaiting approval' ||
    v === 'awaiting_approval' ||
    v === 'supervisor pending' ||
    v === 'supervisor_pending' ||
    v === 'work done' ||
    v === 'work_done' ||
    v === 'done'
  );
}

function safeDate(input: string | Date): Date | null {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;

  const s = String(input).trim();
  if (!s) return null;

  // Handles YYYY-MM-DD
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mon = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mon - 1, d, 12, 0, 0));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const dt2 = new Date(s);
  return Number.isNaN(dt2.getTime()) ? null : dt2;
}

function safeToLocaleDateString(d: Date | null, options?: Intl.DateTimeFormatOptions) {
  try {
    if (!d || Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, options);
  } catch {
    return '';
  }
}

export function TaskDashboard({
  tasks,
  onUpdateTask,
  onQuickAction,
}: {
  tasks: Task[];
  onUpdateTask: (t: Task) => void;
  onQuickAction?: (action: 'addTask' | 'newVisit' | 'requestService' | 'viewAllTasks' | 'notifications') => void;
}) {
  const [showTaskConfirmModal, setShowTaskConfirmModal] = useState(false);
  const [selectedTaskToComplete, setSelectedTaskToComplete] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(true);
  const [planItems, setPlanItems] = useState<CultivationPlanItem[] | null>(null);

  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [selectedPlanItem, setSelectedPlanItem] = useState<CultivationPlanItem | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCultivationPlan() {
      try {
        const farmerId = getFarmerId();
        if (!farmerId) {
          if (!cancelled) setPlanItems(null);
          return;
        }

        const r = await getJson<any>(`/admin_cultivation/farmer_caultivation_plan/${encodeURIComponent(farmerId)}`);
        if (!r.ok) return;

        const raw = r.data;
        const list = Array.isArray(raw) ? raw : [];

        const mapped: CultivationPlanItem[] = list
          .map((x: any, idx: number) => {
            const activity = String(x?.activity ?? '').trim();
            if (!activity) return null;
            const id = String(
              x?.calendar_id ??
                x?.plan_id ??
                `${String(x?.farm_id ?? 'farm')}-${String(x?.date ?? 'date')}-${idx}`
            );
            return {
              id,
              calendar_id: x?.calendar_id ? String(x.calendar_id) : undefined,
              plan_id: x?.plan_id ? String(x.plan_id) : undefined,
              block_id: x?.block_id ? String(x.block_id) : undefined,
              farm_id: x?.farm_id ? String(x.farm_id) : undefined,
              activity,
              index: typeof x?.index === 'number' ? x.index : Number(x?.index),
              date: x?.date ? String(x.date) : undefined,
              assigned_area: typeof x?.assigned_area === 'number' ? x.assigned_area : Number(x?.assigned_area),
              status: x?.status ? String(x.status) : undefined,
            } as CultivationPlanItem;
          })
          .filter(Boolean) as CultivationPlanItem[];

        if (cancelled) return;
        setPlanItems(mapped);
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    }

    loadCultivationPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  const toastVisible = !!toast;

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const openConfirm = (task: Task) => {
    setSelectedTaskToComplete(task);
    setShowTaskConfirmModal(true);
  };

  const closeConfirm = () => {
    setShowTaskConfirmModal(false);
    setSelectedTaskToComplete(null);
  };

  const confirmComplete = () => {
    if (!selectedTaskToComplete) return;
    const updated: Task = {
      ...selectedTaskToComplete,
      status: 'Completed',
      progress: 100,
    };
    onUpdateTask(updated);
    closeConfirm();
    setToast('✓ Task completed successfully!');
    setTimeout(() => setToast(null), 3000);
  };

  const effectivePlan = planItems && planItems.length ? planItems : null;
  const planList = useMemo(() => {
    return (effectivePlan ?? []).slice().sort((a, b) => {
      const ai = Number.isFinite(Number(a.index)) ? Number(a.index) : 0;
      const bi = Number.isFinite(Number(b.index)) ? Number(b.index) : 0;
      if (ai !== bi) return ai - bi;
      return String(a.date ?? '').localeCompare(String(b.date ?? ''));
    });
  }, [effectivePlan]);

  const farmerTodos = useMemo(() => planList.filter((r) => isPendingForFarmer(r.status)), [planList]);
  const supervisorTodos = useMemo(() => planList.filter((r) => isPendingForSupervisor(r.status)), [planList]);

  const completedCount = effectivePlan
    ? effectivePlan.filter((r) => String(r.status ?? '').toLowerCase() === 'completed').length
    : tasks.filter((t) => t.status === 'Completed').length;
  const totalCount = Math.max(1, effectivePlan ? effectivePlan.length : tasks.length);
  const progressPct = Math.min(1, Math.max(0, completedCount / totalCount));

  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Simple “upcoming harvest” card uses first non-completed task
  const upcomingTask = useMemo(() => tasks.find((t) => t.status !== 'Completed') ?? tasks[0] ?? null, [tasks]);

  const headerAccent = useMemo(() => {
    const first = tasks?.[0];
    if (!first) return pickAccent('green');
    const key = (first.color === 'purple' ? 'violet' : first.color) as any;
    return pickAccent(key);
  }, [tasks]);

  const openSupervisorStatus = (row: CultivationPlanItem) => {
    setSelectedPlanItem(row);
    setSupervisorModalOpen(true);
  };

  const markWorkDoneLocal = (row: CultivationPlanItem) => {
    // Local-only move from Farmer -> Supervisor until API integration is added.
    setPlanItems((prev) => {
      if (!prev) return prev;
      return prev.map((it) => (it.id === row.id ? { ...it, status: 'Supervisor Pending' } : it));
    });
    showToast('Marked as work done (awaiting supervisor approval)');
  };

  const closeSupervisorStatus = () => {
    setSupervisorModalOpen(false);
    setSelectedPlanItem(null);
  };

  return (
    <View style={styles.root}>
      {toastMsg ? <AnimatedToast message={toastMsg} kind="info" onHide={() => setToastMsg(null)} /> : null}

      {/* Toast */}
      {toastVisible ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <Check size={16} color="#fff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.header, { backgroundColor: headerAccent.a }]}>
        <View pointerEvents="none" style={[styles.headerOverlay, { backgroundColor: headerAccent.b }]} />

        <View style={styles.headerTopRow}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={styles.bellWrap}
            onPress={() => {
              onQuickAction?.('notifications');
              if (!onQuickAction) Alert.alert('Notifications', 'No new notifications.');
            }}
          >
            <Bell size={20} color="#fff" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.headerTitle}>Today’s Tasks</Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Daily Progress</Text>
          <Text style={styles.progressRight}>{completedCount} of {effectivePlan ? effectivePlan.length : tasks.length} completed</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
        </View>

        {/* Upcoming harvest card */}
        {upcomingTask ? (
          <View style={styles.upcomingCardShadow}>
            <View style={styles.upcomingCard}>
              <View style={styles.upcomingIconWrap}>
                <Text style={styles.upcomingIconText}>!</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upcomingTitle}>Upcoming</Text>
                <Text style={styles.upcomingMain}>{upcomingTask.title}</Text>
                <View style={styles.upcomingMetaRow}>
                  <CalendarDays size={14} color="#ffffff" />
                  <Text style={styles.upcomingMetaText}>{upcomingTask.harvestDate ?? 'Jan 20, 2026'}</Text>
                  <View style={styles.daysLeftPill}>
                    <Text style={styles.daysLeftText}>7 days left</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{effectivePlan ? 'Cultivation Plan' : 'Task List'}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.viewAllBtn}
            onPress={() => {
              onQuickAction?.('viewAllTasks');
              if (!onQuickAction) showToast('All tasks list (not implemented)');
            }}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={16} color={headerAccent.a} />
          </Pressable>
        </View>

        {planLoading || loading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2, 3].map((k) => (
              <View key={k} style={styles.skelCard}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Skeleton style={{ width: 42, height: 42, borderRadius: 16 }} />
                  <View style={{ flex: 1, gap: 10 }}>
                    <Skeleton style={{ height: 14, borderRadius: 8, width: '65%' }} />
                    <Skeleton style={{ height: 12, borderRadius: 8, width: '45%' }} />
                    <Skeleton style={{ height: 12, borderRadius: 8, width: '55%' }} />
                  </View>
                  <Skeleton style={{ width: 54, height: 22, borderRadius: 999 }} />
                </View>
              </View>
            ))}
          </View>
        ) : effectivePlan ? (
          <View style={{ gap: 18 }}>
            {/* Segment 1: To-do for farmer */}
            <View style={{ gap: 12 }}>
              <Text style={styles.segmentTitle}>To-do for Farmer</Text>
              {farmerTodos.length === 0 ? (
                <View style={styles.segmentEmpty}>
                  <Text style={styles.segmentEmptyText}>No pending tasks for farmer.</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {farmerTodos.map((row) => {
                    const status = String(row.status ?? '—');
                    const d = safeDate(row.date ?? '');
                    const dateLabel =
                      safeToLocaleDateString(d, { month: 'short', day: 'numeric', year: 'numeric' }) || (row.date ?? '—');

                    return (
                      <View key={row.id} style={styles.skelCard}>
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 16,
                              backgroundColor: 'rgba(75,122,85,0.12)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Flame size={18} color="#4b7a55" />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#111827', fontWeight: '900', fontSize: 14 }} numberOfLines={1}>
                              {row.activity}
                            </Text>
                            <Text style={{ marginTop: 6, color: '#7b845f', fontWeight: '800', fontSize: 12 }}>{dateLabel}</Text>
                            <Text style={{ marginTop: 4, color: '#6b7280', fontWeight: '700', fontSize: 12 }}>Status: {status}</Text>
                          </View>

                          <MotionPressable
                            accessibilityRole="button"
                            onPress={() => markWorkDoneLocal(row)}
                            style={{ backgroundColor: '#4b7a55', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>Work done</Text>
                          </MotionPressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Segment 2: To-do for supervisor */}
            <View style={{ gap: 12 }}>
              <Text style={styles.segmentTitle}>To-do for Supervisor</Text>
              {supervisorTodos.length === 0 ? (
                <View style={styles.segmentEmpty}>
                  <Text style={styles.segmentEmptyText}>No tasks pending supervisor approval.</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {supervisorTodos.map((row) => {
                    const status = String(row.status ?? '—');
                    const d = safeDate(row.date ?? '');
                    const dateLabel =
                      safeToLocaleDateString(d, { month: 'short', day: 'numeric', year: 'numeric' }) || (row.date ?? '—');

                    return (
                      <View key={row.id} style={styles.skelCard}>
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 16,
                              backgroundColor: 'rgba(79,70,229,0.12)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Clock size={18} color="#4f46e5" />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#111827', fontWeight: '900', fontSize: 14 }} numberOfLines={1}>
                              {row.activity}
                            </Text>
                            <Text style={{ marginTop: 6, color: '#7b845f', fontWeight: '800', fontSize: 12 }}>{dateLabel}</Text>
                            <Text style={{ marginTop: 4, color: '#6b7280', fontWeight: '700', fontSize: 12 }}>Status: {status}</Text>
                          </View>

                          <MotionPressable
                            accessibilityRole="button"
                            onPress={() => openSupervisorStatus(row)}
                            style={{ backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>Review</Text>
                          </MotionPressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tasks scheduled</Text>
            <Text style={styles.emptySub}>You’re all caught up for today.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {tasks.slice(0, 6).map((t, i) => (
              <TaskCard key={t.id} task={t} index={i} onMarkDone={openConfirm} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Supervisor Status Modal (placeholder) */}
      <Modal visible={supervisorModalOpen} transparent animationType="fade" onRequestClose={closeSupervisorStatus}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(79,70,229,0.10)' }]}>
              <Clock size={64} color="#4f46e5" />
            </View>
            <Text style={styles.modalTitle}>Supervisor Status</Text>
            <Text style={styles.modalDesc}>Supervisor status will be wired via API next.</Text>

            {selectedPlanItem ? (
              <View style={styles.taskPill}>
                <Text style={styles.taskPillText}>{selectedPlanItem.activity}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <MotionPressable
                accessibilityRole="button"
                onPress={closeSupervisorStatus}
                style={styles.cancelBtn as any}
                whileTap={{ scale: 0.95 }}
              >
                <Text style={styles.cancelText}>Close</Text>
              </MotionPressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={showTaskConfirmModal} transparent animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <CheckCircle2 size={64} color="#22c55e" />
            </View>
            <Text style={styles.modalTitle}>Complete Task?</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to mark this task as completed? This action will update the task status.
            </Text>

            {selectedTaskToComplete ? (
              <View style={styles.taskPill}>
                <Text style={styles.taskPillText}>{selectedTaskToComplete.title}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <MotionPressable
                accessibilityRole="button"
                onPress={closeConfirm}
                style={styles.cancelBtn as any}
                whileTap={{ scale: 0.95 }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </MotionPressable>

              <MotionPressable
                accessibilityRole="button"
                onPress={confirmComplete}
                style={styles.confirmBtn as any}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <Text style={styles.confirmText}>Yes, Complete</Text>
              </MotionPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function scheduleColorForTask(color: Task['color']) {
  // prefer the multi-color accents from theme
  const key = (color === 'purple' ? 'violet' : (color as any));
  return pickAccent(key).a;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f2ea',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 18,
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
    opacity: 0.35,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800',
    fontSize: 14,
  },
  bellWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  headerTitle: {
    marginTop: 10,
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  progressRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '800',
    fontSize: 13,
  },
  progressRight: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800',
    fontSize: 13,
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.26)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  upcomingCardShadow: {
    marginTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  upcomingCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    padding: 14,
  },
  upcomingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  upcomingIconText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  upcomingTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    fontSize: 12,
  },
  upcomingMain: {
    marginTop: 2,
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  upcomingMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  upcomingMetaText: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '800',
    fontSize: 12,
  },
  daysLeftPill: {
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  daysLeftText: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '900',
    fontSize: 11,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
  },
  segmentTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  segmentEmpty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  segmentEmptyText: {
    color: '#6b7280',
    fontWeight: '700',
    fontSize: 12,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 13,
  },

  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 14,
  },
  emptySub: {
    marginTop: 6,
    color: '#6b7280',
    fontWeight: '700',
    fontSize: 12,
  },

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
  toastText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    marginTop: 14,
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalDesc: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  taskPill: {
    marginTop: 14,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  taskPillText: {
    color: '#374151',
    fontWeight: '800',
    fontSize: 12,
  },
  modalActions: {
    marginTop: 18,
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  cancelText: { color: '#374151', fontWeight: '800' },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  confirmText: { color: '#fff', fontWeight: '900' },

  skelCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
});
