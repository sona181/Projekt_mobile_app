import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim()) { setError('Email-i është i detyrueshëm.'); return; }
    if (!password) { setError('Fjalëkalimi është i detyrueshëm.'); return; }

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'Email ose fjalëkalim i gabuar.';
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
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>🎓</Text>
            </View>
            <Text style={styles.logoName}>UniLearn</Text>
          </View>
          <Text style={styles.title}>Mirë se erdhe!</Text>
          <Text style={styles.subtitle}>Kurset dhe progresi yt janë duke të pritur.</Text>
        </View>

        <View style={styles.body}>
          {/* Trial banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerText}>✓  5 ditë provë falas mbeten</Text>
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
            style={styles.input}
          />

          {/* Password */}
          <TextInput
            label="Fjalëkalimi"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />

          {/* Forgot password */}
          <View style={styles.forgotRow}>
            <Text style={styles.forgotLink}>Harrove fjalëkalimin?</Text>
          </View>

          {!!error && <HelperText type="error" visible>{error}</HelperText>}

          {/* Submit */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.btn}
            contentStyle={styles.btnContent}
            buttonColor="#1a56db"
          >
            Hyr
          </Button>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Nuk ke llogari? </Text>
            <Link href="/(auth)/register" asChild>
              <Text style={styles.link}>Regjistrohu falas</Text>
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
    paddingBottom: 32,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 18 },
  logoName: { fontSize: 18, fontWeight: '800', color: 'white' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  banner: {
    backgroundColor: '#f0faf4',
    borderWidth: 1,
    borderColor: '#b7ebc8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  bannerText: { color: '#1a7f3c', fontWeight: '600', fontSize: 13 },
  input: { marginBottom: 12 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 4 },
  forgotLink: { fontSize: 13, color: '#1a56db', fontWeight: '600' },
  btn: { marginTop: 8, borderRadius: 8 },
  btnContent: { paddingVertical: 6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  link: { color: '#1a56db', fontWeight: '600' },
});
