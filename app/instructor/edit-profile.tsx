import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

export default function InstructorEditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [languages, setLanguages] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/instructor/${user.id}/dashboard`)
      .then(({ data: d }) => {
        const inst = d?.instructor;
        if (inst) {
          setDisplayName(inst.displayName ?? user?.profile?.displayName ?? '');
          setBio(inst.bio ?? user?.profile?.bio ?? '');
          setSpecialties(inst.specialties ?? '');
          setLanguages(inst.languages ?? '');
          setHourlyRate(inst.hourlyRate ? String(inst.hourlyRate) : '');
          setIsAvailable(inst.isAvailable ?? true);
        } else {
          setDisplayName(user?.profile?.displayName ?? '');
          setBio(user?.profile?.bio ?? '');
        }
      })
      .catch(() => {
        setDisplayName(user?.profile?.displayName ?? '');
        setBio(user?.profile?.bio ?? '');
      })
      .finally(() => setLoadingProfile(false));
  }, [user?.id]);

  async function save() {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me/instructor-profile', {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        specialties: specialties.trim() || undefined,
        languages: languages.trim() || undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        isAvailable,
      });
      await refreshUser();
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const initials = (displayName || user?.email || 'IN').slice(0, 2).toUpperCase();

  if (loadingProfile) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.title}>Edit Profile</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#4c0884" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={s.title}>Edit Profile</Text>
        <TouchableOpacity onPress={save} disabled={saving} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {saving
            ? <ActivityIndicator size="small" color="#C4B5FD" />
            : <Text style={s.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={s.avatarSection}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <Text style={s.avatarHint}>Instructor Profile</Text>
          </View>

          {/* Basic info */}
          <View style={s.card}>
            <Text style={s.fieldLabel}>Display Name *</Text>
            <TextInput
              style={s.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
            <View style={s.divider} />
            <Text style={s.fieldLabel}>Bio</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell students about your background and teaching style..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Instructor-specific */}
          <View style={s.card}>
            <Text style={s.fieldLabel}>Specialties</Text>
            <TextInput
              style={s.input}
              value={specialties}
              onChangeText={setSpecialties}
              placeholder="e.g. Java, OOP, Algorithms"
              placeholderTextColor="#9CA3AF"
            />
            <View style={s.divider} />
            <Text style={s.fieldLabel}>Languages Spoken</Text>
            <TextInput
              style={s.input}
              value={languages}
              onChangeText={setLanguages}
              placeholder="e.g. English, Albanian"
              placeholderTextColor="#9CA3AF"
            />
            <View style={s.divider} />
            <Text style={s.fieldLabel}>Hourly Rate (€)</Text>
            <TextInput
              style={[s.input, { width: 120 }]}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="e.g. 25"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
            <View style={s.divider} />
            <View style={s.switchRow}>
              <View>
                <Text style={s.fieldLabel}>Available for Sessions</Text>
                <Text style={s.switchHint}>Students can request sessions from you</Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ true: '#7C3AED', false: '#D1D5DB' }}
                thumbColor="white"
              />
            </View>
          </View>

          {/* Read-only */}
          <View style={s.card}>
            <Text style={s.fieldLabel}>Email</Text>
            <Text style={s.readOnly}>{user?.email}</Text>
            <View style={s.divider} />
            <Text style={s.fieldLabel}>Role</Text>
            <Text style={s.readOnly}>Instructor</Text>
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryBtnText}>Save Changes</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4c0884',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cancel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  title: { color: '#fff', fontSize: 16, fontWeight: '800' },
  saveBtn: { color: '#C4B5FD', fontSize: 14, fontWeight: '700' },

  body: { padding: 16, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  avatarHint: { color: '#6B7280', fontSize: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 14, marginBottom: 6,
  },
  input: { fontSize: 15, color: '#111827', paddingVertical: 10 },
  textarea: { minHeight: 80, paddingTop: 10 },
  readOnly: { fontSize: 15, color: '#6B7280', paddingVertical: 10 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  switchHint: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  primaryBtn: {
    backgroundColor: '#4c0884',
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
