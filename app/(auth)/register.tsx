import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';

function validate(firstName: string, lastName: string, email: string, password: string, agreed: boolean) {
  if (!firstName.trim()) return 'Emri është i detyrueshëm.';
  if (!lastName.trim()) return 'Mbiemri është i detyrueshëm.';
  if (!email.trim()) return 'Email-i është i detyrueshëm.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Shkruaj një adresë email të vlefshme.';
  if (!password) return 'Fjalëkalimi është i detyrueshëm.';
  if (password.length < 8) return 'Fjalëkalimi duhet të ketë të paktën 8 karaktere.';
  if (!agreed) return 'Duhet të pranosh Kushtet dhe Privatësinë.';
  return null;
}

export default function RegisterScreen() {
  const { register } = useAuth();

  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [promo, setPromo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    setError('');
    const validationError = validate(firstName, lastName, email, password, agreed);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await register({
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'Regjistrimi dështoi. Provo përsëri.';
      setError(Array.isArray(msg) ? msg.join(' ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Regjistrohu</Text>
          <Text style={styles.subtitle}>7 ditë provë falas — pa kartë krediti</Text>
        </View>

        <View style={styles.body}>
          {/* Role selector */}
          <Text style={styles.label}>Unë jam...</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'student' && styles.roleCardActive]}
              onPress={() => setRole('student')}
            >
              <Text style={styles.roleIcon}>🎓</Text>
              <Text style={[styles.roleName, role === 'student' && styles.roleNameActive]}>Student</Text>
              <Text style={styles.roleDesc}>Dua të mësoj</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === 'instructor' && styles.roleCardActive]}
              onPress={() => setRole('instructor')}
            >
              <Text style={styles.roleIcon}>👨‍🏫</Text>
              <Text style={[styles.roleName, role === 'instructor' && styles.roleNameActive]}>Profesor</Text>
              <Text style={styles.roleDesc}>Dua të mësoj</Text>
            </TouchableOpacity>
          </View>

          {/* Trial banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerText}>✓  Prova falas 7 ditore fillon sot</Text>
          </View>

          {/* Name fields */}
          <View style={styles.nameRow}>
            <TextInput
              label="Emri"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              mode="outlined"
              style={styles.nameInput}
            />
            <TextInput
              label="Mbiemri"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              mode="outlined"
              style={styles.nameInput}
            />
          </View>

          {/* Email */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            mode="outlined"
            style={styles.mt10}
          />

          {/* Password */}
          <TextInput
            label="Fjalëkalimi"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            mode="outlined"
            style={styles.mt10}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />

          {/* Terms */}
          <View style={styles.termsBox}>
            <Text style={styles.termsText}>
              Duke krijuar llogarinë, pranoni Kushtet e Shërbimit dhe Politikën e Privatësisë. Sesionet e paguara rimbursohen nëse profesori mungon. Abonimi rinovohet automatikisht.
            </Text>
            <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed(v => !v)}>
              <Checkbox status={agreed ? 'checked' : 'unchecked'} onPress={() => setAgreed(v => !v)} color="#1a56db" />
              <Text style={styles.checkLabel}>
                Pranoj <Text style={styles.link}>Kushtet</Text> dhe <Text style={styles.link}>Privatësinë</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkRow} onPress={() => setPromo(v => !v)}>
              <Checkbox status={promo ? 'checked' : 'unchecked'} onPress={() => setPromo(v => !v)} color="#1a56db" />
              <Text style={styles.checkLabel}>Pranoj email-e promovuese (opsionale)</Text>
            </TouchableOpacity>
          </View>

          {!!error && <HelperText type="error" visible>{error}</HelperText>}

          {/* Submit */}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.btn}
            contentStyle={styles.btnContent}
            buttonColor="#1a56db"
          >
            Krijo Llogarinë
          </Button>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Ke llogari? </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.link}>Hyr</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flexGrow: 1 },
  header: {
    backgroundColor: '#1a56db',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 28,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleCardActive: { borderColor: '#1a56db', backgroundColor: '#f0f5ff' },
  roleIcon: { fontSize: 28, marginBottom: 6 },
  roleName: { fontSize: 15, fontWeight: '700', color: '#333' },
  roleNameActive: { color: '#1a56db' },
  roleDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  banner: {
    backgroundColor: '#f0faf4',
    borderWidth: 1,
    borderColor: '#b7ebc8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bannerText: { color: '#1a7f3c', fontWeight: '600', fontSize: 13 },
  nameRow: { flexDirection: 'row', gap: 10 },
  nameInput: { flex: 1 },
  mt10: { marginTop: 10 },
  termsBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  termsText: { fontSize: 12, color: '#555', lineHeight: 18, marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  checkLabel: { fontSize: 13, color: '#333', flex: 1 },
  link: { color: '#1a56db', fontWeight: '600' },
  btn: { marginTop: 20, borderRadius: 8 },
  btnContent: { paddingVertical: 6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
});
