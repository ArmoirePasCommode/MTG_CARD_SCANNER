import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import useAuth from '../hooks/useAuth';
import { useCollection } from '../context/CollectionContext';
import { colors, gradients, radius, shadow } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const getInitials = (name = '', email = ''): string => {
  const source = name?.trim() || email?.trim() || '';
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

const ProfileScreen = (): React.JSX.Element => {
  const { user, logout, refreshProfile } = useAuth();
  const { cards } = useCollection();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refreshProfile?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const byRarity = cards.reduce<Record<string, number>>((acc, card) => {
      const r = (card.rarity ?? 'common').toLowerCase();
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {});
    return [
      {
        icon: 'albums-outline' as IoniconName,
        label: 'Total cards',
        value: cards.length,
        accent: colors.primaryAccent,
      },
      {
        icon: 'flame-outline' as IoniconName,
        label: 'Mythics',
        value: byRarity['mythic'] ?? 0,
        accent: '#f97316',
      },
      {
        icon: 'star-outline' as IoniconName,
        label: 'Rares',
        value: byRarity['rare'] ?? 0,
        accent: '#fbbf24',
      },
      {
        icon: 'sparkles-outline' as IoniconName,
        label: 'Uncommons',
        value: byRarity['uncommon'] ?? 0,
        accent: '#94a3b8',
      },
    ];
  }, [cards]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const initials = getInitials(user?.displayName ?? '', user?.email ?? '');

  return (
    <LinearGradient colors={gradients.background} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Profile</Text>

          <View style={styles.profileCard}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <Text style={styles.displayName}>{user?.displayName ?? 'Unknown planeswalker'}</Text>
            <View style={styles.emailRow}>
              <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
              <Text style={styles.email}>{user?.email ?? '—'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Collection stats</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.accent}26` }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.accent} />
                </View>
                <Text style={[styles.statValue, { color: stat.accent }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.actions}>
            <PrimaryButton
              title="Refresh profile"
              variant="secondary"
              icon="refresh"
              onPress={() => {
                void handleRefresh();
              }}
              loading={refreshing}
            />
            <PrimaryButton
              title="Sign out"
              variant="danger"
              icon="log-out-outline"
              onPress={logout}
            />
          </View>

          <Text style={styles.versionText}>MTG Card Scanner · v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 18 },
  profileCard: {
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    ...shadow.card,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700', letterSpacing: 1 },
  displayName: { fontSize: 20, fontWeight: '700', color: colors.text },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  email: { fontSize: 13, color: colors.textMuted },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actions: { gap: 10, marginBottom: 28 },
  versionText: { color: colors.textSubtle, fontSize: 11, textAlign: 'center', marginTop: 12 },
});

export default ProfileScreen;
