import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import ControlledInput from '../components/ControlledInput';
import useAuth from '../hooks/useAuth';
import { useKeyboardScrollPadding } from '../hooks/useKeyboardScrollPadding';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema.extend({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(40, 'Display name is too long'),
});

const AuthScreen = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [serverError, setServerError] = useState(null);
  const fade = useRef(new Animated.Value(1)).current;
  const { scrollRef, contentPadding, scrollToEnd } = useKeyboardScrollPadding({
    baseBottomPadding: 32,
  });

  const isLogin = mode === 'login';
  const schema = isLogin ? loginSchema : registerSchema;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', displayName: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [mode, fade]);

  const switchMode = () => {
    setServerError(null);
    reset({ email: '', password: '', displayName: '' });
    setMode((m) => (m === 'login' ? 'register' : 'login'));
  };

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (isLogin) {
        await login(values.email.trim().toLowerCase(), values.password);
      } else {
        await register({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          displayName: values.displayName.trim(),
        });
      }
    } catch (err) {
      setServerError(err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={['#0f0a1f', '#1a103a', '#0f0a1f']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, contentPadding]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Ionicons name="sparkles" size={28} color="#a78bfa" />
            </View>
            <Text style={styles.brandTitle}>MTG Card Scanner</Text>
            <Text style={styles.brandSubtitle}>
              Scan, organize, and master your collection
            </Text>
          </View>

          <Animated.View style={[styles.card, { opacity: fade }]}>
            <Text style={styles.heading}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </Text>
            <Text style={styles.subHeading}>
              {isLogin
                ? 'Sign in to access your collection'
                : 'Start tracking your Magic cards today'}
            </Text>

            {!isLogin ? (
              <ControlledInput
                control={control}
                name="displayName"
                label="DISPLAY NAME"
                placeholder="Planeswalker"
                icon="person-outline"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                onInputFocus={scrollToEnd}
              />
            ) : null}

            <ControlledInput
              control={control}
              name="email"
              label="EMAIL"
              placeholder="you@example.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              onInputFocus={scrollToEnd}
            />

            <ControlledInput
              control={control}
              name="password"
              label="PASSWORD"
              placeholder="••••••••"
              icon="lock-closed-outline"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              textContentType={isLogin ? 'password' : 'newPassword'}
              onInputFocus={scrollToEnd}
            />

            {serverError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#fca5a5" />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                isSubmitting && styles.primaryButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {isLogin ? 'Log in' : 'Create account'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable onPress={switchMode} style={styles.switchButton}>
              <Text style={styles.switchButtonText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchButtonLink}>
                  {isLogin ? 'Sign up' : 'Log in'}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.footer}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(15,10,31,0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchButtonText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  switchButtonLink: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  footer: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default AuthScreen;
