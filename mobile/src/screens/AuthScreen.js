import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import useAuth from '../hooks/useAuth';

const AuthScreen = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.heading}>MTG Card Scanner</Text>
        <Text style={styles.subHeading}>
          {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
        </Text>
        {mode === 'register' ? (
          <FormInput
            label="Display name"
            placeholder="Chandra Nalaar"
            value={form.displayName}
            onChangeText={(text) => handleChange('displayName', text)}
            autoCapitalize="words"
          />
        ) : null}
        <FormInput
          label="Email"
          placeholder="you@example.com"
          value={form.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormInput
          label="Password"
          placeholder="••••••••"
          value={form.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title={mode === 'login' ? 'Log in' : 'Sign up'}
          onPress={handleSubmit}
          loading={loading}
        />
        <PrimaryButton
          title={mode === 'login' ? 'Switch to Sign up' : 'Switch to Log in'}
          variant="secondary"
          onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 24,
    justifyContent: 'center'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6
  },
  subHeading: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 22
  },
  error: {
    color: '#dc2626',
    marginVertical: 8
  }
});

export default AuthScreen;

