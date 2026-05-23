import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Redirect,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { courseService } from '../../src/services/courseService';
import type { EnrollmentSummary } from '../../src/types/course';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function courseEmoji(title: string, language: string): string {
  const t = title.toLowerCase();
  if (t.includes('python')) return '🐍';
  if (t.includes('java') && !t.includes('javascript')) return '☕';
  if (t.includes('javascript') || t.includes('js')) return '🟨';
  if (t.includes('c ') || t.includes('c-') || language === 'c') return '⚙️';
  if (t.includes('web') || t.includes('html') || t.includes('css')) return '🌐';
  if (t.includes('data') || t.includes('sql')) return '📊';
  if (t.includes('design') || t.includes('ui')) return '🎨';
  return '💻';
}

const COURSE_COLORS = ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#EF4444', '#06B6D4'];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <Text style={s.sectionTitle}>{text}</Text>;
}


function CourseCard({
  enrollment,
  colorIndex,
  onPress,
}: {
  enrollment: EnrollmentSummary;
  colorIndex: number;
  onPress: () => void;
}) {
  const { course, progress } = enrollment;
  const pct = Math.round(Number(progress?.progressPercent ?? 0));
  const color = COURSE_COLORS[colorIndex % COURSE_COLORS.length];
  const emoji = courseEmoji(course.title, course.language);
  const chapterLabel = `${course.chaptersCount} chapter${course.chaptersCount !== 1 ? 's' : ''}`;

  return (
    <TouchableOpacity style={s.courseCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.courseIconBox, { backgroundColor: `${color}18` }]}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={s.courseHeaderRow}>
          <Text style={s.courseTitle} numberOfLines={1}>{course.title}</Text>
          <Text style={[s.pct, { color }]}>{pct}%</Text>
        </View>
        <Text style={s.courseMeta}>
          {course.author.displayName} · {chapterLabel}
        </Text>
        <View style={s.progressBarBg}>
          <View style={[s.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        {progress && (
          <Text style={s.progressDetail}>
            {progress.completedLessons}/{progress.totalLessons} lessons
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  if (user?.role === 'instructor') return <Redirect href="/instructor/dashboard" />;

  const displayName = user?.profile?.displayName ?? user?.email ?? 'Student';
  const firstName = displayName.split(' ')[0];
  const initials = getInitials(displayName);

  async function loadEnrollments(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await courseService.myEnrollments();
      setEnrollments(data);
    } catch {
      // silently ignore — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadEnrollments(); }, []);

  function onRefresh() {
    setRefreshing(true);
    loadEnrollments(true);
  }

  const inProgressEnrollments = enrollments.filter(
    (e) => e.status === 'active' && (e.progress?.progressPercent ?? 0) < 100,
  );
  const completedEnrollments = enrollments.filter(
    (e) => e.progress?.progressPercent === 100 || e.status === 'completed',
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={s.hero}>
          <View style={s.topRow}>
            <View>
              <Text style={s.logo}>UniLearn</Text>
              <Text style={s.roleLabel}>Student</Text>
            </View>
            <TouchableOpacity
              style={s.avatarBtn}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={s.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.greeting}>Mirëdita, {firstName}!</Text>
          <Text style={s.subtitle}>Vazhdo nga ku u ndave</Text>

          <View style={s.statsRow}>
            <StatBox
              value={String(enrollments.length)}
              label={enrollments.length === 1 ? 'Kurs' : 'Kurse të regjistruara'}
            />
            <StatBox
              value={String(inProgressEnrollments.length)}
              label="Në progres"
            />
            <StatBox
              value={String(completedEnrollments.length)}
              label="Të përfunduara"
            />
          </View>
        </View>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <View style={s.body}>

          {/* In-progress courses */}
          <SectionTitle text="Vazhdo mësimet" />

          {loading ? (
            <ActivityIndicator color="#2563EB" style={{ marginVertical: 24 }} />
          ) : inProgressEnrollments.length === 0 ? (
            <TouchableOpacity
              style={s.emptyCoursesCard}
              onPress={() => router.push('/(tabs)/courses')}
            >
              <Text style={s.emptyCoursesEmoji}>📚</Text>
              <Text style={s.emptyCoursesTitle}>Nuk jeni regjistruar ende</Text>
              <Text style={s.emptyCoursesBtn}>Shfletoni kurset →</Text>
            </TouchableOpacity>
          ) : (
            inProgressEnrollments.map((e, i) => (
              <CourseCard
                key={e.id}
                enrollment={e}
                colorIndex={i}
                onPress={() => router.push(`/course/${e.course.slug}`)}
              />
            ))
          )}

          {/* Certificates */}
          {completedEnrollments.length > 0 && (
            <>
              <SectionTitle text="Certifikatat" />
              {completedEnrollments.map((e) => (
                <View key={e.id} style={s.certCard}>
                  <Text style={s.certIcon}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.certTitle}>{e.course.title}</Text>
                    <Text style={s.certSub}>
                      Përfunduar{' '}
                      {e.completedAt
                        ? new Date(e.completedAt).toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })
                        : ''}
                    </Text>
                  </View>
                  <Text style={s.certLink}>Shiko</Text>
                </View>
              ))}
            </>
          )}

          {/* Sign out */}
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
          >
            <Text style={s.logoutText}>Dilni nga llogaria</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1E3A8A' },
  scroll: { flex: 1, backgroundColor: '#F5F7FA' },

  // Hero
  hero: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: { color: 'white', fontWeight: '800', fontSize: 17 },
  roleLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: 'white', fontWeight: '800', fontSize: 14 },
  greeting: { color: 'white', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.75)', marginTop: 4, fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: 'white' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  // Body
  body: { padding: 18, paddingBottom: 60 },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginTop: 22,
    marginBottom: 12,
  },

  // Course cards
  courseCard: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  courseIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseTitle: { fontWeight: '800', color: '#111827', fontSize: 14, flex: 1, marginRight: 6 },
  pct: { fontWeight: '800', fontSize: 13 },
  courseMeta: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 10, marginTop: 8 },
  progressBarFill: { height: 6, borderRadius: 10 },
  progressDetail: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },

  // Empty courses
  emptyCoursesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyCoursesEmoji: { fontSize: 36, marginBottom: 10 },
  emptyCoursesTitle: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  emptyCoursesBtn: { color: '#2563EB', fontWeight: '800', fontSize: 14 },

  // Certificate
  certCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  certIcon: { fontSize: 24 },
  certTitle: { color: '#92400E', fontWeight: '800', fontSize: 14 },
  certSub: { color: '#B45309', fontSize: 12, marginTop: 2 },
  certLink: { color: '#B45309', fontWeight: '800', fontSize: 13 },

  // Logout
  logoutBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});
