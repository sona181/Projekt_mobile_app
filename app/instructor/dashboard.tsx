import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { sessionService, type SessionBooking } from '../../src/services/sessionService';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function Avatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const id = user?.id ?? '';

  const [dash, setDash] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [bell, setBell] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const get = (path: string) =>
      fetch(`${BASE}/instructor/${id}/${path}`).then((r) => r.json());

    // Main dashboard data — if this fails, show error screen
    Promise.all([
      get('dashboard'),
      get('notes'),
      get('courses'),
      get('earnings'),
      get('notifications'),
    ])
      .then(([d, n, c, e, notif]) => {
        if (!d?.instructor) {
          setError('Could not load dashboard. Please check your connection and try again.');
          setLoading(false);
          return;
        }
        setDash(d);
        setNotes(Array.isArray(n) ? n : []);
        setCourses(Array.isArray(c) ? c : []);
        setEarnings(e);
        setBell(notif?.hasUnread ?? false);
        setLoading(false);
      })
      .catch((e) => {
        setError('Connection error: ' + e.message);
        setLoading(false);
      });

    // Bookings fetched separately — failure won't crash the whole dashboard
    sessionService.getInstructorBookings(id)
      .then((bk) => setBookings(Array.isArray(bk) ? bk : []))
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error || !dash) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        >
          <Text style={styles.retryText}>Sign Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const prof = dash.instructor;
  const stats = dash.stats;
  const sessions: any[] = dash.todaySessions ?? [];

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedUpcoming = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.scheduledAt) > new Date(),
  );

  async function handleBookingAction(bookingId: string, status: 'confirmed' | 'cancelled') {
    setActioningId(bookingId);
    try {
      await sessionService.updateStatus(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b)),
      );
    } catch {
      Alert.alert('Error', 'Could not update booking status.');
    } finally {
      setActioningId(null);
    }
  }

  async function handleStartCall(bookingId: string) {
    setActioningId(bookingId);
    try {
      const { joinUrl } = await sessionService.startCall(bookingId);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, liveSession: { joinUrl, status: 'live', startedAt: new Date().toISOString() } }
            : b,
        ),
      );
      Linking.openURL(joinUrl);
    } catch {
      Alert.alert('Error', 'Could not start the call.');
    } finally {
      setActioningId(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4c0884' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4c0884" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.backBtn}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>UniLearn</Text>
              <Text style={styles.brandSub}>Instructor Panel</Text>
            </View>
            <View style={styles.headerRight}>
              <View>
                <Text style={styles.bellIcon}>🔔</Text>
                {bell && <View style={styles.bellDot} />}
              </View>
              <TouchableOpacity onPress={() => router.push('/instructor/profile' as never)}>
                <Avatar initials={prof.initials} color="#7C3AED" size={40} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile summary */}
          <View style={styles.profileRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Mirëdita, {prof.displayName}!</Text>
              <Text style={styles.greetingSub}>
                {stats.todaySessionCount > 0
                  ? `${stats.todaySessionCount} session${stats.todaySessionCount > 1 ? 's' : ''} today`
                  : 'No sessions scheduled today'}
                {stats.hoursUntilNextSession !== null
                  ? ` · Next in ${stats.hoursUntilNextSession}h`
                  : ''}
              </Text>
              {prof.specialties ? (
                <Text style={styles.profileSpecialty} numberOfLines={1}>{prof.specialties}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.activeStudents}</Text>
              <Text style={styles.statLbl}>Active Students</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statNum}>{stats.monthlyEarnings}€</Text>
              <Text style={styles.statLbl}>This Month</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statNum}>{courses.length}</Text>
              <Text style={styles.statLbl}>Courses</Text>
            </View>
          </View>
        </View>

        {/* ── BODY ── */}
        <View style={styles.body}>

          {/* TODAY'S SESSIONS */}
          <Text style={styles.secTitle}>Today's Sessions</Text>
          {sessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No sessions scheduled for today</Text>
            </View>
          ) : (
            sessions.map((s: any, i: number) => (
              <View key={s.id} style={styles.row}>
                <Avatar initials={s.studentInitials} color={COLORS[i % COLORS.length]} size={42} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{s.studentName}</Text>
                  <Text style={styles.rowSub}>{s.time} · {s.topic}</Text>
                </View>
                <View style={[
                  styles.statusPill,
                  { backgroundColor: s.status === 'confirmed' ? '#ECFDF5' : '#FEF3C7' },
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: s.status === 'confirmed' ? '#059669' : '#D97706' },
                  ]}>
                    {s.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* SESSION REQUESTS */}
          <View style={styles.secTitleRow}>
            <Text style={styles.secTitle}>Session Requests</Text>
            {pendingBookings.length > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingBookings.length} new</Text>
              </View>
            )}
          </View>
          {pendingBookings.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyText}>No pending session requests</Text>
            </View>
          ) : (
            pendingBookings.map((b) => {
              const initials = (b.student?.displayName ?? 'ST')
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const date = new Date(b.scheduledAt);
              const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const dur = Math.round((new Date(b.endsAt).getTime() - date.getTime()) / 60000);
              const actioning = actioningId === b.id;
              return (
                <View key={b.id} style={styles.requestCard}>
                  <View style={styles.requestTop}>
                    <Avatar initials={initials} color="#7C3AED" size={44} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestName}>{b.student?.displayName ?? 'Student'}</Text>
                      <Text style={styles.requestTopic}>"{b.topic}"</Text>
                      <Text style={styles.requestMeta}>📅 {dateStr} · 🕐 {timeStr} · {dur} min</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.declineBtn, actioning && { opacity: 0.5 }]}
                      onPress={() => handleBookingAction(b.id, 'cancelled')}
                      disabled={actioning}
                    >
                      <Text style={styles.declineBtnText}>✕ Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.acceptBtn, actioning && { opacity: 0.5 }]}
                      onPress={() => handleBookingAction(b.id, 'confirmed')}
                      disabled={actioning}
                    >
                      <Text style={styles.acceptBtnText}>✓ Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* UPCOMING CONFIRMED SESSIONS */}
          <Text style={styles.secTitle}>Upcoming Sessions</Text>
          {confirmedUpcoming.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No upcoming confirmed sessions</Text>
            </View>
          ) : (
            confirmedUpcoming.map((b) => {
              const initials = (b.student?.displayName ?? 'ST')
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const date = new Date(b.scheduledAt);
              const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const isLive = b.liveSession?.status === 'live';
              const joinUrl = b.liveSession?.joinUrl ?? null;
              const actioning = actioningId === b.id;
              return (
                <View key={b.id} style={styles.upcomingCard}>
                  <View style={styles.upcomingCalBox}>
                    <Text style={styles.upcomingDay}>{date.getDate()}</Text>
                    <Text style={styles.upcomingMonth}>
                      {date.toLocaleString('en-US', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.requestTop}>
                      <Avatar initials={initials} color="#10B981" size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.requestName}>{b.student?.displayName ?? 'Student'}</Text>
                        <Text style={styles.requestTopic}>"{b.topic}"</Text>
                        <Text style={styles.requestMeta}>📅 {dateStr} · 🕐 {timeStr}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.startCallBtn, isLive && styles.startCallBtnLive, actioning && { opacity: 0.5 }]}
                      onPress={() => {
                        if (isLive && joinUrl) {
                          Linking.openURL(joinUrl);
                        } else {
                          handleStartCall(b.id);
                        }
                      }}
                      disabled={actioning}
                    >
                      <Text style={styles.startCallBtnText}>
                        {isLive ? '📹 Rejoin Call' : '🎥 Start Call'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* MY COURSES */}
          <Text style={styles.secTitle}>My Courses</Text>
          {courses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No courses yet. Upload your first course below.</Text>
            </View>
          ) : (
            courses.map((c: any) => {
              const active = c.status === 'published';
              const cardContent = (
                <>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseName} numberOfLines={1}>{c.title}</Text>
                    <View style={[styles.statusPill, { backgroundColor: active ? '#EDE9FE' : '#FEF3C7' }]}>
                      <Text style={[styles.statusText, { color: active ? '#7C3AED' : '#D97706' }]}>
                        {active ? 'Published' : 'Draft'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.courseMeta}>
                    {c.totalLessons} lessons · {c.studentCount} students
                  </Text>
                  <Bar pct={active ? 100 : 45} color={active ? '#7C3AED' : '#F59E0B'} />
                  {!active && (
                    <Text style={styles.courseEditHint}>Tap to continue editing →</Text>
                  )}
                </>
              );

              return active ? (
                <View key={c.id} style={styles.courseCard}>{cardContent}</View>
              ) : (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.courseCard, styles.courseCardDraft]}
                  onPress={() => router.push(`/instructor/create-course?courseId=${c.id}` as never)}
                  activeOpacity={0.8}
                >
                  {cardContent}
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity style={styles.uploadBtn} onPress={() => router.push('/instructor/create-course')}>
            <Text style={styles.uploadBtnText}>+ Upload New Course</Text>
          </TouchableOpacity>

          {/* SESSION NOTES */}
          <Text style={styles.secTitle}>Session Notes</Text>
          {notes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No session notes yet.</Text>
            </View>
          ) : (
            notes.map((n: any) => (
              <View key={n.id} style={styles.noteCard}>
                <View style={styles.noteLine} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteHeader}>
                    {n.studentName} · {new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={styles.noteBody}>{n.content}</Text>
                  <Text style={styles.noteShared}>
                    {n.isShared ? '✓ Shared with student' : '🔒 Private'}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* EARNINGS */}
          <Text style={styles.secTitle}>Recent Earnings</Text>
          {!earnings?.items?.length ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>No earnings recorded this month.</Text>
            </View>
          ) : (
            <>
              {earnings.items.map((e: any, i: number) => (
                <View key={e.id} style={styles.row}>
                  <Avatar initials={e.studentInitials} color={COLORS[i % COLORS.length]} size={40} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{e.studentName}</Text>
                    <Text style={styles.rowSub}>{e.typeLabel}</Text>
                  </View>
                  <Text style={styles.earning}>+{e.amount}{e.currency}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLbl}>Month Total</Text>
                <Text style={styles.totalAmt}>{earnings.total}€</Text>
              </View>
            </>
          )}

          {/* UPLOAD CONTENT */}
          <Text style={styles.secTitle}>Upload Content</Text>
          <TouchableOpacity style={styles.uploadCard}>
            <Text style={styles.uploadIcon}>🎥</Text>
            <Text style={styles.uploadCardTitle}>Upload Lesson Video</Text>
            <Text style={styles.uploadCardSub}>MP4, MOV up to 2GB</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadCard}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadCardTitle}>Upload Study Material</Text>
            <Text style={styles.uploadCardSub}>PDF, DOCX up to 50MB</Text>
          </TouchableOpacity>

          {/* SIGN OUT */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
          >
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorText: { color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: 'white', fontWeight: '700', fontSize: 14 },

  // Header
  header: { backgroundColor: '#4c0884', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  backBtn: { color: 'rgba(255,255,255,0.85)', fontSize: 28, fontWeight: '400', lineHeight: 32 },
  brand: { color: '#fff', fontWeight: '800', fontSize: 17 },
  brandSub: { color: '#C4B5FD', fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellIcon: { fontSize: 22 },
  bellDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', borderWidth: 1.5, borderColor: '#4c0884' },
  profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '800' },
  greetingSub: { color: '#C4B5FD', fontSize: 12, marginTop: 4 },
  profileSpecialty: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)' },
  statNum: { color: '#fff', fontWeight: '800', fontSize: 20 },
  statLbl: { color: '#C4B5FD', fontSize: 10, marginTop: 2 },

  // Avatar
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },

  // Body
  body: { backgroundColor: '#fff', paddingHorizontal: 20 },
  secTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 28, marginBottom: 14 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 4 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center' },

  // Rows (sessions / earnings)
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowName: { fontWeight: '600', fontSize: 14, color: '#111827' },
  rowSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Courses
  courseCard: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  courseCardDraft: { backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FDE68A', borderBottomWidth: 1 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  courseName: { fontWeight: '700', fontSize: 14, color: '#111827', flex: 1, marginRight: 8 },
  courseMeta: { color: '#6B7280', fontSize: 12, marginBottom: 8 },
  courseEditHint: { fontSize: 11, color: '#D97706', marginTop: 6, fontWeight: '600' },
  barBg: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 },
  barFill: { height: 5, borderRadius: 3 },

  // Upload course
  uploadBtn: { backgroundColor: '#7C3AED', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 4 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Notes
  noteCard: { flexDirection: 'row', marginBottom: 18 },
  noteLine: { width: 3, backgroundColor: '#7C3AED', borderRadius: 2, marginRight: 12 },
  noteHeader: { fontWeight: '700', fontSize: 13, color: '#111827', marginBottom: 4 },
  noteBody: { color: '#374151', fontSize: 13, lineHeight: 20 },
  noteShared: { color: '#6B7280', fontSize: 11, marginTop: 5 },

  // Earnings
  earning: { color: '#10B981', fontWeight: '700', fontSize: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4 },
  totalLbl: { color: '#6B7280', fontSize: 14 },
  totalAmt: { fontWeight: '800', fontSize: 20, color: '#111827' },

  // Upload content cards
  uploadCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 12 },
  uploadIcon: { fontSize: 28 },
  uploadCardTitle: { fontWeight: '700', fontSize: 14, color: '#111827' },
  uploadCardSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },

  // Sign out
  logoutBtn: { marginTop: 24, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

  // Session requests
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  pendingBadge: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  requestCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  requestName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  requestTopic: { fontSize: 13, color: '#4C0884', fontStyle: 'italic', marginBottom: 4 },
  requestMeta: { fontSize: 11, color: '#9CA3AF' },
  requestActions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#FECACA', alignItems: 'center',
  },
  declineBtnText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  acceptBtn: {
    flex: 2, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#059669', alignItems: 'center',
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Upcoming sessions
  upcomingCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  upcomingCalBox: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    alignSelf: 'flex-start',
  },
  upcomingDay: { fontSize: 20, fontWeight: '900', color: '#059669' },
  upcomingMonth: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  startCallBtn: {
    backgroundColor: '#4C0884',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  startCallBtnLive: { backgroundColor: '#DC2626' },
  startCallBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
