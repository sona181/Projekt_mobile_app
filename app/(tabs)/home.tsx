import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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

// ─── Constants ────────────────────────────────────────────────────────────────
const COURSE_COLORS = ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#EF4444', '#06B6D4'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function courseEmoji(title: string, language: string): string {
  const t = (title ?? '').toLowerCase();
  const l = (language ?? '').toLowerCase();
  if (t.includes('python') || l === 'python') return '🐍';
  if (t.includes('java') && !t.includes('javascript')) return '☕';
  if (t.includes('javascript') || l === 'javascript') return '⚛️';
  if (t.includes('typescript') || l === 'typescript') return '🔷';
  if (t.includes('web') || t.includes('html') || t.includes('css')) return '🌐';
  if (t.includes('data') || t.includes('sql') || t.includes('analyt')) return '📊';
  if (t.includes('design') || t.includes('ui') || t.includes('ux')) return '🎨';
  if (t.includes('mobile') || t.includes('android') || t.includes('ios')) return '📱';
  if (t.includes('machine') || t.includes('ml') || t.includes('ai')) return '🤖';
  if (t.includes('security') || t.includes('cyber')) return '🔐';
  if (t.includes('cloud') || t.includes('devops')) return '☁️';
  if (l === 'c' || t.includes('c++')) return '⚙️';
  return '💻';
}

function colorForIndex(i: number) {
  return COURSE_COLORS[i % COURSE_COLORS.length];
}

