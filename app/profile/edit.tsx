import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { api } from '../../src/services/api';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.profile?.displayName ?? '');
  const [bio, setBio] = useState(user?.profile?.bio ?? '');
  const [country, setCountry] = useState(user?.profile?.country ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Display name is required.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me/profile', {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        country: country.trim() || undefined,
      });
      await refreshUser();
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
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
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          {/* Avatar placeholder */}
          <View style={s.avatarSection}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {(displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Fields */}
          <View style={s.card}>
            <Text style={s.label}>Display Name *</Text>
            <TextInput
              style={s.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              returnKeyType="next"
            />

            <View style={s.divider} />

            <Text style={s.label}>Bio</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={s.divider} />

            <Text style={s.label}>Country</Text>
            <TextInput
              style={s.input}
              value={country}
              onChangeText={setCountry}
              placeholder="e.g. Albania"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>

          {/* Read-only info */}
          <View style={s.card}>
            <Text style={s.label}>Email</Text>
            <Text style={s.readOnly}>{user?.email}</Text>
            <View style={s.divider} />
            <Text style={s.label}>Role</Text>
            <Text style={s.readOnly}>{user?.role === 'instructor' ? 'Instructor' : 'Student'}</Text>
          </View>

          {/* Save button (also at bottom for easy reach) */}
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
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cancel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  title: { color: '#fff', fontSize: 16, fontWeight: '800' },
  saveBtn: { color: '#93C5FD', fontSize: 14, fontWeight: '700' },

  body: { padding: 16, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    color: '#111827',
    paddingVertical: 10,
  },
  textarea: { minHeight: 70, paddingTop: 10 },
  readOnly: {
    fontSize: 15,
    color: '#6B7280',
    paddingVertical: 10,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  primaryBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
