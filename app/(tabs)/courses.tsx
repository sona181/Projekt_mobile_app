import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native-paper';
import { courseService } from '../../src/services/courseService';
import type { CourseSummary, CourseCategory, EnrollmentSummary } from '../../src/types/course';

const LEVELS = ['All', 'beginner', 'intermediate', 'advanced'];

const CARD_COLORS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#0284C7', '#15803D',
];

function courseEmoji(title: string, language: string): string {
  const t = (title ?? '').toLowerCase();
  const l = (language ?? '').toLowerCase();
  if (t.includes('python') || l === 'python') return '🐍';
  if (t.includes('java') || l === 'java') return '☕';
  if (t.includes('react') || t.includes('javascript') || l === 'javascript') return '⚛️';
  if (t.includes('web') || t.includes('html') || t.includes('css')) return '🌐';
  if (t.includes('data') || t.includes('analyt')) return '📊';
  if (t.includes('machine') || t.includes(' ai ') || t.includes(' ml')) return '🤖';
  if (t.includes('design') || t.includes(' ui ') || t.includes(' ux')) return '🎨';
  if (t.includes('mobile') || t.includes('android') || t.includes('ios')) return '📱';
  if (t.includes('database') || t.includes('sql')) return '🗄️';
  if (t.includes('security') || t.includes('cyber')) return '🔐';
  if (t.includes('cloud') || t.includes('devops') || t.includes('docker')) return '☁️';
  if (t.includes('typescript') || l === 'typescript') return '🔷';
  if (t.includes('c++') || l === 'c') return '⚙️';
  return '📚';
}

function colorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length];
}

function levelLabel(l: string) {
  return l.charAt(0).toUpperCase() + l.slice(1);
}

function levelColor(level: string) {
  if (level === 'beginner') return '#DCFCE7';
  if (level === 'intermediate') return '#FEF9C3';
  if (level === 'advanced') return '#FEE2E2';
  return '#F3F4F6';
}