// ─── Achievement definitions (unlocked from real data) ───────────────────────
function computeAchievements(
  totalEnrolled: number,
  totalCompleted: number,
  totalLessonsCompleted: number,
  hasHalfway: boolean,
) {
  return [
    {
      emoji: '🎯',
      title: 'First Step',
      desc: 'Enroll in a course',
      unlocked: totalEnrolled >= 1,
    },
    {
      emoji: '📚',
      title: 'Explorer',
      desc: 'Enroll in 3 courses',
      unlocked: totalEnrolled >= 3,
    },
    {
      emoji: '✅',
      title: 'Go-Getter',
      desc: 'Complete your first lesson',
      unlocked: totalLessonsCompleted >= 1,
    },
    {
      emoji: '🌗',
      title: 'Half Way',
      desc: 'Reach 50% on any course',
      unlocked: hasHalfway,
    },
    {
      emoji: '🏆',
      title: 'Graduate',
      desc: 'Complete a full course',
      unlocked: totalCompleted >= 1,
    },
    {
      emoji: '🔥',
      title: 'Dedicated',
      desc: 'Enroll in 5+ courses',
      unlocked: totalEnrolled >= 5,
    },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatBox({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={s.sectionAction}>{actionLabel} →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ProgressBar({ pct, color, height = 7 }: { pct: number; color: string; height?: number }) {
  return (
    <View style={[s.barBg, { height }]}>
      <View
        style={[
          s.barFill,
          { width: `${Math.min(Math.max(pct, 0), 100)}%` as any, backgroundColor: color, height },
        ]}
      />
    </View>
  );
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
  const color = colorForIndex(colorIndex);
  const emoji = courseEmoji(course.title, course.language);
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 8 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
    <TouchableOpacity style={s.courseCard} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <View style={[s.courseIconBox, { backgroundColor: `${color}18` }]}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.courseTopRow}>
          <Text style={s.courseTitle} numberOfLines={1}>{course.title}</Text>
          <Text style={[s.coursePct, { color }]}>{pct}%</Text>
        </View>
        <Text style={s.courseMeta}>
          {course.author.displayName} · {course.chaptersCount} chapter{course.chaptersCount !== 1 ? 's' : ''}
        </Text>
        <ProgressBar pct={pct} color={color} />
        {progress && (
          <Text style={s.progressDetail}>
            {progress.completedLessons} / {progress.totalLessons} lessons completed
          </Text>
        )}
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

function GoalRow({
  emoji,
  title,
  desc,
  pct,
  color,
}: {
  emoji: string;
  title: string;
  desc: string;
  pct: number;
  color: string;
}) {
  return (
    <View style={s.goalRow}>
      <Text style={s.goalEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <View style={s.goalLabelRow}>
          <Text style={s.goalTitle}>{title}</Text>
          <Text style={[s.goalPct, { color }]}>{Math.round(pct)}%</Text>
        </View>
        <Text style={s.goalDesc}>{desc}</Text>
        <ProgressBar pct={pct} color={color} height={5} />
      </View>
    </View>
  );
}

function AchievementBadge({
  emoji,
  title,
  desc,
  unlocked,
}: {
  emoji: string;
  title: string;
  desc: string;
  unlocked: boolean;
}) {
  return (
    <View style={[s.badge, !unlocked && s.badgeLocked]}>
      <Text style={[s.badgeEmoji, !unlocked && s.badgeEmojiLocked]}>{emoji}</Text>
      <Text style={[s.badgeTitle, !unlocked && s.badgeTitleLocked]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={s.badgeDesc} numberOfLines={2}>{desc}</Text>
      {unlocked && (
        <View style={s.badgeCheck}>
          <Text style={s.badgeCheckText}>✓</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Entrance animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  if (user?.role === 'instructor') return <Redirect href="/instructor/dashboard" />;

  const displayName = user?.profile?.displayName ?? user?.email ?? 'Student';
  const firstName = displayName.split(' ')[0];
  const initials = getInitials(displayName);

  async function loadEnrollments(silent = false) {
    if (!silent) setLoading(true);
    try {
      setEnrollments(await courseService.myEnrollments());
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEnrollments();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const inProgress = enrollments.filter(
    (e) => e.status === 'active' && (e.progress?.progressPercent ?? 0) < 100,
  );
  const completed = enrollments.filter(
    (e) => e.progress?.progressPercent === 100 || e.status === 'completed',
  );

  // Overall progress numbers
  const totalLessons = enrollments.reduce((s, e) => s + (e.progress?.totalLessons ?? 0), 0);
  const completedLessons = enrollments.reduce((s, e) => s + (e.progress?.completedLessons ?? 0), 0);
  const overallPct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Closest-to-finish course (for goals)
  const closestToFinish = inProgress.length > 0
    ? inProgress.reduce((best, e) =>
        (e.progress?.progressPercent ?? 0) > (best.progress?.progressPercent ?? 0) ? e : best,
      )
    : null;

  const hasHalfway = enrollments.some((e) => (e.progress?.progressPercent ?? 0) >= 50);
  const achievements = computeAchievements(enrollments.length, completed.length, completedLessons, hasHalfway);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Goals
  const courseGoalPct = enrollments.length > 0
    ? (completed.length / enrollments.length) * 100
    : 0;
  const nextCoursePct = closestToFinish?.progress?.progressPercent ?? 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEnrollments(true); }} tintColor="#3B82F6" />
        }
      >
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <View style={s.hero}>
          <View style={s.topRow}>
            <View>
              <Text style={s.logo}>UniLearn</Text>
              <Text style={s.roleLabel}>Student Dashboard</Text>
            </View>
            <TouchableOpacity style={s.avatarBtn} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={s.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.greeting}>Hello, {firstName}!</Text>
          <Text style={s.subtitle}>Keep up the great work</Text>

          {/* Stats row */}
          <View style={s.statsRow}>
            <StatBox value={String(enrollments.length)} label="Enrolled" />
            <StatBox value={String(inProgress.length)} label="In Progress" />
            <StatBox value={String(completed.length)} label="Completed" />
          </View>
        </View>

        {/* ── BODY ─────────────────────────────────────────────────────── */}
        <Animated.View style={[s.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Quick Actions */}
          <View style={s.quickRow}>
            <TouchableOpacity
              style={[s.quickBtn, { backgroundColor: '#2563EB' }]}
              onPress={() => router.push('/(tabs)/courses')}
              activeOpacity={0.85}
            >
              <Text style={s.quickIcon}>🔍</Text>
              <Text style={s.quickLabel}>Browse Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.quickBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.85}
            >
              <Text style={s.quickIcon}>📅</Text>
              <Text style={s.quickLabel}>My Sessions</Text>
            </TouchableOpacity>
          </View>

          {/* Overall Progress Card */}
          {enrollments.length > 0 && (
            <View style={s.overallCard}>
              <View style={s.overallHeader}>
                <View>
                  <Text style={s.overallTitle}>Overall Progress</Text>
                  <Text style={s.overallSub}>
                    {completedLessons} of {totalLessons} lessons completed
                  </Text>
                </View>
                <View style={s.overallPctCircle}>
                  <Text style={s.overallPctText}>{Math.round(overallPct)}%</Text>
                </View>
              </View>
              <ProgressBar pct={overallPct} color="#2563EB" height={10} />
              <View style={s.overallFooter}>
                <Text style={s.overallFooterText}>
                  {completed.length} course{completed.length !== 1 ? 's' : ''} finished
                </Text>
                <Text style={s.overallFooterText}>
                  {inProgress.length} in progress
                </Text>
              </View>
            </View>
          )}

          {/* Continue Learning */}
          <SectionHeader
            title="Continue Learning"
            actionLabel={inProgress.length > 2 ? 'See all' : undefined}
            onAction={() => router.push('/(tabs)/courses')}
          />

          {loading ? (
            <ActivityIndicator color="#2563EB" style={{ marginVertical: 24 }} />
          ) : inProgress.length === 0 ? (
            <TouchableOpacity style={s.emptyCard} onPress={() => router.push('/(tabs)/courses')}>
              <Text style={s.emptyEmoji}>📚</Text>
              <Text style={s.emptyTitle}>No courses in progress yet</Text>
              <Text style={s.emptyAction}>Browse courses →</Text>
            </TouchableOpacity>
          ) : (
            inProgress.map((e, i) => (
              <CourseCard
                key={e.id}
                enrollment={e}
                colorIndex={i}
                onPress={() => router.push(`/course/${e.course.slug}`)}
              />
            ))
          )}

          {/* Goals */}
          <SectionHeader title="My Goals" />
          <View style={s.goalsCard}>
            <GoalRow
              emoji="🎓"
              title="Complete enrolled courses"
              desc={`${completed.length} of ${enrollments.length} courses finished`}
              pct={courseGoalPct}
              color="#10B981"
            />
            {closestToFinish ? (
              <>
                <View style={s.goalDivider} />
                <GoalRow
                  emoji="🏁"
                  title="Finish your closest course"
                  desc={closestToFinish.course.title}
                  pct={nextCoursePct}
                  color="#F59E0B"
                />
              </>
            ) : null}
            <View style={s.goalDivider} />
            <GoalRow
              emoji="📖"
              title="Lesson progress"
              desc={`${completedLessons} lessons completed across all courses`}
              pct={overallPct}
              color="#2563EB"
            />
          </View>

          {/* Achievements */}
          <SectionHeader title="Achievements" />
          <Text style={s.achieveSub}>
            {unlockedCount} of {achievements.length} unlocked
          </Text>
          <View style={s.badgeGrid}>
            {achievements.map((a) => (
              <AchievementBadge
                key={a.title}
                emoji={a.emoji}
                title={a.title}
                desc={a.desc}
                unlocked={a.unlocked}
              />
            ))}
          </View>

          {/* Certificates */}
          {completed.length > 0 && (
            <>
              <SectionHeader title="Certificates" />
              {completed.map((e) => (
                <View key={e.id} style={s.certCard}>
                  <Text style={s.certIcon}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.certTitle}>{e.course.title}</Text>
                    <Text style={s.certSub}>
                      Completed{' '}
                      {e.completedAt
                        ? new Date(e.completedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : ''}
                    </Text>
                  </View>
                  <Text style={s.certLink}>View</Text>
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
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1E3A8A' },
  scroll: { flex: 1, backgroundColor: '#F1F5F9' },

  // ── Hero
  hero: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: { color: '#fff', fontWeight: '800', fontSize: 18 },
  roleLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  avatarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  greeting: { color: '#fff', fontSize: 26, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.7)', marginTop: 3, fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14,
    padding: 13,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 },

  // ── Body
  body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sectionAction: { fontSize: 13, fontWeight: '700', color: '#2563EB' },

  // ── Progress bar
  barBg: { backgroundColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
  barFill: { borderRadius: 10 },

  // ── Quick actions
  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  quickIcon: { fontSize: 18 },
  quickLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Overall progress card
  overallCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  overallSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  overallPctCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#2563EB',
  },
  overallPctText: { fontSize: 13, fontWeight: '800', color: '#2563EB' },
  overallFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  overallFooterText: { fontSize: 11, color: '#9CA3AF' },

  // ── Course cards
  courseCard: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  courseIconBox: {
    width: 52,
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseTitle: { fontWeight: '800', color: '#111827', fontSize: 14, flex: 1, marginRight: 8 },
  coursePct: { fontWeight: '800', fontSize: 14 },
  courseMeta: { color: '#6B7280', fontSize: 12, marginTop: 2, marginBottom: 8 },
  progressDetail: { color: '#9CA3AF', fontSize: 11, marginTop: 5 },

  // ── Empty state
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 38, marginBottom: 10 },
  emptyTitle: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  emptyAction: { color: '#2563EB', fontWeight: '800', fontSize: 14 },

  // ── Goals
  goalsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  goalRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  goalEmoji: { fontSize: 22, marginTop: 1 },
  goalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  goalTitle: { fontWeight: '700', color: '#111827', fontSize: 13, flex: 1 },
  goalPct: { fontWeight: '800', fontSize: 13 },
  goalDesc: { color: '#9CA3AF', fontSize: 11, marginBottom: 6 },
  goalDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

  // ── Achievement badges
  achieveSub: { fontSize: 12, color: '#9CA3AF', marginTop: -8, marginBottom: 12 },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  badgeLocked: { backgroundColor: '#F9FAFB', opacity: 0.6 },
  badgeEmoji: { fontSize: 26, marginBottom: 6 },
  badgeEmojiLocked: { opacity: 0.4 },
  badgeTitle: { fontWeight: '800', fontSize: 12, color: '#111827', textAlign: 'center', marginBottom: 3 },
  badgeTitleLocked: { color: '#9CA3AF' },
  badgeDesc: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 14 },
  badgeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCheckText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // ── Certificates
  certCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  certIcon: { fontSize: 26 },
  certTitle: { color: '#92400E', fontWeight: '800', fontSize: 14 },
  certSub: { color: '#B45309', fontSize: 12, marginTop: 2 },
  certLink: { color: '#B45309', fontWeight: '800', fontSize: 13 },

  // ── Sign out
  logoutBtn: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});
