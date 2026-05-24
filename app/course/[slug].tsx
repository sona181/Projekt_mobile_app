import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Chip,
  Divider,
  Icon,
  List,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { courseService } from '../../src/services/courseService';
import type { CourseDetail } from '../../src/types/course';

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  useEffect(() => {
    courseService
      .getBySlug(slug)
      .then(setCourse)
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleEnroll() {
    if (!course) return;
    setEnrolling(true);
    try {
      await courseService.enroll(course.id);
      setCourse((prev) =>
        prev ? { ...prev, isEnrolled: true, enrollment: { id: '', status: 'active', enrolledAt: new Date().toISOString(), progress: { totalLessons: 0, completedLessons: 0, progressPercent: 0 } } } : prev,
      );
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Enrollment failed.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(' ') : msg);
    } finally {
      setEnrolling(false);
    }
  }

  if (loading || !course) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const totalLessons = course.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
  const totalMinutes = course.chapters
    .flatMap((ch) => ch.lessons)
    .reduce((s, l) => s + (l.durationSeconds ?? 0), 0) / 60;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <Button
          icon="arrow-left"
          onPress={() => router.back()}
          style={styles.backBtn}
          compact
        >
          Back
        </Button>

        {/* Header card */}
        <Surface style={styles.headerCard} elevation={1}>
          <View style={styles.tagRow}>
            <Chip compact style={{ backgroundColor: '#EEF2FF' }}>
              {course.level}
            </Chip>
            {course.isPremium && (
              <Chip compact icon="crown" style={{ backgroundColor: '#FEF9C3' }}>
                Premium
              </Chip>
            )}
            {course.category && (
              <Chip compact style={{ backgroundColor: '#F3F4F6' }}>
                {course.category.name}
              </Chip>
            )}
          </View>

          <Text variant="headlineSmall" style={styles.courseTitle}>
            {course.title}
          </Text>

          {course.description ? (
            <Text variant="bodyMedium" style={styles.description}>
              {course.description}
            </Text>
          ) : null}

          {/* Stats row */}
          <View style={styles.statsRow}>
            {course.avgRating !== null && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>★ {course.avgRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{course.stats.enrollments.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{course.stats.chapters}</Text>
              <Text style={styles.statLabel}>Chapters</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalLessons}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            {totalMinutes > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(totalMinutes)}m</Text>
                <Text style={styles.statLabel}>Content</Text>
              </View>
            )}
          </View>

          {/* Author — tappable → instructor profile */}
          <TouchableOpacity
            style={styles.author}
            onPress={() => router.push(`/instructor/${course.author.id}` as never)}
            activeOpacity={0.7}
          >
            {course.author.avatarUrl ? (
              <Avatar.Image size={32} source={{ uri: course.author.avatarUrl }} />
            ) : (
              <Avatar.Text
                size={32}
                label={course.author.displayName.slice(0, 2).toUpperCase()}
              />
            )}
            <Text variant="bodyMedium" style={styles.authorName}>
              {course.author.displayName}
            </Text>
            <Text style={styles.authorArrow}>›</Text>
          </TouchableOpacity>
        </Surface>

        {/* Landing page — AI-generated content */}
        {course.landingPage && (
          <>
            {(course.landingPage.headline || course.landingPage.subheadline) && (
              <View style={styles.lpHero}>
                {course.landingPage.headline ? (
                  <Text variant="titleLarge" style={styles.lpHeadline}>
                    {course.landingPage.headline}
                  </Text>
                ) : null}
                {course.landingPage.subheadline ? (
                  <Text variant="bodyMedium" style={styles.lpSubheadline}>
                    {course.landingPage.subheadline}
                  </Text>
                ) : null}
              </View>
            )}

            {Array.isArray(course.landingPage.objectives) && course.landingPage.objectives.length > 0 && (
              <View style={styles.lpSection}>
                <Text variant="titleMedium" style={styles.lpSectionTitle}>✅ What You'll Learn</Text>
                {(course.landingPage.objectives as string[]).map((obj, i) => (
                  <View key={i} style={styles.lpBulletRow}>
                    <Text style={styles.lpBulletDot}>•</Text>
                    <Text variant="bodyMedium" style={styles.lpBulletText}>{obj}</Text>
                  </View>
                ))}
              </View>
            )}

            {Array.isArray(course.landingPage.targetAudience) && course.landingPage.targetAudience.length > 0 && (
              <View style={styles.lpSection}>
                <Text variant="titleMedium" style={styles.lpSectionTitle}>🎯 Who Is This For</Text>
                {(course.landingPage.targetAudience as string[]).map((item, i) => (
                  <View key={i} style={styles.lpBulletRow}>
                    <Text style={styles.lpBulletDot}>•</Text>
                    <Text variant="bodyMedium" style={styles.lpBulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Enroll / progress */}
        <View style={styles.enrollSection}>
          {course.isEnrolled ? (
            <View>
              <View style={styles.progressBox}>
                <View style={styles.progressHeader}>
                  <Icon source="check-circle" size={20} color="#16A34A" />
                  <Text variant="labelLarge" style={{ color: '#16A34A', marginLeft: 6 }}>
                    Enrolled
                  </Text>
                </View>
                {course.enrollment?.progress && (
                  <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                    {course.enrollment.progress.completedLessons} /{' '}
                    {course.enrollment.progress.totalLessons} lessons completed (
                    {Number(course.enrollment.progress.progressPercent).toFixed(0)}%)
                  </Text>
                )}
              </View>
              <Button
                mode="contained"
                icon="play"
                onPress={() => {
                  const firstLesson = course.chapters?.[0]?.lessons?.[0];
                  if (firstLesson) router.push(`/course/${slug}/lesson/${firstLesson.id}`);
                }}
                style={{ marginTop: 10 }}
                contentStyle={{ paddingVertical: 6 }}
              >
                Start Learning
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={handleEnroll}
              loading={enrolling}
              disabled={enrolling}
              contentStyle={styles.enrollBtnContent}
              icon="school"
            >
              {course.isPremium
                ? `Enroll · €${course.price?.toFixed(2) ?? '—'}`
                : 'Enroll for Free'}
            </Button>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Curriculum */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Curriculum
        </Text>
        {course.chapters.map((chapter) => (
          <List.Accordion
            key={chapter.id}
            title={chapter.title}
            description={`${chapter.lessons.length} lessons`}
            expanded={expandedChapter === chapter.id}
            onPress={() =>
              setExpandedChapter((prev) => (prev === chapter.id ? null : chapter.id))
            }
            style={styles.accordion}
          >
            {chapter.lessons.map((lesson) => {
              const canOpen = course.isEnrolled || lesson.isFreePreview;
              return (
                <List.Item
                  key={lesson.id}
                  title={lesson.title}
                  description={
                    lesson.durationSeconds
                      ? `${Math.round(lesson.durationSeconds / 60)} min`
                      : lesson.lessonType
                  }
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        lesson.lessonType === 'video'
                          ? 'play-circle-outline'
                          : lesson.lessonType === 'exercise'
                            ? 'code-tags'
                            : lesson.lessonType === 'pdf'
                              ? 'file-pdf-box'
                              : 'file-document-outline'
                      }
                    />
                  )}
                  right={() =>
                    lesson.isFreePreview ? (
                      <Chip compact style={{ backgroundColor: '#ECFDF5', alignSelf: 'center' }}>
                        Preview
                      </Chip>
                    ) : null
                  }
                  onPress={canOpen ? () => router.push(`/course/${slug}/lesson/${lesson.id}`) : undefined}
                  style={[styles.lessonItem, canOpen && { backgroundColor: '#FAFAFA' }]}
                />
              );
            })}
          </List.Accordion>
        ))}

        {/* Recent reviews */}
        {course.recentReviews.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Reviews
            </Text>
            {course.recentReviews.map((review) => (
              <Surface key={review.id} style={styles.reviewCard} elevation={0}>
                <View style={styles.reviewHeader}>
                  {review.user.avatarUrl ? (
                    <Avatar.Image size={28} source={{ uri: review.user.avatarUrl }} />
                  ) : (
                    <Avatar.Text
                      size={28}
                      label={review.user.displayName.slice(0, 2).toUpperCase()}
                    />
                  )}
                  <Text variant="labelMedium" style={styles.reviewAuthor}>
                    {review.user.displayName}
                  </Text>
                  <Text style={styles.reviewStars}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </Text>
                </View>
                {review.comment && (
                  <Text variant="bodySmall" style={styles.reviewComment}>
                    {review.comment}
                  </Text>
                )}
              </Surface>
            ))}
          </>
        )}

        {/* FAQ */}
        {course.landingPage &&
          Array.isArray(course.landingPage.faq) &&
          course.landingPage.faq.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>FAQ</Text>
              {(course.landingPage.faq as { question: string; answer: string }[]).map((item, i) => (
                <Surface key={i} style={styles.faqCard} elevation={0}>
                  <Text variant="labelLarge" style={styles.faqQuestion}>{item.question}</Text>
                  <Text variant="bodyMedium" style={styles.faqAnswer}>{item.answer}</Text>
                </Surface>
              ))}
            </>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', marginTop: 8, marginLeft: 8 },
  headerCard: { margin: 16, borderRadius: 12, padding: 16 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  courseTitle: { fontWeight: '700', marginBottom: 8 },
  description: { color: '#555', lineHeight: 22, marginBottom: 12 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontWeight: '700', fontSize: 16 },
  statLabel: { fontSize: 11, color: '#999' },
  author: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  authorName: { marginLeft: 8, color: '#555', flex: 1 },
  authorArrow: { fontSize: 18, color: '#9CA3AF' },
  enrollSection: { paddingHorizontal: 16, marginBottom: 8 },
  enrollBtnContent: { paddingVertical: 6 },
  progressBox: { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12 },
  progressHeader: { flexDirection: 'row', alignItems: 'center' },
  divider: { marginVertical: 16, marginHorizontal: 16 },
  sectionTitle: { fontWeight: '700', marginHorizontal: 16, marginBottom: 8 },
  accordion: { marginHorizontal: 8 },
  lessonItem: { paddingLeft: 24 },
  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reviewAuthor: { marginLeft: 8, flex: 1 },
  reviewStars: { color: '#F59E0B', letterSpacing: 1 },
  reviewComment: { color: '#555', lineHeight: 20 },

  // Landing page
  lpHero: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16 },
  lpHeadline: { fontWeight: '800', color: '#1E3A8A', marginBottom: 6 },
  lpSubheadline: { color: '#374151', lineHeight: 22 },
  lpSection: { marginHorizontal: 16, marginTop: 16 },
  lpSectionTitle: { fontWeight: '700', marginBottom: 10 },
  lpBulletRow: { flexDirection: 'row', marginBottom: 6 },
  lpBulletDot: { color: '#6B7280', marginRight: 8, marginTop: 2 },
  lpBulletText: { flex: 1, color: '#374151', lineHeight: 22 },

  // FAQ
  faqCard: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 10, backgroundColor: '#F9FAFB' },
  faqQuestion: { color: '#111827', marginBottom: 4 },
  faqAnswer: { color: '#555', lineHeight: 20 },
});
