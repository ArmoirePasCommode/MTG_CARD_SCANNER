import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  STATUS,
  newId,
  findExistingByScryfallId,
  ReviewStage,
  type ReviewEntry,
} from '../components/BulkReview';
import { useCollection } from '../context/CollectionContext';
import {
  autocompleteCardName,
  fetchCardByName,
  fetchCardBySetAndCollector,
} from '../services/scryfallService';
import { useKeyboardScrollPadding } from '../hooks/useKeyboardScrollPadding';
import { colors, gradients, radius } from '../theme';
import type { CardUpdate, NewCard } from '../types/api';
import type { AddCardsScreenProps } from '../navigation/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type StageType = 'input' | 'review';
type TabKey = 'search' | 'paste';

const QTY_RE = /^\s*(?:(\d+)\s*[x×]?\s+)?([^()\n]+?)(?:\s*\(([^)]+)\)\s*(\S+?))?\s*$/i;
const SKIP_RE = /^(\/\/|sideboard|deck|main|commander|companion)\b/i;
const MAX_DECKLIST_IMPORT_LINES = 250;

interface ParsedLine {
  qty: number;
  name: string;
  setCode: string | null;
  collectorNumber: string | null;
}

const parseDecklistLine = (line: string): ParsedLine | null => {
  const trimmed = line.trim();
  if (!trimmed || SKIP_RE.test(trimmed)) return null;
  const m = QTY_RE.exec(trimmed);
  if (!m) return null;
  const qty = m[1] ? Math.max(1, parseInt(m[1], 10)) : 1;
  const name = (m[2] ?? '').trim();
  const setCode = m[3] ? m[3].trim().toLowerCase() : null;
  const collectorNumber = m[4] ? m[4].trim() : null;
  if (!name) return null;
  return { qty, name, setCode, collectorNumber };
};

type TaskFn = () => Promise<unknown>;

const limitedConcurrency = async (tasks: TaskFn[], limit = 4): Promise<void> => {
  let i = 0;
  const run = async (): Promise<void> => {
    while (i < tasks.length) {
      const idx = i++;
      await tasks[idx]?.();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, run));
};

const TABS: Array<{ key: TabKey; label: string; icon: IoniconName }> = [
  { key: 'search', label: 'Search', icon: 'search-outline' },
  { key: 'paste', label: 'Paste list', icon: 'clipboard-outline' },
];

// ---------------------------------------------------------------------------
// SearchTab
// ---------------------------------------------------------------------------

interface SearchTabProps {
  entries: ReviewEntry[];
  setEntries: React.Dispatch<React.SetStateAction<ReviewEntry[]>>;
  recognizedCount: number;
  pendingCount: number;
  failedCount: number;
  onRemove: (id: string) => void;
  onReview: () => void;
  globalError: string | null;
  setGlobalError: (err: string | null) => void;
}

