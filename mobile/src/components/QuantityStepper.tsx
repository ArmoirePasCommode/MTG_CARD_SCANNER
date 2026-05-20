import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '../theme';

interface QuantityStepperProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const QuantityStepper = ({
  value = 1,
  onChange,
  min = 1,
  max = 999,
  disabled = false,
}: QuantityStepperProps): React.JSX.Element => {
  const safeValue = Math.max(min, Math.min(max, value || min));

  const dec = (): void => {
    if (disabled || safeValue <= min) return;
    onChange?.(safeValue - 1);
  };
  const inc = (): void => {
    if (disabled || safeValue >= max) return;
    onChange?.(safeValue + 1);
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <Pressable
        onPress={dec}
        disabled={disabled || safeValue <= min}
        hitSlop={6}
        style={({ pressed }) => [
          styles.btn,
          (safeValue <= min || disabled) && styles.btnDisabled,
          pressed && styles.btnPressed,
        ]}
      >
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <Text style={styles.value}>{safeValue}</Text>
      <Pressable
        onPress={inc}
        disabled={disabled || safeValue >= max}
        hitSlop={6}
        style={({ pressed }) => [
          styles.btn,
          (safeValue >= max || disabled) && styles.btnDisabled,
          pressed && styles.btnPressed,
        ]}
      >
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.55,
  },
  btn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    backgroundColor: colors.primarySoft,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  value: {
    minWidth: 32,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default QuantityStepper;
