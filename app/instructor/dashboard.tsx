import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

const API = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ?? '';

const AVATAR_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function Avatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${Math.min(progress, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const instructorId = user?.id ?? '';

  const [dashboard, setDashboard] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instructorId) return;

    Promise.all([
      fetch(`${API}/instructor/${instructorId}/dashboard`).then((r) => r.json()),
      fetch(`${API}/instructor/${instructorId}/notes`).then((r) => r.json()),
      fetch(`${API}/instructor/${instructorId}/courses`).then((r) => r.json()),
      fetch(`${API}/instructor/${instructorId}/earnings`).then((r) => r.json()),
      fetch(`${API}/instructor/${instructorId}/notifications`).then((r) => r.json()),
    ])
      .then(([dash, n, c, e, notif]) => {
        if (!dash?.instructor) {
          setError('Dashboard data unavailable. Make sure the backend is running.');
          setLoading(false);
          return;
        }
        setDashboard(dash);
        setNotes(Array.isArray(n) ? n : []);
        setCourses(Array.isArray(c) ? c : []);
        setEarnings(e);
        setHasNotifications(notif?.hasUnread ?? false);
        setLoading(false);
      })
      .catch((e) => {
        setError('Could not connect to server: ' + e.message);
        setLoading(false);
      });
  }, [instructorId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error || !dashboard) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Failed to load dashboard.'}</Text>
      </View>
    );
  }

  const prof = dashboard.instructor;
  const stats = dashboard.stats;
  const sessions: any[] = dashboard.todaySessions ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4c0884' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4c0884" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brand}>UniLearn</Text>
              <Text style={styles.brandSub}>Instructor</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.bellWrapper}>
                <Text style={styles.bellIcon}>🔔</Text>
                {hasNotifications && <View style={styles.bellDot} />}
              </View>
              <Avatar initials={prof.initials} color="#7C3AED" size={40} />
            </View>
          </View>

          <Text style={styles.greeting}>Mirëdita, {prof.displayName}!</Text>
          <Text style={styles.greetingSub}>
            {stats.todaySessionCount} sesione sot
            {stats.hoursUntilNextSession !== null
              ? ` · Sesioni fillon në ${stats.hoursUntilNextSession} orë`
              : ''}
          </Text>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statNum}>{stats.activeStudents}</Text>
              <Text style={styles.statLabel}>Studentë aktivë</Text>
            </View>
            <View>
              <Text style={styles.statNum}>{stats.monthlyEarnings}€</Text>
              <Text style={styles.statLabel}>Këtë muaj</Text>
            </View>
          </View>
        </View>

        {/* ── BODY ───────────────────────────────────────── */}
        <View style={styles.body}>

          {/* TODAY'S SESSIONS */}
          <Text style={styles.sectionTitle}>Sesionet e sotme</Text>
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>Nuk ka sesione sot.</Text>
          ) : (
            sessions.map((s: any, i: number) => (
              <View key={s.id} style={styles.sessionRow}>
                <Avatar initials={s.studentInitials} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{s.studentName}</Text>
                  <Text style={styles.sessionSub}>{s.time} · {s.topic}</Text>
                </View>
                <Text style={[
                  styles.statusBadge,
                  s.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending,
                ]}>
                  {s.status === 'confirmed' ? 'Konfirmuar' : 'Në pritje'}
                </Text>
              </View>
            ))
          )}

          {/* SESSION NOTES */}
          <Text style={styles.sectionTitle}>Shënimet e sesioneve</Text>
          {notes.length === 0 ? (
            <Text style={styles.emptyText}>Nuk ka shënime akoma.</Text>
          ) : (
            notes.map((n: any) => (
              <View key={n.id} style={styles.noteCard}>
                <View style={styles.noteLine} />
                <View style={styles.noteBody}>
                  <Text style={styles.noteHeader}>
                    {n.studentName} —{' '}
                    {new Date(n.date).toLocaleDateString('sq-AL', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                  <Text style={styles.noteText}>{n.content}</Text>
                  <Text style={styles.noteShared}>
                    {n.isShared ? 'I ndarë me studentin ✓' : 'Private — jo i ndarë'}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* COURSES */}
          <Text style={styles.sectionTitle}>Kurset e mia</Text>
          {courses.length === 0 ? (
            <Text style={styles.emptyText}>Nuk ke kurse akoma.</Text>
          ) : (
            courses.map((c: any) => {
              const isActive = c.status === 'published';
              const barColor = isActive ? '#7C3AED' : '#F59E0B';
              return (
                <View key={c.id} style={styles.courseCard}>
                  <View style={styles.courseRow}>
                    <Text style={styles.courseTitle}>{c.title}</Text>
                    <Text style={[styles.courseBadge, isActive ? styles.badgeActive : styles.badgeDraft]}>
                      {isActive ? 'Aktiv' : 'Draft'}
                    </Text>
                  </View>
                  <Text style={styles.courseMeta}>
                    {c.totalLessons} mësime · {c.studentCount} studentë
                  </Text>
                  <ProgressBar progress={isActive ? 100 : 50} color={barColor} />
                </View>
              );
            })
          )}

          <TouchableOpacity style={styles.uploadCourseBtn} activeOpacity={0.85}>
            <Text style={styles.uploadCourseBtnText}>+ Ngarko kurs të ri</Text>
          </TouchableOpacity>

          {/* EARNINGS */}
          <Text style={styles.sectionTitle}>Fitimet e fundit</Text>
          {!earnings?.items?.length ? (
            <Text style={styles.emptyText}>Nuk ka fitim këtë muaj.</Text>
          ) : (
            <>
              {earnings.items.map((e: any, i: number) => (
                <View key={e.id} style={styles.sessionRow}>
                  <Avatar initials={e.studentInitials} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{e.studentName}</Text>
                    <Text style={styles.sessionSub}>{e.typeLabel}</Text>
                  </View>
                  <Text style={styles.earningAmount}>+{e.amount}{e.currency}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total muajit</Text>
                <Text style={styles.totalAmount}>{earnings.total}€</Text>
              </View>
            </>
          )}

          {/* UPLOAD CONTENT */}
          <Text style={styles.sectionTitle}>Ngarko përmbajtje</Text>
          <TouchableOpacity style={styles.uploadCard} activeOpacity={0.8}>
            <Text style={styles.uploadIcon}>🎥</Text>
            <Text style={styles.uploadCardTitle}>Ngarko video mësimi</Text>
            <Text style={styles.uploadCardSub}>MP4, MOV deri në 2GB</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadCard} activeOpacity={0.8}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadCardTitle}>Ngarko material studimi</Text>
            <Text style={styles.uploadCardSub}>PDF, DOCX deri në 50MB</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', padding: 20 },
  emptyText: { color: '#9CA3AF', fontSize: 13, marginBottom: 16 },

  // Header
  header: { backgroundColor: '#4c0884', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brand: { color: '#fff', fontWeight: '700', fontSize: 16 },
  brandSub: { color: '#C4B5FD', fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrapper: { position: 'relative' },
  bellIcon: { fontSize: 22 },
  bellDot: {
    position: 'absolute', top: -1, right: -1,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F59E0B', borderWidth: 1.5, borderColor: '#4c0884',
  },
  greeting: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  greetingSub: { color: '#C4B5FD', fontSize: 13, marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 48 },
  statNum: { color: '#fff', fontWeight: '800', fontSize: 22 },
  statLabel: { color: '#C4B5FD', fontSize: 12, marginTop: 2 },

  // Avatar
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },

  // Body
  body: { backgroundColor: '#fff', paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 28, marginBottom: 14 },

  // Sessions
  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sessionInfo: { flex: 1, marginLeft: 14 },
  sessionName: { fontWeight: '600', fontSize: 15, color: '#111827' },
  sessionSub: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  statusBadge: { fontSize: 13, fontWeight: '600' },
  statusConfirmed: { color: '#059669' },
  statusPending: { color: '#6B7280' },

  // Notes
  noteCard: { flexDirection: 'row', marginBottom: 20 },
  noteLine: { width: 3, backgroundColor: '#7C3AED', borderRadius: 2, marginRight: 14 },
  noteBody: { flex: 1 },
  noteHeader: { fontWeight: '700', fontSize: 14, color: '#111827' },
  noteText: { color: '#374151', fontSize: 14, marginTop: 4, lineHeight: 20 },
  noteShared: { color: '#6B7280', fontSize: 12, marginTop: 6 },

  // Courses
  courseCard: { marginBottom: 22 },
  courseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseTitle: { fontWeight: '700', fontSize: 15, color: '#111827', flex: 1 },
  courseBadge: { fontWeight: '600', fontSize: 13 },
  badgeActive: { color: '#7C3AED' },
  badgeDraft: { color: '#6B7280' },
  courseMeta: { color: '#6B7280', fontSize: 13, marginTop: 3, marginBottom: 8 },
  barBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },

  // Upload course button
  uploadCourseBtn: { backgroundColor: '#7C3AED', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 4 },
  uploadCourseBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Earnings
  earningAmount: { color: '#10B981', fontWeight: '700', fontSize: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4 },
  totalLabel: { color: '#6B7280', fontSize: 14 },
  totalAmount: { fontWeight: '800', fontSize: 20, color: '#111827' },

  // Upload content cards
  uploadCard: { alignItems: 'center', padding: 28, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 14 },
  uploadIcon: { fontSize: 36 },
  uploadCardTitle: { fontWeight: '700', fontSize: 15, color: '#111827', marginTop: 10 },
  uploadCardSub: { color: '#6B7280', fontSize: 13, marginTop: 4 },
});
