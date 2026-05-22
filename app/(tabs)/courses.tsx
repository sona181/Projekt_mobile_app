import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Chip,
  Searchbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { courseService } from '../../src/services/courseService';
import type { CourseSummary } from '../../src/types/course';

const LEVELS = ['All', 'beginner', 'intermediate', 'advanced'];

export default function CoursesScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCourses = useCallback(
    async (p: number, q: string, level: string, replace: boolean) => {
      try {
        const res = await courseService.list({
          page: p,
          limit: 15,
          search: q || undefined,
          level: level !== 'All' ? level : undefined,
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
    setLoading(true);
    fetchCourses(1, search, selectedLevel, true);
  }, [selectedLevel, fetchCourses]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSearchChange(text: string) {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setLoading(true);
      fetchCourses(1, text, selectedLevel, true);
    }, 400);
  }

  function onRefresh() {
    setRefreshing(true);
    fetchCourses(1, search, selectedLevel, true);
  }

  function onLoadMore() {
    if (loadingMore || courses.length >= total) return;
    setLoadingMore(true);
    fetchCourses(page + 1, search, selectedLevel, false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Courses
        </Text>
        <Searchbar
          placeholder="Search courses…"
          value={search}
          onChangeText={onSearchChange}
          style={styles.searchbar}
          inputStyle={{ fontSize: 14 }}
        />
        <FlatList
          horizontal
          data={LEVELS}
          keyExtractor={(l) => l}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <Chip
              selected={selectedLevel === item}
              onPress={() => setSelectedLevel(item)}
              style={styles.chip}
              compact
            >
              {item === 'All' ? 'All Levels' : item.charAt(0).toUpperCase() + item.slice(1)}
            </Chip>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text variant="bodyLarge" style={{ color: '#999' }}>
                No courses found.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={theme.colors.primary} />
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

function CourseCard({
  course,
  onPress,
}: {
  course: CourseSummary;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Surface style={styles.card} elevation={1}>
        {course.thumbnailUrl ? (
          <Image source={{ uri: course.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardTags}>
            <Chip compact style={styles.levelChip}>
              {course.level}
            </Chip>
            {course.isPremium && (
              <Chip compact icon="crown" style={styles.premiumChip}>
                Premium
              </Chip>
            )}
            {course.isEnrolled && (
              <Chip compact icon="check" style={[styles.enrolledChip, { borderColor: theme.colors.primary }]}>
                Enrolled
              </Chip>
            )}
          </View>
          <Text variant="titleMedium" numberOfLines={2} style={styles.cardTitle}>
            {course.title}
          </Text>
          <Text variant="bodySmall" style={styles.cardMeta}>
            {course.author.displayName}
          </Text>
          <View style={styles.cardStats}>
            {course.stats.avgRating !== null && (
              <Text variant="bodySmall" style={{ color: '#F59E0B' }}>
                ★ {course.stats.avgRating.toFixed(1)}
              </Text>
            )}
            <Text variant="bodySmall" style={{ color: '#999', marginLeft: 8 }}>
              {course.stats.enrollments.toLocaleString()} students
            </Text>
            {course.price !== null ? (
              <Text
                variant="labelLarge"
                style={{ marginLeft: 'auto', color: theme.colors.primary }}
              >
                €{course.price.toFixed(2)}
              </Text>
            ) : (
              <Text variant="labelLarge" style={{ marginLeft: 'auto', color: '#16A34A' }}>
                Free
              </Text>
            )}
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontWeight: '700', marginBottom: 12 },
  searchbar: { marginBottom: 10, borderRadius: 10 },
  filters: { gap: 8, paddingBottom: 4 },
  chip: { marginRight: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { borderRadius: 12, overflow: 'hidden' },
  thumbnail: { width: '100%', height: 160 },
  thumbnailPlaceholder: { backgroundColor: '#E5E7EB' },
  cardBody: { padding: 12 },
  cardTags: { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  levelChip: { backgroundColor: '#EEF2FF' },
  premiumChip: { backgroundColor: '#FEF9C3' },
  enrolledChip: { backgroundColor: '#F0FDF4', borderWidth: 1 },
  cardTitle: { fontWeight: '600', marginBottom: 2 },
  cardMeta: { color: '#6B7280', marginBottom: 8 },
  cardStats: { flexDirection: 'row', alignItems: 'center' },
});
