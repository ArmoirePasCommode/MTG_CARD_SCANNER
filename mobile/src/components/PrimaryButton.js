import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

const PrimaryButton = ({ title, loading = false, variant = 'primary', ...props }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' ? styles.secondary : styles.primary,
        pressed && styles.pressed
      ]}
      disabled={loading}
      {...props}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 6
  },
  primary: {
    backgroundColor: '#7c3aed'
  },
  secondary: {
    backgroundColor: '#111827'
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  pressed: {
    opacity: 0.85
  }
});

export default PrimaryButton;

