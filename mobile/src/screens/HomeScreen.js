import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CardItem from '../components/CardItem';
import CollectionsPillRow from '../components/CollectionsPillRow';
import CollectionToolbar from '../components/CollectionToolbar';
import SetSectionHeader from '../components/SetSectionHeader';
import { useCollection } from '../context/CollectionContext';
import useAuth from '../hooks/useAuth';
import { useKeyboardScrollPadding } from '../hooks/useKeyboardScrollPadding';
import { colors, gradients, radius, shadow } from '../theme';
import { cardLineValue, formatUsdCompact } from '../utils/format';
import { getCachedSetInfo, primeSetInfo } from '../utils/setInfoCache';

const RARITY_ORDER = { mythic: 0, rare: 1, uncommon: 2, common: 3, special: 4, bonus: 5 };

const sortCards = (list, sortKey) => {
  const arr = [...list];
  switch (sortKey) {
    case 'name-asc':
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'rarity':
      arr.sort((a, b) => {
        const ra = RARITY_ORDER[(a.rarity || 'common').toLowerCase()] ?? 99;
        const rb = RARITY_ORDER[(b.rarity || 'common').toLowerCase()] ?? 99;
        if (ra !== rb) return ra - rb;
        return (a.name || '').localeCompare(b.name || '');
      });
      break;
    case 'value-desc':
      arr.sort((a, b) => cardLineValue(b) - cardLineValue(a));
      break;
    case 'value-asc':
      arr.sort((a, b) => cardLineValue(a) - cardLineValue(b));
      break;
    case 'recent':
    default:
      arr.sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
        return tb - ta;
      });
  }
  return arr;
};

