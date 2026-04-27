import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

const SetSectionHeader = ({ section }) => {
  const { setName, code, ownedUnique, totalCards } = section;
  const knownTotal = totalCards && totalCards > 0;
  const denominator = knownTotal ? totalCards : ownedUnique;
  const percent = knownTotal ? Math.min(100, Math.round((ownedUnique / totalCards) * 100)) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {setName || code || 'Unknown set'}
          </Text>
          {code ? <Text style={styles.code}>{code.toUpperCase()}</Text> : null}
        </View>
        <View style={styles.statsWrap}>
          <Text style={styles.fraction}>
            {ownedUnique}
            <Text style={styles.fractionDenom}>
              {' '}/ {knownTotal ? denominator : '—'}
            </Text>
          </Text>
          {percent !== null ? (
            <Text style={styles.percent}>{percent}%</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${percent ?? 0}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingTop: 12,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  code: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
    backgroundColor: colors.backgroundCardSolid,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  statsWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  fraction: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  fractionDenom: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  percent: {
    fontSize: 11,
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  barTrack: {
    height: 5,
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});

export default SetSectionHeader;
