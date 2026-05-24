import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Card, Chip, ProgressBar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { courseService } from '../../src/services/courseService';
import type { EnrollmentSummary } from '../../src/types/course';

const ACHIEVEMENTS = [
  { icon: '🏅', label: 'Fast Learner', color: '#FEF3C7', border: '#FDE68A' },
  { icon: '🔥', label: 'On Fire', color: '#FEF3C7', border: '#FDE68A' },
  { icon: '⭐', label: 'Top Student', color: '#EEF2FF', border: '#C7D2FE' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);

  const displayName = user?.profile?.displayName ?? user?.email ?? 'Learner';
  const email = user?.email ?? '';
  const bio = user?.profile?.bio;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const completed = enrollments.filter(
    (e) => Number(e.progress?.progressPercent ?? 0) >= 100,
  ).length;

  useEffect(() => {
    courseService
      .myEnrollments()
      .then(setEnrollments)
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.screenTitle}>My Profile</Text>
            <TouchableOpacity onPress={() => router.push('/profile/edit')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarRow}>
            {user?.profile?.avatarUrl ? (
              <Avatar.Image size={72} source={{ uri: user.profile.avatarUrl }} />
            ) : (
              <Avatar.Text
                size={72}
                label={initials}
                style={styles.avatarText}
                labelStyle={styles.avatarLabel}
              />
            )}
            <View style={styles.nameBlock}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.emailText}>{email}</Text>
              {bio ? <Text style={styles.bioText}>{bio}</Text> : null}
              <Chip
                compact
                style={styles.roleChip}
                textStyle={styles.roleChipText}
              >
                Student
              </Chip>
            </View>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>🔥 0</Text>
            <Text style={styles.statLbl}>Day Streak</Text>
          </View>
          <View style={[styles.statBox, styles.statBorderH]}>
            <Text style={styles.statVal}>0 XP</Text>
            <Text style={styles.statLbl}>Total Points</Text>
          </View>
          <View style={[styles.statBox, styles.statBorderH]}>
            <Text style={styles.statVal}>{enrollments.length}</Text>
            <Text style={styles.statLbl}>Enrolled</Text>
          </View>
          <View style={[styles.statBox, styles.statBorderH]}>
            <Text style={styles.statVal}>{completed}</Text>
            <Text style={styles.statLbl}>Completed</Text>
          </View>
        </View>

        {/* ── My Courses ── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>My Courses</Text>
          {enrollments.length === 0 ? (
            <Card style={styles.emptyCard} mode="elevated">
              <Card.Content>
                <Text style={styles.emptyText}>No courses enrolled yet.</Text>
              </Card.Content>
            </Card>
          ) : (
            enrollments.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/course/${item.course.slug}` as never)}
                activeOpacity={0.85}
              >
                <Card style={styles.courseCard} mode="elevated">
                  <Card.Content style={styles.courseContent}>
                    <View style={styles.courseIcon}>
                      <Text style={styles.courseEmoji}>
                        {item.course.slug === 'java-basics'
                          ? '☕'
                          : item.course.slug === 'python-basics'
                          ? '🐍'
                          : item.course.slug === 'c-basics'
                          ? '🖥️'
                          : '📘'}
                      </Text>
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle} numberOfLines={1}>
                        {item.course.title}
                      </Text>
                      <Text style={styles.courseMeta}>
                        {item.course.author.displayName}
                      </Text>
                      <View style={styles.progressRow}>
                        <ProgressBar
                          progress={Number(item.progress?.progressPercent ?? 0) / 100}
                          color={theme.colors.primary}
                          style={styles.progressBar}
                        />
                        <Text style={styles.progressPct}>
                          {Number(item.progress?.progressPercent ?? 0).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    {Number(item.progress?.progressPercent ?? 0) >= 100 && (
                      <Text style={styles.doneCheck}>✓</Text>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── Achievements ── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Achievements</Text>
          <View style={styles.badgeRow}>
            {ACHIEVEMENTS.map((a) => (
              <View
                key={a.label}
                style={[styles.badge, { backgroundColor: a.color, borderColor: a.border }]}
              >
                <Text style={styles.badgeIcon}>{a.icon}</Text>
                <Text style={styles.badgeLbl}>{a.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Account Settings ── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Account</Text>
          <Card style={styles.settingsCard} mode="elevated">
            <Card.Content style={{ padding: 0 }}>
              <TouchableOpacity style={styles.settingsRow} onPress={() => router.push('/profile/edit')}>
                <Text style={styles.settingsIcon}>👤</Text>
                <Text style={styles.settingsLabel}>Edit Profile</Text>
                <Text style={styles.settingsChevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingsRow}>
                <Text style={styles.settingsIcon}>🔔</Text>
                <Text style={styles.settingsLabel}>Notifications</Text>
                <Text style={styles.settingsChevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingsRow}>
                <Text style={styles.settingsIcon}>❓</Text>
                <Text style={styles.settingsLabel}>Help & Support</Text>
                <Text style={styles.settingsChevron}>›</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>

        {/* ── Sign Out ── */}
        <View style={styles.section}>
          <Button
            mode="outlined"
            onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
            icon="logout"
            textColor="#EF4444"
            style={styles.logoutBtn}
            contentStyle={styles.logoutContent}
          >
            Sign Out
          </Button>
          <Text style={styles.versionText}>UniLearn v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: { fontSize: 18, fontWeight: '800', color: 'white' },
  editLink: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarText: { backgroundColor: '#3B82F6' },
  avatarLabel: { fontSize: 26, fontWeight: '700' },
  nameBlock: { flex: 1, gap: 3 },
  displayName: { fontSize: 18, fontWeight: '800', color: 'white' },
  emailText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  bioText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 16 },
  roleChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 20,
  },
  roleChipText: { color: 'white', fontSize: 10, fontWeight: '600' },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorderH: { borderLeftWidth: 0.5, borderLeftColor: '#E5E7EB' },
  statVal: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statLbl: { fontSize: 9, color: '#6B7280', marginTop: 2 },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 20 },
  secTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 12 },

  // Courses
  emptyCard: { borderRadius: 12 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', fontSize: 13 },
  courseCard: { borderRadius: 12, marginBottom: 10 },
  courseContent: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  courseEmoji: { fontSize: 22 },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  courseMeta: { fontSize: 10, color: '#9CA3AF', marginBottom: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 5, borderRadius: 3 },
  progressPct: { fontSize: 10, color: '#6B7280', width: 30 },
  doneCheck: { fontSize: 16, color: '#10B981', fontWeight: '700' },

  // Achievements
  badgeRow: { flexDirection: 'row', gap: 10 },
  badge: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  badgeIcon: { fontSize: 22, marginBottom: 5 },
  badgeLbl: { fontSize: 10, fontWeight: '600', color: '#374151', textAlign: 'center' },

  // Settings
  settingsCard: { borderRadius: 12 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingsIcon: { fontSize: 16, marginRight: 12 },
  settingsLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: '#111827' },
  settingsChevron: { fontSize: 20, color: '#9CA3AF' },
  divider: { height: 0.5, backgroundColor: '#F3F4F6', marginHorizontal: 14 },

  // Logout
  logoutBtn: {
    borderColor: '#FECACA',
    borderRadius: 12,
  },
  logoutContent: { paddingVertical: 4 },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
