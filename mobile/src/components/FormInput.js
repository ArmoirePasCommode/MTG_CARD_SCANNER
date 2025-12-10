import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const FormInput = ({ label, ...props }) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={styles.input} placeholderTextColor="#9ca3af" {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#111827'
  }
});

export default FormInput;

