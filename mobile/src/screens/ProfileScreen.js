import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import useAuth from '../hooks/useAuth';

const ProfileScreen = () => {
  const { user, logout, refreshProfile } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Profile</Text>
        <Text style={styles.label}>Display name</Text>
        <Text style={styles.value}>{user?.displayName || 'Unknown planeswalker'}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
        <PrimaryButton title="Refresh profile" onPress={refreshProfile} />
        <PrimaryButton title="Sign out" variant="secondary" onPress={logout} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
    letterSpacing: 1,
    marginTop: 12
  },
  value: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '600'
  }
});

export default ProfileScreen;

