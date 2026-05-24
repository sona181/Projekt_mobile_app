import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import type { InstructorSummary } from '../../src/services/sessionService';
import { sessionService } from '../../src/services/sessionService';

const LANG_EMOJI: Record<string, string> = {
  java: '☕',
  python: '🐍',
  c: '🖥️',
  javascript: '🟨',
  typescript: '🔷',
  default: '📘',
};

const DURATIONS = [30, 45, 60, 90];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function InstructorProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [instructor, setInstructor] = useState<InstructorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  });
  const [timeStr, setTimeStr] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!userId) return;
    sessionService
      .getInstructor(userId)
      .then((data) => {
        setInstructor(data);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      })
      .catch(() => Alert.alert('Error', 'Could not load instructor profile'))
      .finally(() => setLoading(false));
  }, [userId]);

  async function submitRequest() {
    if (!topic.trim()) {
      Alert.alert('Required', 'Please enter a topic for your session.');
      return;
    }
    if (!user) {
      Alert.alert('Not logged in', 'Please log in to request a session.');
      return;
    }

    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
      Alert.alert('Invalid date', 'Please choose a future date and time.');
      return;
    }

    setSubmitting(true);
    try {
      await sessionService.requestSession({
        studentId: user.id,
        instructorUserId: userId!,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: duration,
        topic: topic.trim(),
        description: description.trim() || undefined,
      });
      setShowModal(false);
      Alert.alert(
        'Request Sent!',
        `Your session request has been sent to ${instructor?.displayName}. You'll get a notification once they respond.`,
        [{ text: 'View My Sessions', onPress: () => router.push('/sessions') }, { text: 'OK' }],
      );
    } catch {
      Alert.alert('Error', 'Could not send session request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const initials = (instructor?.displayName ?? 'IN')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!instructor) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.loadingText}>Instructor not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Instructor</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <Animated.View style={[s.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.nameText}>{instructor.displayName}</Text>
          {instructor.specialties ? (
            <Text style={s.specialtyText}>{instructor.specialties}</Text>
          ) : null}

          <View style={s.badgeRow}>
            {instructor.rating ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>⭐ {Number(instructor.rating).toFixed(1)}</Text>
              </View>
            ) : null}
            {instructor.courseCount !== undefined && instructor.courseCount > 0 ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>📚 {instructor.courseCount} Courses</Text>
              </View>
            ) : null}
            <View style={[s.badge, instructor.isAvailable ? s.availBadge : s.unavailBadge]}>
              <Text style={s.badgeText}>{instructor.isAvailable ? '🟢 Available' : '🔴 Busy'}</Text>
            </View>
          </View>

          {instructor.hourlyRate ? (
            <Text style={s.rateText}>${Number(instructor.hourlyRate).toFixed(0)}/hr</Text>
          ) : null}
        </Animated.View>

        {/* Bio */}
        {instructor.bio ? (
          <Animated.View style={[s.section, { opacity: fadeAnim }]}>
            <Text style={s.secLabel}>About</Text>
            <Text style={s.bioText}>{instructor.bio}</Text>
          </Animated.View>
        ) : null}

        {/* Languages / Specialties */}
        {instructor.languages ? (
          <View style={s.section}>
            <Text style={s.secLabel}>Languages</Text>
            <Text style={s.infoText}>{instructor.languages}</Text>
          </View>
        ) : null}

        {/* Courses */}
        {instructor.courses && instructor.courses.length > 0 ? (
          <View style={s.section}>
            <Text style={s.secLabel}>Courses</Text>
            {instructor.courses.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={s.courseRow}
                onPress={() => router.push(`/course/${c.slug}` as never)}
                activeOpacity={0.8}
              >
                <Text style={s.courseEmoji}>{LANG_EMOJI[c.language] ?? LANG_EMOJI.default}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.courseTitle}>{c.title}</Text>
                  <Text style={s.courseMeta}>{c.level} · {c.language}</Text>
                </View>
                <Text style={s.courseChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* CTA */}
        <View style={s.ctaSection}>
          <TouchableOpacity
            style={[s.requestBtn, !instructor.isAvailable && s.requestBtnDisabled]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <Text style={s.requestBtnText}>
              {instructor.isAvailable ? '📅 Request a Study Session' : 'Instructor Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Session Request Modal ── */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Request a Session</Text>
            <Text style={s.modalSubtitle}>with {instructor.displayName}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              {/* Topic */}
              <Text style={s.fieldLabel}>Topic *</Text>
              <TextInput
                style={s.input}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Java OOP Concepts"
                placeholderTextColor="#9CA3AF"
              />

              {/* Description */}
              <Text style={s.fieldLabel}>What do you need help with?</Text>
              <TextInput
                style={[s.input, s.textarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what you'd like to cover, your current level, specific problems..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Date */}
              <Text style={s.fieldLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={s.input}
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="2026-05-25"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
              />

              {/* Time */}
              <Text style={s.fieldLabel}>Time (HH:MM, 24h)</Text>
              <TextInput
                style={s.input}
                value={timeStr}
                onChangeText={setTimeStr}
                placeholder="14:00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
              />

              {/* Duration */}
              <Text style={s.fieldLabel}>Duration</Text>
              <View style={s.durationRow}>
                {DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[s.durBtn, duration === d && s.durBtnActive]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[s.durBtnText, duration === d && s.durBtnTextActive]}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.sendBtn, submitting && { opacity: 0.6 }]}
                onPress={submitRequest}
                disabled={submitting}
              >
                <Text style={s.sendBtnText}>{submitting ? 'Sending…' : 'Send Request'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#9CA3AF', fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 60 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },

  heroCard: {
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  nameText: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  specialtyText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  availBadge: { backgroundColor: 'rgba(16,185,129,0.25)' },
  unavailBadge: { backgroundColor: 'rgba(239,68,68,0.25)' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  rateText: { fontSize: 18, fontWeight: '700', color: '#93C5FD', marginTop: 4 },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  secLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bioText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  infoText: { fontSize: 14, color: '#374151' },

  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  courseEmoji: { fontSize: 22, marginRight: 12 },
  courseTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  courseMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  courseChevron: { fontSize: 20, color: '#9CA3AF', marginLeft: 8 },

  ctaSection: { padding: 20, paddingTop: 24 },
  requestBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  requestBtnDisabled: { backgroundColor: '#9CA3AF' },
  requestBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  textarea: { minHeight: 90, paddingTop: 11 },

  durationRow: { flexDirection: 'row', gap: 8 },
  durBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  durBtnActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  durBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  durBtnTextActive: { color: '#fff' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  sendBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
