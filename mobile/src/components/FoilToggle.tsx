import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '../theme';

const FOIL_GRADIENT = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f472b6'] as const;

interface FoilToggleProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}

const FoilToggle = ({
  value = false,
  onChange,
  disabled = false,
  label = 'Foil',
}: FoilToggleProps): React.JSX.Element => (
  <Pressable
    onPress={() => !disabled && onChange?.(!value)}
    disabled={disabled}
    style={({ pressed }) => [
      styles.container,
      value && styles.active,
      disabled && styles.disabled,
      pressed && styles.pressed,
    ]}
  >
    {value ? (
      <LinearGradient
        colors={FOIL_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, opacity: 0.18 }]}
      />
    ) : null}
    <View style={[styles.dot, value ? styles.dotActive : styles.dotInactive]}>
      {value ? <Ionicons name="sparkles" size={12} color="#fff" /> : null}
    </View>
    <Text style={[styles.label, value && styles.labelActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCardSolid,
    gap: 8,
    overflow: 'hidden',
  },
  active: {
    borderColor: 'rgba(167,139,250,0.6)',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInactive: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.text,
  },
});

export default FoilToggle;