// ─── Search box ───────────────────────────────────────────────────────────────
function SearchBox({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return (
    <View style={styles.searchBox}>
      <Text style={styles.searchBoxIcon}>🔍</Text>
      <TextInput
        style={styles.searchBoxInput}
        value={value}
        onChangeText={onChange}
        placeholder="Search courses, topics, instructors…"
        placeholderTextColor="#9CA3AF"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')}>
          <Text style={styles.searchClear}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Continue Learning card (enrolled) ───────────────────────────────────────
function EnrolledCard({ e, onPress }: { e: EnrollmentSummary; onPress: () => void }) {
  const color = colorForId(e.course.id);
  const emoji = courseEmoji(e.course.title, e.course.language);
  const pct = Math.round(e.progress?.progressPercent ?? 0);
  return (
    <TouchableOpacity style={styles.enrolledCard} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.enrolledBanner, { backgroundColor: color }]}>
        <Text style={styles.enrolledEmoji}>{emoji}</Text>
      </View>
      <View style={styles.enrolledBody}>
        <Text style={styles.enrolledTitle} numberOfLines={2}>{e.course.title}</Text>
        <Text style={styles.enrolledAuthor}>{e.course.author.displayName}</Text>
        <View style={styles.enrolledBarBg}>
          <View style={[styles.enrolledBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={styles.enrolledPct}>{pct}% complete</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Browse course card ───────────────────────────────────────────────────────
function CourseCard({ course, onPress }: { course: CourseSummary; onPress: () => void }) {
  const color = colorForId(course.id);
  const emoji = courseEmoji(course.title, course.language);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.cardBanner, { backgroundColor: color }]}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <View style={styles.cardBadges}>
          {course.isPremium ? (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>👑 Premium</Text>
            </View>
          ) : (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free</Text>
            </View>
          )}
          {course.isEnrolled && (
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledBadgeText}>✓ Enrolled</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          {course.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{course.category.name}</Text>
            </View>
          )}
          <View style={[styles.levelPill, { backgroundColor: levelColor(course.level) }]}>
            <Text style={styles.levelPillText}>{levelLabel(course.level)}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{course.title}</Text>

        {course.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{course.description}</Text>
        ) : null}

        <View style={styles.authorRow}>
          <View style={[styles.authorAvatar, { backgroundColor: color }]}>
            <Text style={styles.authorAvatarText}>
              {course.author.displayName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.authorName}>{course.author.displayName}</Text>
        </View>

        <View style={styles.statsRow}>
          {course.stats.avgRating !== null && (
            <Text style={styles.rating}>★ {course.stats.avgRating.toFixed(1)}</Text>
          )}
          <Text style={styles.statText}>
            {course.stats.enrollments.toLocaleString()} students
          </Text>
          <Text style={styles.statText}>
            {course.stats.chapters} chapter{course.stats.chapters !== 1 ? 's' : ''}
          </Text>
          <View style={styles.priceTag}>
            {course.isPremium && course.price !== null ? (
              <Text style={styles.priceText}>€{course.price.toFixed(2)}</Text>
            ) : (
              <Text style={styles.freeText}>Free</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CoursesScreen() {
  const router = useRouter();

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCourses = useCallback(
    async (p: number, q: string, level: string, catSlug: string | null, replace: boolean) => {
      try {
        const res = await courseService.list({
          page: p,
          limit: 15,
          search: q || undefined,
          level: level !== 'All' ? level : undefined,
          category: catSlug ?? undefined,
        });
        setCourses((prev) => (replace ? res.data : [...prev, ...res.data]));
        setTotal(res.meta.total);
        setPage(p);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    Promise.all([
      courseService.listCategories().catch(() => [] as CourseCategory[]),
      courseService.myEnrollments().catch(() => [] as EnrollmentSummary[]),
    ]).then(([cats, enr]) => {
      setCategories(cats);
      setEnrollments(enr);
    });
    fetchCourses(1, '', 'All', null, true);
  }, [fetchCourses]);

  useEffect(() => {
    setLoading(true);
    fetchCourses(1, search, selectedLevel, selectedCategory, true);
  }, [selectedLevel, selectedCategory]); // eslint-disable-line

  function onSearchChange(text: string) {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setLoading(true);
      fetchCourses(1, text, selectedLevel, selectedCategory, true);
    }, 400);
  }

  function onRefresh() {
    setRefreshing(true);
    Promise.all([
      courseService.myEnrollments().catch(() => [] as EnrollmentSummary[]),
    ]).then(([enr]) => {
      setEnrollments(enr);
      fetchCourses(1, search, selectedLevel, selectedCategory, true);
    });
  }

  function onLoadMore() {
    if (loadingMore || courses.length >= total) return;
    setLoadingMore(true);
    fetchCourses(page + 1, search, selectedLevel, selectedCategory, false);
  }

  const activeEnrollments = enrollments.filter((e) => e.status === 'active');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Fixed header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Browse Courses</Text>
            <Text style={styles.headerSub}>
              {total > 0 ? `${total} courses available` : 'Explore all courses'}
            </Text>
          </View>
        </View>

        <SearchBox value={search} onChange={onSearchChange} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          <TouchableOpacity
            style={[styles.pill, selectedCategory === null && styles.pillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.pillText, selectedCategory === null && styles.pillTextActive]}>
              All Topics
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, selectedCategory === cat.slug && styles.pillActive]}
              onPress={() => setSelectedCategory(cat.slug)}
            >
              <Text style={[styles.pillText, selectedCategory === cat.slug && styles.pillTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillsRow, { paddingBottom: 4 }]}
        >
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.levelBtn, selectedLevel === l && styles.levelBtnActive]}
              onPress={() => setSelectedLevel(l)}
            >
              <Text style={[styles.levelBtnText, selectedLevel === l && styles.levelBtnTextActive]}>
                {l === 'All' ? 'All Levels' : levelLabel(l)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading courses…</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E3A8A" />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            activeEnrollments.length > 0 ? (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Continue Learning</Text>
                  <Text style={styles.sectionCount}>{activeEnrollments.length} course{activeEnrollments.length !== 1 ? 's' : ''}</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.enrolledScroll}
                >
                  {activeEnrollments.map((e) => (
                    <EnrolledCard
                      key={e.id}
                      e={e}
                      onPress={() => router.push(`/course/${e.course.slug}`)}
                    />
                  ))}
                </ScrollView>
                <View style={styles.browseDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerLabel}>All Courses</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No courses found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color="#1E3A8A" />
            ) : null
          }
          renderItem={({ item }) => (
            <CourseCard course={item} onPress={() => router.push(`/course/${item.slug}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1E3A8A' },

  // Header
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#93C5FD', fontSize: 12, marginTop: 2 },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  searchBoxIcon: { fontSize: 15, marginRight: 8 },
  searchBoxInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 0 },
  searchClear: { fontSize: 13, color: '#9CA3AF', paddingLeft: 8 },

  // Pills (category)
  pillsRow: { gap: 8, paddingBottom: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  pillActive: { backgroundColor: '#fff' },
  pillText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: '#1E3A8A', fontWeight: '700' },

  // Level buttons
  levelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  levelBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  levelBtnText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  levelBtnTextActive: { color: '#fff' },

  // Content area
  list: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 32, gap: 14, backgroundColor: '#F1F5F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, backgroundColor: '#F1F5F9' },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySubtitle: { color: '#9CA3AF', fontSize: 13 },

  // Continue learning
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  sectionCount: { fontSize: 12, color: '#6B7280' },
  enrolledScroll: { gap: 12, paddingBottom: 2 },

  enrolledCard: {
    width: 190,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  enrolledBanner: { height: 70, justifyContent: 'center', alignItems: 'center' },
  enrolledEmoji: { fontSize: 30 },
  enrolledBody: { padding: 10 },
  enrolledTitle: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 2 },
  enrolledAuthor: { fontSize: 11, color: '#6B7280', marginBottom: 8 },
  enrolledBarBg: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 4 },
  enrolledBarFill: { height: 4, borderRadius: 2 },
  enrolledPct: { fontSize: 10, color: '#6B7280', fontWeight: '600' },

  // Divider
  browseDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 2,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },

  // Course card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardBanner: {
    height: 96,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  cardEmoji: { fontSize: 36 },
  cardBadges: { flexDirection: 'column', gap: 4, alignItems: 'flex-end' },
  premiumBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  premiumBadgeText: { color: '#FEF9C3', fontSize: 10, fontWeight: '700' },
  freeBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  freeBadgeText: { color: '#D1FAE5', fontSize: 10, fontWeight: '700' },
  enrolledBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  enrolledBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  cardBody: { padding: 14 },
  metaRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  categoryPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: { color: '#1D4ED8', fontSize: 11, fontWeight: '600' },
  levelPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  levelPillText: { fontSize: 11, fontWeight: '600', color: '#374151' },

  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4, lineHeight: 21 },
  cardDesc: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 10 },

  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  authorAvatarText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  authorName: { fontSize: 12, color: '#6B7280' },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rating: { color: '#F59E0B', fontWeight: '700', fontSize: 12 },
  statText: { color: '#9CA3AF', fontSize: 11 },
  priceTag: { marginLeft: 'auto' as any },
  priceText: { color: '#1D4ED8', fontWeight: '800', fontSize: 14 },
  freeText: { color: '#16A34A', fontWeight: '800', fontSize: 14 },
});
