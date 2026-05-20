import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface SortOption {
  id: string;
  label: string;
  icon: IoniconName;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: 'recent', label: 'Recent', icon: 'time-outline' },
  { id: 'name-asc', label: 'Name A→Z', icon: 'text-outline' },
  { id: 'rarity', label: 'Rarity', icon: 'star-outline' },
  { id: 'value-desc', label: 'Value (high)', icon: 'trending-up-outline' },
  { id: 'value-asc', label: 'Value (low)', icon: 'trending-down-outline' },
];

interface RarityOption {
  id: string;
  label: string;
  color: string;
}

const RARITIES: RarityOption[] = [
  { id: 'mythic', label: 'Mythic', color: '#f97316' },
  { id: 'rare', label: 'Rare', color: '#fbbf24' },
  { id: 'uncommon', label: 'Uncommon', color: '#94a3b8' },
  { id: 'common', label: 'Common', color: '#cbd5e1' },
];

interface ColorOption {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

const COLORS_LIST: ColorOption[] = [
  { id: 'W', label: 'W', color: '#fef3c7', textColor: '#92400e' },
  { id: 'U', label: 'U', color: '#bfdbfe', textColor: '#1e3a8a' },
  { id: 'B', label: 'B', color: '#374151', textColor: '#f3f4f6' },
  { id: 'R', label: 'R', color: '#fecaca', textColor: '#991b1b' },
  { id: 'G', label: 'G', color: '#bbf7d0', textColor: '#14532d' },
];

export interface ViewMode {
  id: string;
  label: string;
  icon: IoniconName;
}

export const VIEW_MODES: ViewMode[] = [
  { id: 'all', label: 'All cards', icon: 'apps-outline' },
  { id: 'set', label: 'By set', icon: 'albums-outline' },
];

export interface CollectionFilters {
  rarities: Set<string>;
  colors: Set<string>;
  foilOnly: boolean;
}

interface CollectionToolbarProps {
  sortKey: string;
  onSortChange: (id: string) => void;
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  viewMode: string;
  onViewModeChange: (id: string) => void;
}

const sortLabel = (id: string): string => SORT_OPTIONS.find((s) => s.id === id)?.label ?? 'Recent';

const CollectionToolbar = ({
  sortKey,
  onSortChange,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
}: CollectionToolbarProps): React.JSX.Element => {
  const [sortOpen, setSortOpen] = useState(false);

  const activeCount = filters.rarities.size + filters.colors.size + (filters.foilOnly ? 1 : 0);

  const toggleRarity = (id: string): void => {
    const next = new Set(filters.rarities);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFiltersChange({ ...filters, rarities: next });
  };

  const toggleColor = (id: string): void => {
    const next = new Set(filters.colors);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFiltersChange({ ...filters, colors: next });
  };

  const toggleFoilOnly = (): void => {
    onFiltersChange({ ...filters, foilOnly: !filters.foilOnly });
  };

  const clearAll = (): void => {
    onFiltersChange({ rarities: new Set(), colors: new Set(), foilOnly: false });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.viewModeRow}>
          {VIEW_MODES.map((mode) => {
            const active = viewMode === mode.id;
            return (
              <Pressable
                key={mode.id}
                onPress={() => onViewModeChange(mode.id)}
                style={({ pressed }) => [
                  styles.viewMode,
                  active && styles.viewModeActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={mode.icon}
                  size={14}
                  color={active ? colors.text : colors.textMuted}
                />
                <Text style={[styles.viewModeText, active && styles.viewModeTextActive]}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => setSortOpen(true)}
          style={({ pressed }) => [styles.sortPill, pressed && styles.pressed]}
          hitSlop={6}
        >
          <Ionicons name="swap-vertical" size={14} color={colors.textMuted} />
          <Text style={styles.sortPillText}>{sortLabel(sortKey)}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {RARITIES.map((r) => {
          const active = filters.rarities.has(r.id);
          return (
            <Pressable
              key={r.id}
              onPress={() => toggleRarity(r.id)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.chipDot, { backgroundColor: r.color }]} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{r.label}</Text>
            </Pressable>
          );
        })}

        <View style={styles.chipsDivider} />

        {COLORS_LIST.map((c) => {
          const active = filters.colors.has(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => toggleColor(c.id)}
              style={({ pressed }) => [
                styles.colorChip,
                {
                  backgroundColor: active ? c.color : colors.backgroundCardSolid,
                  borderColor: active ? c.color : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[styles.colorChipText, { color: active ? c.textColor : colors.textMuted }]}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}

        <View style={styles.chipsDivider} />

        <Pressable
          onPress={toggleFoilOnly}
          style={({ pressed }) => [
            styles.chip,
            filters.foilOnly && styles.chipFoilActive,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="sparkles"
            size={12}
            color={filters.foilOnly ? '#c4b5fd' : colors.textMuted}
          />
          <Text style={[styles.chipText, filters.foilOnly && styles.chipTextActive]}>
            Foil only
          </Text>
        </Pressable>

        {activeCount > 0 ? (
          <Pressable
            onPress={clearAll}
            style={({ pressed }) => [styles.clearChip, pressed && styles.pressed]}
          >
            <Ionicons name="close-circle" size={13} color={colors.danger} />
            <Text style={styles.clearChipText}>Clear ({activeCount})</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSortOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => {
              const active = opt.id === sortKey;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    onSortChange(opt.id);
                    setSortOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.sheetItem,
                    active && styles.sheetItemActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={active ? colors.primaryAccent : colors.textMuted}
                  />
                  <Text style={[styles.sheetItemText, active && styles.sheetItemTextActive]}>
                    {opt.label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark" size={18} color={colors.primaryAccent} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  viewModeRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  viewMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  viewModeActive: { backgroundColor: colors.primarySoft },
  viewModeText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  viewModeTextActive: { color: colors.text },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortPillText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  chipsDivider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCardSolid,
  },
  chipActive: { borderColor: 'rgba(167,139,250,0.5)', backgroundColor: colors.primarySoft },
  chipFoilActive: {
    borderColor: 'rgba(167,139,250,0.5)',
    backgroundColor: 'rgba(167,139,250,0.18)',
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.text },
  colorChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChipText: { fontSize: 13, fontWeight: '700' },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: colors.dangerSoft,
  },
  clearChipText: { fontSize: 12, fontWeight: '600', color: colors.danger },
  pressed: { opacity: 0.85 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 6,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  sheetItemActive: { backgroundColor: colors.primarySoft },
  sheetItemText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  sheetItemTextActive: { color: colors.primaryAccent, fontWeight: '700' },
});

export default CollectionToolbar;
