import { Ionicons } from '../components/Ionicons';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { loginCitizen, loginWithGoogle, registerCitizen } from '../lib/auth';
import { AuthLoadingScreen } from './AuthLoadingScreen';

const MIN_AUTH_LOADING_MS = 3000;

void Ionicons.loadFont().catch(() => undefined);

function waitForMinimumLoading(startedAt: number): Promise<void> {
  const remaining = Math.max(0, MIN_AUTH_LOADING_MS - (Date.now() - startedAt));
  return new Promise((resolve) => setTimeout(resolve, remaining));
}

export function AuthScreen() {
  const desktop = useWindowDimensions().width >= 900;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void Ionicons.loadFont().catch(() => undefined);
  }, []);

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }
    setBusy(true);
    const startedAt = Date.now();
    const result = mode === 'login' ? await loginCitizen(email, password) : await registerCitizen(email, password);
    await waitForMinimumLoading(startedAt);
    setBusy(false);
    if (!result.ok) setError(result.message);
  }

  async function submitGoogle() {
    setError('');
    setBusy(true);
    const startedAt = Date.now();
    const result = await loginWithGoogle();
    await waitForMinimumLoading(startedAt);
    setBusy(false);
    if (!result.ok) setError(result.message);
  }

  if (busy) return <AuthLoadingScreen mode={mode === 'register' ? 'creating' : 'signing'} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView style={styles.authScroll} contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
      <View style={styles.hero}>
        <View style={styles.crestFrame}><Image source={require('../../coat-of-arms-transparent.png')} style={styles.crest} resizeMode="contain" /></View>
        <Text style={styles.brand}>LandWatch ZW</Text>
        <Text style={styles.ministry}>Ministry of Local Government and Public Works</Text>
        <Text style={styles.heroCaption}>A citizen channel for responsible land monitoring in Zimbabwe.</Text>
      </View>
      <View style={[styles.card, desktop && styles.cardDesktop]}>
        <View style={styles.switcher}><Pressable onPress={() => { setMode('login'); setError(''); }} style={[styles.switch, mode === 'login' && styles.switchActive]}><Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>Sign in</Text></Pressable><Pressable onPress={() => { setMode('register'); setError(''); }} style={[styles.switch, mode === 'register' && styles.switchActive]}><Text style={[styles.switchText, mode === 'register' && styles.switchTextActive]}>Create account</Text></Pressable></View>
        <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>{mode === 'login' ? 'Sign in to submit and track your reports.' : 'Create a citizen account to submit a report.'}</Text>
        <Text style={styles.label}>Email address</Text>
        <View style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}><Text style={[styles.fallbackIcon, focusedField === 'email' && styles.fallbackIconActive]}>@</Text><TextInput value={email} onChangeText={setEmail} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="you@example.com" placeholderTextColor="#7C878E" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={[styles.input, styles.webInput]} /></View>
        <Text style={styles.label}>Password</Text>
        <View style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}><Text style={[styles.fallbackIcon, focusedField === 'password' && styles.fallbackIconActive]}>●</Text><TextInput value={password} onChangeText={setPassword} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="Enter your password" placeholderTextColor="#7C878E" secureTextEntry={!showPassword} style={[styles.input, styles.webInput]} /><Pressable onPress={() => setShowPassword(!showPassword)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} hitSlop={10}><Text style={styles.showPassword}>{showPassword ? 'Hide' : 'Show'}</Text></Pressable></View>
        {!!error && <View style={styles.errorBox}><Text style={styles.errorMark}>!</Text><Text style={styles.error}>{error}</Text></View>}
        <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.button, (pressed || busy) && styles.pressed]}><Text style={styles.buttonText}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create account'}</Text><Text style={styles.buttonArrow}>→</Text></Pressable>
        <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
        <Pressable disabled={busy} onPress={submitGoogle} style={({ pressed }) => [styles.googleButton, (pressed || busy) && styles.pressed]}><Text style={styles.googleMark}>G</Text><Text style={styles.googleText}>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</Text></Pressable>
        <Text style={styles.disclaimer}>Academic prototype · Subject to Ministry approval</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#06291A' },
  authScroll: { flex: 1 },
  authContent: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 30, paddingBottom: 25 },
  crestFrame: { width: 76, height: 76, backgroundColor: '#FFFFFF', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#A9812F' },
  crest: { width: 68, height: 68 },
  brand: { color: '#FFFFFF', fontSize: 27, fontWeight: '700', letterSpacing: -0.5 },
  ministry: { color: '#B7D5C5', fontSize: 10, textAlign: 'center', marginTop: 5 },
  heroCaption: { color: '#D6EBE0', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 17, maxWidth: 290 },
  card: { backgroundColor: '#F4F6F7', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, minHeight: 470 },
  cardDesktop: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 34, paddingVertical: 28 },
  switcher: { flexDirection: 'row', backgroundColor: '#E8ECEE', borderRadius: 9, padding: 3, marginBottom: 28 },
  switch: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 7 },
  switchActive: { backgroundColor: '#FFFFFF', shadowColor: '#14181A', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  switchText: { color: '#5A656C', fontSize: 12, fontWeight: '600' },
  switchTextActive: { color: '#0E5232' },
  title: { color: '#14181A', fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { color: '#47525A', fontSize: 13, marginTop: 6, marginBottom: 24 },
  label: { color: '#14181A', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  inputWrap: { minHeight: 51, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#AEB6BB', borderRadius: 8, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 17 },
  inputFocused: { borderColor: '#14663E', borderWidth: 2, shadowColor: '#14663E', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 0 }, elevation: 1 },
  input: { flex: 1, color: '#14181A', fontSize: 14, paddingHorizontal: 10, paddingVertical: 0 },
  fallbackIcon: { width: 18, color: '#7C878E', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  fallbackIconActive: { color: '#14663E' },
  showPassword: { color: '#47525A', fontSize: 11, fontWeight: '700' },
  webInput: { outlineWidth: 0, outlineStyle: 'none' } as any,
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDECEA', borderLeftWidth: 3, borderLeftColor: '#B3261E', borderRadius: 7, padding: 11, marginBottom: 15 },
  errorMark: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#B3261E', color: '#FFFFFF', fontSize: 12, fontWeight: '800', lineHeight: 18, textAlign: 'center' },
  error: { color: '#8F1D17', fontSize: 12, lineHeight: 17, flex: 1, marginLeft: 8 },
  button: { minHeight: 52, borderRadius: 8, backgroundColor: '#0E5232', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 3 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  buttonArrow: { color: '#FFFFFF', fontSize: 18, marginLeft: 2 },
  googleButton: { minHeight: 50, borderRadius: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#747775', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 1 },
  googleText: { color: '#14181A', fontSize: 14, fontWeight: '700' },
  googleMark: { color: '#4285F4', fontSize: 18, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  dividerLine: { height: 1, backgroundColor: '#D5DADD', flex: 1 },
  dividerText: { color: '#7C878E', fontSize: 10, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  disclaimer: { color: '#7C878E', fontSize: 10, textAlign: 'center', marginTop: 22 },
});
