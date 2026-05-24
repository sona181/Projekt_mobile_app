import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function InstructorProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [prof, setProf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all courses, and session data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete('/users/me');
              await logout();
              router.replace('/(auth)/login');
            } catch {
              Alert.alert('Error', 'Could not delete account. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${BASE}/instructor/${user.id}/dashboard`)
      .then((r) => r.json())
      .then((d) => setProf(d?.instructor ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const initials = (prof?.initials ?? user?.profile?.displayName?.slice(0, 2) ?? 'IN').toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/instructor/edit-profile' as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.nameText}>{prof?.displayName ?? user?.email}</Text>
          <Text style={s.roleText}>Instructor · UniLearn</Text>

          {prof?.isAvailable !== undefined && (
            <View style={[s.availPill, !prof.isAvailable && s.unavailPill]}>
              <Text style={s.availText}>
                {prof.isAvailable ? '🟢 Available for sessions' : '🔴 Not available'}
              </Text>
            </View>
          )}
        </View>

        {/* Info cards */}
        {prof?.bio ? (
          <View style={s.card}>
            <Text style={s.cardLabel}>About</Text>
            <Text style={s.cardValue}>{prof.bio}</Text>
          </View>
        ) : null}

        <View style={s.card}>
          {prof?.specialties ? (
            <>
              <Text style={s.cardLabel}>Specialties</Text>
              <Text style={s.cardValue}>{prof.specialties}</Text>
              <View style={s.divider} />
            </>
          ) : null}
          {prof?.languages ? (
            <>
              <Text style={s.cardLabel}>Languages</Text>
              <Text style={s.cardValue}>{prof.languages}</Text>
              <View style={s.divider} />
            </>
          ) : null}
          {prof?.hourlyRate ? (
            <>
              <Text style={s.cardLabel}>Hourly Rate</Text>
              <Text style={s.cardValue}>€{Number(prof.hourlyRate).toFixed(0)} / hour</Text>
              <View style={s.divider} />
            </>
          ) : null}
          <Text style={s.cardLabel}>Email</Text>
          <Text style={s.cardValue}>{user?.email}</Text>
        </View>

        {/* Edit button */}
        <View style={s.ctaSection}>
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={() => router.push('/instructor/edit-profile' as never)}
            activeOpacity={0.85}
          >
            <Text style={s.editProfileBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.logoutBtn}
            onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
          >
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.deleteBtn}
            onPress={confirmDeleteAccount}
            disabled={deleting}
            activeOpacity={0.7}
          >
            {deleting
              ? <ActivityIndicator size="small" color="#9CA3AF" />
              : <Text style={s.deleteText}>Delete Account</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4c0884',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { color: 'rgba(255,255,255,0.85)', fontSize: 26, fontWeight: '400', width: 30 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  editBtn: { color: '#C4B5FD', fontSize: 14, fontWeight: '700', width: 30, textAlign: 'right' },

  hero: {
    backgroundColor: '#4c0884',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#7C3AED',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  nameText: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  roleText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 14 },
  availPill: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  unavailPill: { backgroundColor: 'rgba(239,68,68,0.25)' },
  availText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 14, marginBottom: 4,
  },
  cardValue: { fontSize: 14, color: '#111827', paddingBottom: 14, lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  ctaSection: { padding: 20, gap: 12 },
  editProfileBtn: {
    backgroundColor: '#4c0884',
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
  },
  editProfileBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutBtn: {
    borderWidth: 1.5, borderColor: '#FECACA',
    borderRadius: 14, paddingVertical: 13,
    alignItems: 'center',
  },
  logoutText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: 10 },
  deleteText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
});