const SearchTab = ({
  entries,
  setEntries,
  recognizedCount,
  pendingCount,
  failedCount,
  onReview,
  globalError,
  setGlobalError,
}: SearchTabProps): React.JSX.Element => {
  const { scrollRef, contentPadding, scrollToEnd } = useKeyboardScrollPadding({
    baseBottomPadding: 24,
  });
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const autocompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    autocompleteTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const results = await autocompleteCardName(query);
          if (!cancelled) setSuggestions(results.slice(0, 8));
        } catch {
          if (!cancelled) setSuggestions([]);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    };
  }, [query]);

  const handlePick = useCallback(
    async (name: string): Promise<void> => {
      setQuery('');
      setSuggestions([]);
      setGlobalError(null);
      setLookingUp(true);
      try {
        const card = await fetchCardByName(name, false);
        if (!card) throw new Error(`"${name}" not found on Scryfall`);
        setEntries((prev) => {
          const existing = card.scryfallId
            ? prev.find(
                (e) =>
                  e.status === STATUS.RECOGNIZED &&
                  e.card?.scryfallId === card.scryfallId &&
                  e.isFoil === false
              )
            : null;
          if (existing) {
            return prev.map((e) =>
              e.id === existing.id ? { ...e, quantity: (e.quantity || 1) + 1 } : e
            );
          }
          return [
            ...prev,
            {
              id: newId(),
              uri: null,
              name,
              status: STATUS.RECOGNIZED,
              card,
              quantity: 1,
              isFoil: false,
              error: null,
            },
          ];
        });
      } catch (err: unknown) {
        setGlobalError(err instanceof Error ? err.message : 'Card not found');
      } finally {
        setLookingUp(false);
      }
    },
    [setEntries, setGlobalError]
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[styles.searchTabScroll, contentPadding]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a card…"
            placeholderTextColor={colors.textSubtle}
            value={query}
            onChangeText={setQuery}
            onFocus={() => scrollToEnd()}
            onSubmitEditing={() => {
              if (query.trim()) void handlePick(query.trim());
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            editable={!lookingUp}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                setQuery('');
                setSuggestions([]);
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((name, idx) => (
              <Pressable
                key={name}
                onPress={() => {
                  void handlePick(name);
                }}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  idx !== suggestions.length - 1 && styles.suggestionDivider,
                  pressed && styles.suggestionPressed,
                ]}
              >
                <Ionicons name="albums-outline" size={14} color={colors.textMuted} />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {name}
                </Text>
                <Ionicons name="add-circle-outline" size={16} color={colors.primaryAccent} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {globalError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={15} color="#fca5a5" />
          <Text style={styles.errorText}>{globalError}</Text>
        </View>
      ) : null}

      {entries.length > 0 ? (
        <View style={styles.queueSummary}>
          <Text style={styles.queueSummaryText}>
            {recognizedCount} card{recognizedCount !== 1 ? 's' : ''} queued
            {pendingCount > 0 ? ` · ${pendingCount} loading` : ''}
            {failedCount > 0 ? ` · ${failedCount} failed` : ''}
          </Text>
          <Pressable onPress={onReview} style={styles.reviewNowBtn}>
            <Text style={styles.reviewNowText}>Review & Save</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primaryAccent} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.searchEmptyState}>
          <Ionicons name="search-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Search and queue cards</Text>
          <Text style={styles.emptySubtitle}>
            Type a card name above. Each result is added to your queue — adjust quantity and foil
            before saving.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ---------------------------------------------------------------------------
// PasteTab
// ---------------------------------------------------------------------------

interface PasteTabProps {
  entries: ReviewEntry[];
  setEntries: React.Dispatch<React.SetStateAction<ReviewEntry[]>>;
  recognizedCount: number;
  pendingCount: number;
  failedCount: number;
  onReview: () => void;
  globalError: string | null;
  setGlobalError: (err: string | null) => void;
}

const PasteTab = ({
  entries,
  setEntries,
  recognizedCount,
  pendingCount,
  failedCount,
  onReview,
  globalError,
  setGlobalError,
}: PasteTabProps): React.JSX.Element => {
  const { scrollRef, contentPadding, scrollToEnd } = useKeyboardScrollPadding({
    baseBottomPadding: 40,
  });
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);

  const handleImport = useCallback(async (): Promise<void> => {
    const lines = text.split('\n');
    const parsed = lines.map(parseDecklistLine).filter((x): x is ParsedLine => x !== null);
    if (parsed.length === 0) {
      setGlobalError('No valid card lines found. Use format: "4 Lightning Bolt"');
      return;
    }
    if (parsed.length > MAX_DECKLIST_IMPORT_LINES) {
      setGlobalError(
        `Too many cards (${parsed.length}). Max ${MAX_DECKLIST_IMPORT_LINES} lines per import.`
      );
      return;
    }
    setGlobalError(null);
    setParsing(true);

    const newEntries: (ReviewEntry & { _parsed: ParsedLine })[] = parsed.map((p) => ({
      id: newId(),
      uri: null,
      name: p.name,
      status: STATUS.PENDING,
      card: undefined,
      quantity: p.qty,
      isFoil: false,
      error: null,
      _parsed: p,
    }));
    setEntries((prev) => [...prev, ...newEntries]);

    const tasks: TaskFn[] = newEntries.map((entry) => async () => {
      try {
        const p = entry._parsed;
        let card: NewCard | null = null;
        if (p.setCode && p.collectorNumber) {
          card = await fetchCardBySetAndCollector(p.setCode, p.collectorNumber);
        }
        if (!card) card = await fetchCardByName(p.name, true);
        if (!card) throw new Error(`"${p.name}" not found`);
        setEntries((prev) => {
          const dup = card!.scryfallId
            ? prev.find(
                (e) =>
                  e.id !== entry.id &&
                  e.status === STATUS.RECOGNIZED &&
                  e.card?.scryfallId === card!.scryfallId &&
                  e.isFoil === false
              )
            : null;
          if (dup) {
            return prev
              .map((e) =>
                e.id === dup.id
                  ? {
                      ...e,
                      quantity: (e.quantity || 1) + (entry.quantity || 1),
                      mergedFromBatch: true,
                    }
                  : e
              )
              .filter((e) => e.id !== entry.id);
          }
          return prev.map((e) =>
            e.id === entry.id ? { ...e, status: STATUS.RECOGNIZED, card: card!, error: null } : e
          );
        });
      } catch (err: unknown) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: STATUS.FAILED,
                  error: err instanceof Error ? err.message : 'Not found',
                }
              : e
          )
        );
      }
    });

    await limitedConcurrency(tasks, 4);
    setParsing(false);
    setText('');
  }, [text, setEntries, setGlobalError]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[styles.pasteScroll, contentPadding]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.pasteHint}>Paste one card per line. Supported formats:</Text>
      <View style={styles.pasteFormatBox}>
        <Text style={styles.pasteFormatLine}>4 Lightning Bolt</Text>
        <Text style={styles.pasteFormatLine}>2x Sol Ring</Text>
        <Text style={styles.pasteFormatLine}>1 Black Lotus (LEA) 232</Text>
        <Text style={styles.pasteFormatLine}>// comments are ignored</Text>
      </View>
      <TextInput
        style={styles.pasteInput}
        multiline
        value={text}
        onChangeText={setText}
        onFocus={() => scrollToEnd()}
        placeholder="Paste your list here…"
        placeholderTextColor={colors.textSubtle}
        autoCorrect={false}
        autoCapitalize="none"
        editable={!parsing}
      />
      {globalError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={15} color="#fca5a5" />
          <Text style={styles.errorText}>{globalError}</Text>
        </View>
      ) : null}
      <Pressable
        onPress={() => {
          void handleImport();
        }}
        disabled={!text.trim() || parsing}
        style={({ pressed }) => [
          styles.importBtn,
          (!text.trim() || parsing) && styles.importBtnDisabled,
          pressed && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={
            !text.trim() || parsing
              ? [colors.backgroundCardSolid, colors.backgroundCardSolid]
              : ['#7c3aed', '#6d28d9']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.importBtnGradient}
        >
          {parsing ? (
            <Text style={styles.importBtnText}>Resolving cards…</Text>
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={18} color="#fff" />
              <Text style={styles.importBtnText}>Import list</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
      {entries.length > 0 ? (
        <View style={styles.queueSummary}>
          <Text style={styles.queueSummaryText}>
            {recognizedCount} ready{pendingCount > 0 ? ` · ${pendingCount} loading` : ''}
            {failedCount > 0 ? ` · ${failedCount} failed` : ''}
          </Text>
          <Pressable onPress={onReview} style={styles.reviewNowBtn}>
            <Text style={styles.reviewNowText}>Review & Save</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primaryAccent} />
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
};

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

const AddCardsScreen = ({ navigation }: AddCardsScreenProps): React.JSX.Element => {
  const { cards, bulkAddToCollection, updateCardInCollection } = useCollection();

  const [tab, setTab] = useState<TabKey>('search');
  const [stage, setStage] = useState<StageType>('input');
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [batchTags, setBatchTags] = useState<string[]>([]);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const updateEntry = useCallback((id: string, patch: Partial<ReviewEntry>): void => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const removeEntry = useCallback((id: string): void => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const recognizedCount = useMemo(
    () => entries.filter((e) => e.status === STATUS.RECOGNIZED).length,
    [entries]
  );
  const pendingCount = useMemo(
    () => entries.filter((e) => e.status === STATUS.PENDING).length,
    [entries]
  );
  const failedCount = useMemo(
    () => entries.filter((e) => e.status === STATUS.FAILED).length,
    [entries]
  );
  const totalEstimate = useMemo(
    () =>
      entries
        .filter((e) => e.status === STATUS.RECOGNIZED)
        .reduce((sum, e) => {
          const price = e.isFoil
            ? (e.card?.priceUsdFoil ?? e.card?.priceUsd ?? 0)
            : (e.card?.priceUsd ?? 0);
          return sum + (price ?? 0) * Math.max(1, e.quantity || 1);
        }, 0),
    [entries]
  );

  const handleSaveAll = useCallback(async (): Promise<void> => {
    const recognized = entries.filter((e) => e.status === STATUS.RECOGNIZED);
    if (recognized.length === 0) return;
    setSaving(true);
    setGlobalError(null);
    try {
      const newCardsPayload: NewCard[] = [];
      const updates: Array<{ id: string; patch: CardUpdate }> = [];
      recognized.forEach((entry) => {
        const existing = findExistingByScryfallId(cards, entry.card?.scryfallId);
        if (existing && entry.isFoil === (existing.isFoil === true)) {
          updates.push({
            id: existing.id,
            patch: {
              quantity: (existing.quantity || 1) + (entry.quantity || 1),
              tags: Array.from(new Set([...(existing.tags ?? []), ...batchTags])),
            },
          });
        } else if (entry.card) {
          newCardsPayload.push({
            ...entry.card,
            quantity: entry.quantity,
            isFoil: entry.isFoil,
            tags: batchTags,
          });
        }
      });
      const tasks: Promise<unknown>[] = [];
      if (newCardsPayload.length > 0) tasks.push(bulkAddToCollection(newCardsPayload));
      updates.forEach((u) => tasks.push(updateCardInCollection(u.id, u.patch)));
      await Promise.all(tasks);
      navigation.goBack();
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to save cards');
    } finally {
      setSaving(false);
    }
  }, [entries, cards, batchTags, bulkAddToCollection, updateCardInCollection, navigation]);

  const handleExit = useCallback((): void => {
    if (entries.length === 0 || stage === 'input') {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Discard cards?',
      `You have ${entries.length} card${entries.length === 1 ? '' : 's'} queued. They will be lost.`,
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  }, [entries.length, stage, navigation]);

  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (entriesRef.current.length === 0 || saving || stage === 'input') return;
      e.preventDefault();
      Alert.alert(
        'Discard cards?',
        `You have ${entriesRef.current.length} card${entriesRef.current.length === 1 ? '' : 's'} queued. They will be lost.`,
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return sub;
  }, [navigation, saving, stage]);

  const switchTab = (key: TabKey): void => {
    if (key === tab) return;
    if (entries.length > 0) {
      Alert.alert('Switch tab?', 'Switching tabs will clear your current queue.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          style: 'destructive',
          onPress: () => {
            setEntries([]);
            setStage('input');
            setGlobalError(null);
            setTab(key);
          },
        },
      ]);
    } else {
      setStage('input');
      setGlobalError(null);
      setTab(key);
    }
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleExit}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{stage === 'review' ? 'Review & Save' : 'Add Cards'}</Text>
          {stage === 'input' ? (
            <Pressable
              onPress={() => {
                if (entries.length > 0) setStage('review');
              }}
              disabled={entries.length === 0}
              style={({ pressed }) => [
                styles.reviewBtn,
                entries.length === 0 && styles.reviewBtnDisabled,
                pressed && styles.pressed,
              ]}
              hitSlop={6}
            >
              <Text style={styles.reviewBtnText}>
                Review{entries.length > 0 ? ` (${entries.length})` : ''}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setStage('input')}
              style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}
              hitSlop={6}
            >
              <Ionicons name="add" size={18} color={colors.primaryAccent} />
              <Text style={styles.reviewBtnText}>Add more</Text>
            </Pressable>
          )}
        </View>

        {stage === 'input' ? (
          <>
            <View style={styles.tabBar}>
              {TABS.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => switchTab(t.key)}
                  style={({ pressed }) => [
                    styles.tabBtn,
                    tab === t.key && styles.tabBtnActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={t.icon}
                    size={15}
                    color={tab === t.key ? colors.primaryAccent : colors.textMuted}
                  />
                  <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === 'search' ? (
              <SearchTab
                entries={entries}
                setEntries={setEntries}
                recognizedCount={recognizedCount}
                pendingCount={pendingCount}
                failedCount={failedCount}
                onRemove={removeEntry}
                onReview={() => setStage('review')}
                globalError={globalError}
                setGlobalError={setGlobalError}
              />
            ) : (
              <PasteTab
                entries={entries}
                setEntries={setEntries}
                recognizedCount={recognizedCount}
                pendingCount={pendingCount}
                failedCount={failedCount}
                onReview={() => setStage('review')}
                globalError={globalError}
                setGlobalError={setGlobalError}
              />
            )}
          </>
        ) : (
          <ReviewStage
            entries={entries}
            cards={cards}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            onRetry={() => {}}
            onSaveAll={() => {
              void handleSaveAll();
            }}
            saving={saving}
            error={globalError}
            totalEstimate={totalEstimate}
            recognizedCount={recognizedCount}
            failedCount={failedCount}
            batchTags={batchTags}
            onBatchTagsChange={setBatchTags}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.backgroundCardSolid,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  reviewBtnDisabled: { opacity: 0.4 },
  reviewBtnText: { color: colors.primaryAccent, fontWeight: '700', fontSize: 13 },
  pressed: { opacity: 0.85 },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  tabBtnActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  tabLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabLabelActive: { color: colors.primaryAccent },
  searchTabScroll: { flexGrow: 1 },
  searchSection: { paddingHorizontal: 16, zIndex: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  suggestions: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionPressed: { backgroundColor: colors.primarySoft },
  suggestionText: { flex: 1, fontSize: 14, color: colors.text },
  searchEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 60,
    minHeight: 220,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  pasteScroll: { paddingHorizontal: 16, gap: 12 },
  pasteHint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  pasteFormatBox: {
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 3,
  },
  pasteFormatLine: { fontSize: 12, color: colors.textSubtle, fontFamily: 'monospace' },
  pasteInput: {
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  importBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  importBtnDisabled: { opacity: 0.5 },
  importBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  importBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: radius.md,
    padding: 12,
  },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  queueSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  queueSummaryText: { fontSize: 13, color: colors.text, fontWeight: '600', flex: 1 },
  reviewNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewNowText: { fontSize: 13, fontWeight: '700', color: colors.primaryAccent },
});

export default AddCardsScreen;
