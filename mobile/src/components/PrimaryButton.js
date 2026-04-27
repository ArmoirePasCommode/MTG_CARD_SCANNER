import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, gradients, radius } from '../theme';

const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  iconRight,
  size = 'md',
  style,
}) => {
  const isInactive = loading || disabled;
  const sizeStyle = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;

  const renderContent = (textColor = '#fff') => (
    <View style={styles.content}>
      {icon && !loading ? (
        <Ionicons name={icon} size={18} color={textColor} style={styles.iconLeft} />
      ) : null}
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
      {iconRight && !loading ? (
        <Ionicons name={iconRight} size={18} color={textColor} style={styles.iconRight} />
      ) : null}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isInactive}
        style={({ pressed }) => [
          styles.base,
          sizeStyle,
          isInactive && styles.inactive,
          pressed && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
        />
        {renderContent('#fff')}
      </Pressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isInactive}
        style={({ pressed }) => [
          styles.base,
          sizeStyle,
          styles.ghost,
          isInactive && styles.inactive,
          pressed && styles.pressed,
          style,
        ]}
      >
        {renderContent(colors.text)}
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isInactive}
        style={({ pressed }) => [
          styles.base,
          sizeStyle,
          styles.danger,
          isInactive && styles.inactive,
          pressed && styles.pressed,
          style,
        ]}
      >
        {renderContent(colors.danger)}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        styles.secondary,
        isInactive && styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {renderContent(colors.text)}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sm: { paddingVertical: 10, paddingHorizontal: 14 },
  md: { paddingVertical: 14, paddingHorizontal: 18 },
  lg: { paddingVertical: 16, paddingHorizontal: 22 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  pressed: {
    opacity: 0.85,
  },
  inactive: {
    opacity: 0.55,
  },
});

export default PrimaryButton;
