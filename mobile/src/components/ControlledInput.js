import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller } from 'react-hook-form';

const ControlledInput = forwardRef(
  (
    {
      control,
      name,
      label,
      placeholder,
      icon,
      secureTextEntry = false,
      autoCapitalize = 'none',
      keyboardType = 'default',
      returnKeyType = 'next',
      onSubmitEditing,
      autoComplete,
      textContentType,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(!secureTextEntry);

    return (
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
          const hasError = Boolean(error);
          return (
            <View style={styles.wrapper}>
              {label ? <Text style={styles.label}>{label}</Text> : null}
              <View
                style={[
                  styles.inputContainer,
                  isFocused && styles.inputContainerFocused,
                  hasError && styles.inputContainerError,
                ]}
              >
                {icon ? (
                  <Ionicons
                    name={icon}
                    size={18}
                    color={hasError ? '#ef4444' : isFocused ? '#a78bfa' : '#9ca3af'}
                    style={styles.icon}
                  />
                ) : null}
                <TextInput
                  ref={ref}
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor="#6b7280"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={() => {
                    setIsFocused(false);
                    onBlur();
                  }}
                  onFocus={() => setIsFocused(true)}
                  secureTextEntry={secureTextEntry && !showPassword}
                  autoCapitalize={autoCapitalize}
                  keyboardType={keyboardType}
                  returnKeyType={returnKeyType}
                  onSubmitEditing={onSubmitEditing}
                  autoComplete={autoComplete}
                  textContentType={textContentType}
                  autoCorrect={false}
                />
                {secureTextEntry ? (
                  <Pressable
                    hitSlop={10}
                    onPress={() => setShowPassword((s) => !s)}
                    style={styles.toggle}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color="#9ca3af"
                    />
                  </Pressable>
                ) : null}
              </View>
              {hasError ? (
                <Text style={styles.errorText}>{error.message}</Text>
              ) : null}
            </View>
          );
        }}
      />
    );
  }
);

ControlledInput.displayName = 'ControlledInput';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167,139,250,0.08)',
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#f9fafb',
  },
  toggle: {
    padding: 4,
    marginLeft: 4,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default ControlledInput;
