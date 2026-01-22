import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { motion } from './motion';
import { Sprout, Mail, Lock } from 'lucide-react-native';
import { ACCENTS, SURFACE, hexToRgba } from './theme';
import { postJson } from './api';
import { setFarmerId } from './session';

const MotionView = motion.create(View);
const MotionPressable = motion.create(Pressable);

type LoginResponse = {
  success: boolean;
  farmer_id?: string;
  message?: string;
  detail?: string;
};

export function LoginScreen({
  onLogin,
}: {
  onLogin: () => void;
}) {
  // Treat this as the backend "user_id" (not email validation only)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = 'Enter your user id.';
    if (!password.trim()) e.password = 'Enter your password.';
    return e;
  }, [email, password]);

  const canSubmit = !errors.email && !errors.password && !submitting;

  const accent = useMemo(() => {
    // rotate a vibrant accent for the login experience (keeps UI same, just color)
    const choices = [ACCENTS.green, ACCENTS.teal, ACCENTS.cyan, ACCENTS.orange, ACCENTS.violet];
    return choices[Math.floor(Date.now() / 60000) % choices.length];
  }, []);

  async function handleLogin() {
    setTouched(true);
    if (!canSubmit) return;

    setSubmitting(true);

    const payload = {
      user_id: email.trim(),
      password: password,
    };

    // Correct endpoint + request/response shape per backend spec
    const result = await postJson<LoginResponse>('/farmer_managment/login', payload);
 
    setSubmitting(false);

    if (!result.ok) {
      Alert.alert('Login failed', result.error || 'Incorrect details');
      return;
    }

    const data = result.data;
    if (!data?.success) {
      Alert.alert('Login failed', String(data?.message ?? data?.detail ?? 'Incorrect details'));
      return;
    }

    const farmerId = String(data?.farmer_id ?? '').trim();
    if (!farmerId) {
      Alert.alert('Login failed', 'Login succeeded but server did not return farmer_id.');
      return;
    }

    setFarmerId(farmerId);
    onLogin();
  }

  return (
    <MotionView style={styles.root} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centerWrap}>
          {/* Logo */}
          <View style={styles.logoShadow}>
            <View style={[styles.logoCircle, { backgroundColor: accent.a }]}>
              <Sprout size={44} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>Farm Manager</Text>
          <Text style={styles.subtitle}>Manage your farm with ease</Text>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>User ID</Text>
            <View style={[styles.inputWrap, { borderColor: hexToRgba(accent.a, 0.25) }, touched && errors.email ? styles.inputError : null]}>
              <Mail size={18} color="#6b7280" />
              <TextInput
                accessibilityLabel="User id"
                placeholder="Enter your user id"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={styles.input}
                onBlur={() => setTouched(true)}
              />
            </View>
            {touched && errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
            <View style={[styles.inputWrap, { borderColor: hexToRgba(accent.a, 0.25) }, touched && errors.password ? styles.inputError : null]}>
              <Lock size={18} color="#6b7280" />
              <TextInput
                accessibilityLabel="Password"
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                onBlur={() => setTouched(true)}
              />
            </View>
            {touched && errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => Alert.alert('Forgot Password', 'Password reset flow is not implemented in this demo.')}
              style={{ marginTop: 10, alignSelf: 'flex-end' }}
            >
              <Text style={[styles.link, { fontWeight: '800', color: accent.a }]}>Forgot password?</Text>
            </Pressable>

            <MotionPressable
              accessibilityRole="button"
              onPress={handleLogin}
              disabled={!canSubmit}
              style={{ ...(styles.loginBtn as any), backgroundColor: accent.a, opacity: canSubmit ? 1 : 0.65 }}
              whileTap={{ scale: canSubmit ? 0.98 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <Text style={styles.loginBtnText}>{submitting ? 'Signing In…' : 'Sign In'}</Text>
            </MotionPressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => Alert.alert('Create Account', 'Sign up flow is not implemented in this demo.')}
              style={{ marginTop: 12, alignSelf: 'center' }}
            >
              <Text style={[styles.link, { fontWeight: '800', color: accent.a }]}>Create Account</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </MotionView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SURFACE.bg,
  },
  centerWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 78,
    alignItems: 'center',
  },
  logoShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: ACCENTS.green.a,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '900',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#7b845f',
  },
  form: {
    width: '100%',
    marginTop: 34,
  },
  label: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: hexToRgba(ACCENTS.green.a, 0.25),
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  inputError: {
    borderColor: ACCENTS.rose.a,
  },
  errorText: {
    marginTop: 8,
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  link: {
    color: '#4b7a55',
    fontSize: 14,
    fontWeight: '800',
  },
  loginBtn: {
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 18,
    backgroundColor: ACCENTS.green.a,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
});
