import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import type { SessionBooking } from '../../src/services/sessionService';
import { sessionService } from '../../src/services/sessionService';

type Tab = 'upcoming' | 'past';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmed', color: '#059669', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
};

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function durationMins(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function isUpcoming(iso: string) {
  return new Date(iso) > new Date();
}

export default function SessionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('upcoming');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  async function load(silent = false) {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const data = await sessionService.getStudentBookings(user.id);
      setBookings(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [user]);

  const upcoming = bookings.filter((b) => isUpcoming(b.scheduledAt) && b.status !== 'cancelled');
  const past = bookings.filter((b) => !isUpcoming(b.scheduledAt) || b.status === 'cancelled');
  const displayed = tab === 'upcoming' ? upcoming : past;

  function joinCall(b: SessionBooking) {
    const url = b.liveSession?.joinUrl;
    if (!url) {
      Alert.alert('Not Started', 'The instructor has not started the call yet. You\'ll get a notification when it begins.');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the call link.'));
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Sessions</Text>
        <TouchableOpacity
          style={s.findBtn}
          onPress={() => router.push('/sessions/find-instructors' as never)}
        >
          <Text style={s.findBtnText}>+ Book</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tab, tab === 'upcoming' && s.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[s.tabText, tab === 'upcoming' && s.tabTextActive]}>
            Upcoming ({upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'past' && s.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[s.tabText, tab === 'past' && s.tabTextActive]}>
            Past ({past.length})
          </Text>
        </TouchableOpacity>
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
            <Text style={s.emptyText}>Loading sessions…</Text>
          </View>
        ) : displayed.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>{tab === 'upcoming' ? '📅' : '📖'}</Text>
            <Text style={s.emptyTitle}>
              {tab === 'upcoming' ? 'No Upcoming Sessions' : 'No Past Sessions'}
            </Text>
            <Text style={s.emptyDesc}>
              {tab === 'upcoming'
                ? 'Find an instructor and book your first study session!'
                : 'Your completed and cancelled sessions will appear here.'}
            </Text>
            {tab === 'upcoming' && (
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => router.push('/sessions/find-instructors' as never)}
              >
                <Text style={s.emptyBtnText}>Browse Instructors</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {displayed.map((b) => {
              const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
              const live = b.liveSession?.status === 'live';
              const confirmed = b.status === 'confirmed';
              const initials = (b.instructor?.displayName ?? 'IN')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <View key={b.id} style={s.card}>
                  {/* Card header */}
                  <View style={s.cardTop}>
                    <View style={s.instrAvatar}>
                      <Text style={s.instrAvatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.instrName}>{b.instructor?.displayName ?? 'Instructor'}</Text>
                      <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
                        <Text style={[s.statusText, { color: sc.color }]}>{sc.label}</Text>
                      </View>
                    </View>
                    {live && confirmed && (
                      <View style={s.livePill}>
                        <Text style={s.liveText}>● LIVE</Text>
                      </View>
                    )}
                  </View>

                  {/* Topic */}
                  <Text style={s.topicText}>"{b.topic}"</Text>

                  {/* Date/time row */}
                  <View style={s.metaRow}>
                    <View style={s.metaItem}>
                      <Text style={s.metaIcon}>📅</Text>
                      <Text style={s.metaText}>{formatSessionDate(b.scheduledAt)}</Text>
                    </View>
                    <View style={s.metaItem}>
                      <Text style={s.metaIcon}>🕐</Text>
                      <Text style={s.metaText}>
                        {formatSessionTime(b.scheduledAt)} · {durationMins(b.scheduledAt, b.endsAt)} min
                      </Text>
                    </View>
                  </View>

                  {/* Calendar bar */}
                  <View style={s.calBar}>
                    <View style={s.calDay}>
                      <Text style={s.calDayNum}>
                        {new Date(b.scheduledAt).getDate()}
                      </Text>
                      <Text style={s.calMonth}>
                        {new Date(b.scheduledAt).toLocaleString('en-US', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={s.calInfo}>
                      <Text style={s.calWeekday}>
                        {new Date(b.scheduledAt).toLocaleString('en-US', { weekday: 'long' })}
                      </Text>
                      <Text style={s.calTime}>
                        {formatSessionTime(b.scheduledAt)} – {formatSessionTime(b.endsAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  {confirmed && (
                    <TouchableOpacity
                      style={[s.joinBtn, !live && s.joinBtnWaiting]}
                      onPress={() => joinCall(b)}
                      activeOpacity={0.85}
                    >
                      <Text style={[s.joinBtnText, !live && s.joinBtnTextWaiting]}>
                        {live ? '📹 Join Call Now' : '⏳ Waiting for Instructor to Start'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

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
  findBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  findBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#1E3A8A' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#1E3A8A' },

  scroll: { padding: 16, paddingBottom: 40 },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  emptyBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  instrAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instrAvatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  instrName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  livePill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveText: { fontSize: 11, fontWeight: '800', color: '#DC2626' },

  topicText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
    fontStyle: 'italic',
    marginBottom: 12,
  },

  metaRow: { gap: 6, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: 12, color: '#6B7280' },

  calBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    gap: 14,
    marginBottom: 12,
  },
  calDay: { alignItems: 'center', minWidth: 36 },
  calDayNum: { fontSize: 24, fontWeight: '900', color: '#1E3A8A' },
  calMonth: { fontSize: 11, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase' },
  calInfo: { flex: 1 },
  calWeekday: { fontSize: 13, fontWeight: '700', color: '#1E3A8A' },
  calTime: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  joinBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  joinBtnWaiting: { backgroundColor: '#F3F4F6' },
  joinBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  joinBtnTextWaiting: { color: '#6B7280' },
});
