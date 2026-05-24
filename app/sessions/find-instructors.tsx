import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { InstructorSummary } from '../../src/services/sessionService';
import { sessionService } from '../../src/services/sessionService';

export default function FindInstructorsScreen() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<InstructorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await sessionService.listInstructors();
      setInstructors(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Find an Instructor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
      >
        {loading ? (
          <View style={s.center}>
            <Text style={s.loadingText}>Loading instructors…</Text>
          </View>
        ) : instructors.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyIcon}>👨‍🏫</Text>
            <Text style={s.emptyText}>No instructors available yet.</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={s.sectionLabel}>{instructors.length} Instructors Available</Text>
            {instructors.map((inst) => {
              const initials = inst.displayName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <TouchableOpacity
                  key={inst.id}
                  style={s.card}
                  onPress={() => router.push(`/instructor/${inst.id}` as never)}
                  activeOpacity={0.85}
                >
                  <View style={s.cardInner}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.nameRow}>
                        <Text style={s.nameText}>{inst.displayName}</Text>
                        {inst.isAvailable ? (
                          <View style={s.availDot} />
                        ) : null}
                      </View>
                      {inst.specialties ? (
                        <Text style={s.specialtyText} numberOfLines={1}>{inst.specialties}</Text>
                      ) : null}
                      {inst.bio ? (
                        <Text style={s.bioText} numberOfLines={2}>{inst.bio}</Text>
                      ) : null}

                      <View style={s.statsRow}>
                        {inst.rating ? (
                          <Text style={s.stat}>⭐ {Number(inst.rating).toFixed(1)}</Text>
                        ) : null}
                        {inst.courseCount !== undefined && inst.courseCount > 0 ? (
                          <Text style={s.stat}>📚 {inst.courseCount} courses</Text>
                        ) : null}
                        {inst.hourlyRate ? (
                          <Text style={s.stat}>💰 ${Number(inst.hourlyRate).toFixed(0)}/hr</Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={s.chevron}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 40 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: '600' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },

  scroll: { padding: 16, paddingBottom: 40 },
  center: { alignItems: 'center', paddingTop: 80, gap: 12 },
  loadingText: { color: '#9CA3AF', fontSize: 14 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  nameText: { fontSize: 15, fontWeight: '800', color: '#111827' },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  specialtyText: { fontSize: 12, color: '#6366F1', fontWeight: '600', marginBottom: 4 },
  bioText: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  stat: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  chevron: { fontSize: 22, color: '#D1D5DB', alignSelf: 'center' },
});