const HomeScreen = ({ navigation }) => {
  const { cards, fetchCards, loading, removeCard, activeTag } = useCollection();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [viewMode, setViewMode] = useState('all');
  const [filters, setFilters] = useState({
    rarities: new Set(),
    colors: new Set(),
    foilOnly: false,
  });
  const [, forceRefresh] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const uniqueSetCodes = useMemo(() => {
    const set = new Set();
    cards.forEach((c) => {
      if (c.edition) set.add(String(c.edition).toLowerCase());
    });
    return Array.from(set);
  }, [cards]);

  useEffect(() => {
    if (viewMode !== 'set' || uniqueSetCodes.length === 0) return;
    let cancelled = false;
    (async () => {
      await primeSetInfo(uniqueSetCodes);
      if (!cancelled) forceRefresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [viewMode, uniqueSetCodes]);

  const visible = useMemo(() => {
    let list = cards;
    // Collection (tag) filter
    if (activeTag !== null) {
      list = list.filter((c) => Array.isArray(c.tags) && c.tags.includes(activeTag));
    }
    if (filters.rarities.size) {
      list = list.filter((c) =>
        filters.rarities.has(String(c.rarity || 'common').toLowerCase())
      );
    }
    if (filters.colors.size) {
      list = list.filter((c) =>
        Array.isArray(c.colors) &&
        c.colors.some((col) => filters.colors.has(col))
      );
    }
    if (filters.foilOnly) {
      list = list.filter((c) => c.isFoil === true);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((card) =>
        [card.name, card.typeLine, card.setName]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      );
    }
    return sortCards(list, sortKey);
  }, [cards, activeTag, filters, searchQuery, sortKey]);

  const setSections = useMemo(() => {
    if (viewMode !== 'set') return [];
    const groups = new Map();
    visible.forEach((card) => {
      const code = (card.edition || '').toLowerCase() || '__unknown__';
      if (!groups.has(code)) {
        groups.set(code, {
          code,
          setName: card.setName || card.edition || 'Unknown set',
          uniqueIds: new Set(),
          data: [],
        });
      }
      const group = groups.get(code);
      group.data.push(card);
      const key = card.scryfallId || card.id || `${card.name}-${card.collectorNumber || ''}`;
      group.uniqueIds.add(key);
    });

    return Array.from(groups.values())
      .map((g) => {
        const info = getCachedSetInfo(g.code);
        return {
          ...g,
          totalCards: info?.cardCount ?? 0,
          ownedUnique: g.uniqueIds.size,
          setName: info?.name || g.setName,
        };
      })
      .sort((a, b) => (a.setName || '').localeCompare(b.setName || ''));
  }, [visible, viewMode]);

  const stats = useMemo(() => {
    let total = 0;
    let mythic = 0;
    let rare = 0;
    let other = 0;
    let value = 0;
    cards.forEach((card) => {
      const qty = Math.max(1, card.quantity || 1);
      total += qty;
      const r = (card.rarity || 'common').toLowerCase();
      if (r === 'mythic') mythic += qty;
      else if (r === 'rare') rare += qty;
      else other += qty;
      value += cardLineValue(card);
    });
    return { total, mythic, rare, other, value };
  }, [cards]);

  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  const { scrollRef: listRef, contentPadding } = useKeyboardScrollPadding({
    baseBottomPadding: 100,
  });
  const scrollListTop = useCallback(() => {
    listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
  }, [listRef]);

  const greeting = user?.displayName ? `Hello, ${user.displayName}` : 'Your Collection';

  const renderCard = ({ item }) => (
    <CardItem
      card={item}
      onPress={() => navigation.navigate('CardDetails', { card: item })}
      onDelete={item.id ? () => removeCard(item.id) : undefined}
    />
  );

  const ListHeader = (
    <View>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>Manage your Magic collection</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <StatBlock label="Total" value={stats.total} accent={colors.primaryAccent} />
        <View style={styles.statDivider} />
        <StatBlock label="Mythic" value={stats.mythic} accent="#f97316" />
        <View style={styles.statDivider} />
        <StatBlock label="Rare" value={stats.rare} accent="#fbbf24" />
        <View style={styles.statDivider} />
        <StatBlock label="Other" value={stats.other} accent="#94a3b8" />
        <View style={styles.statDivider} />
        <StatBlock
          label="Value"
          value={formatUsdCompact(stats.value)}
          accent={colors.success}
          isText
        />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={18}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, type, or set..."
          placeholderTextColor={colors.textSubtle}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={scrollListTop}
          autoCorrect={false}
        />
        {searchQuery.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <CollectionsPillRow />

      <CollectionToolbar
        sortKey={sortKey}
        onSortChange={setSortKey}
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {visible.length > 0 && viewMode === 'all' ? (
        <Text style={styles.resultCount}>
          {visible.length} {visible.length === 1 ? 'card' : 'cards'}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </Text>
      ) : null}
    </View>
  );

  const EmptyState = (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="albums-outline" size={36} color={colors.primaryAccent} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery || filters.rarities.size || filters.colors.size || filters.foilOnly
          ? 'No matches'
          : 'Your collection is empty'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery || filters.rarities.size || filters.colors.size || filters.foilOnly
          ? 'Try a different search query or clear your filters.'
          : 'Tap the camera button below to scan your first card.'}
      </Text>
    </View>
  );

  const refreshControl = (
    <RefreshControl
      refreshing={loading}
      onRefresh={fetchCards}
      tintColor={colors.primaryAccent}
      colors={[colors.primaryAccent]}
      progressBackgroundColor={colors.backgroundElevated}
    />
  );

  return (
    <LinearGradient colors={gradients.background} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {viewMode === 'set' ? (
          <SectionList
            ref={listRef}
            sections={setSections}
            keyExtractor={(item, index) =>
              item.id || item.scryfallId || `card-${index}`
            }
            renderItem={renderCard}
            renderSectionHeader={({ section }) => (
              <SetSectionHeader section={section} />
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={[styles.listContent, contentPadding]}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={EmptyState}
            refreshControl={refreshControl}
            keyboardDismissMode="on-drag"
          />
        ) : (
          <FlatList
            ref={listRef}
            data={visible}
            keyExtractor={(item, index) =>
              item.id || item.scryfallId || `card-${index}`
            }
            renderItem={renderCard}
            contentContainerStyle={[styles.listContent, contentPadding]}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={EmptyState}
            refreshControl={refreshControl}
            keyboardDismissMode="on-drag"
          />
        )}

        <Pressable
          onPress={() => navigation.navigate('Scan')}
          onLongPress={() => setFabMenuOpen(true)}
          delayLongPress={300}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="camera" size={26} color="#fff" />
          </LinearGradient>
        </Pressable>

        {/* FAB action sheet */}
        <Modal
          visible={fabMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFabMenuOpen(false)}
        >
          <Pressable style={styles.fabModalBackdrop} onPress={() => setFabMenuOpen(false)}>
            <Pressable style={styles.fabSheet} onPress={() => {}}>
              <View style={styles.fabSheetHandle} />
              <Text style={styles.fabSheetTitle}>Add cards</Text>
              {[
                { icon: 'camera', label: 'Scan a card', sub: 'Single card OCR', screen: 'Scan' },
                { icon: 'layers', label: 'Bulk scan', sub: 'Capture many cards at once', screen: 'BulkScan' },
                { icon: 'search', label: 'Add by name', sub: 'Search or paste a decklist', screen: 'AddCards' },
              ].map((item) => (
                <Pressable
                  key={item.screen}
                  onPress={() => {
                    setFabMenuOpen(false);
                    navigation.navigate(item.screen);
                  }}
                  style={({ pressed }) => [styles.fabMenuItem, pressed && styles.fabMenuItemPressed]}
                >
                  <View style={styles.fabMenuIconWrap}>
                    <Ionicons name={item.icon} size={20} color={colors.primaryAccent} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.fabMenuLabel}>{item.label}</Text>
                    <Text style={styles.fabMenuSub}>{item.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const StatBlock = ({ label, value, accent, isText }) => (
  <View style={statStyles.block}>
    <Text
      style={[
        statStyles.value,
        { color: accent },
        isText && statStyles.valueText,
      ]}
      numberOfLines={1}
    >
      {value}
    </Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  block: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  valueText: {
    fontSize: 14,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadow.card,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  resultCount: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...shadow.fab,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  fabSheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fabSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  fabSheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fabMenuItemPressed: {
    backgroundColor: colors.primarySoft,
  },
  fabMenuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  fabMenuSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});

export default HomeScreen;
