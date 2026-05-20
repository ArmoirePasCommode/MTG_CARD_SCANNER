import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import PrimaryButton from '../components/PrimaryButton';
import LiveCameraView from '../components/LiveCameraView';
import {
  STATUS,
  newId,
  findExistingByScryfallId,
  ReviewStage,
  type ReviewEntry,
} from '../components/BulkReview';
import { useCollection } from '../context/CollectionContext';
import { colors, gradients, radius } from '../theme';
import type { NewCard } from '../types/api';
import type { BulkScanScreenProps } from '../navigation/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type Stage = 'capture' | 'review';

interface SummaryPillProps {
  label: string;
  value: number;
  color: string;
  icon: IoniconName;
}

const SummaryPill = ({ label, value, color, icon }: SummaryPillProps): React.JSX.Element => (
  <View style={summaryStyles.pill}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={[summaryStyles.value, { color }]}>{value}</Text>
    <Text style={summaryStyles.label}>{label}</Text>
  </View>
);

interface ThumbnailItemProps {
  entry: ReviewEntry;
  onPress: () => void;
  onRemove: () => void;
}

const ThumbnailItem = ({ entry, onPress, onRemove }: ThumbnailItemProps): React.JSX.Element => (
  <Pressable onPress={onPress} style={thumbStyles.wrap}>
    <Image
      source={{ uri: entry.uri ?? entry.card?.imageUrl ?? undefined }}
      style={thumbStyles.img}
    />
    <View style={thumbStyles.statusOverlay}>
      {entry.status === STATUS.PENDING ? (
        <View style={thumbStyles.dotPending}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : entry.status === STATUS.RECOGNIZED ? (
        <View style={[thumbStyles.dot, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
      ) : (
        <View style={[thumbStyles.dot, { backgroundColor: colors.danger }]}>
          <Ionicons name="alert" size={12} color="#fff" />
        </View>
      )}
    </View>
    {entry.status === STATUS.RECOGNIZED && entry.card ? (
      <Text style={thumbStyles.name} numberOfLines={1}>
        {entry.card.name}
      </Text>
    ) : entry.status === STATUS.FAILED ? (
      <Text style={[thumbStyles.name, { color: colors.danger }]} numberOfLines={1}>
        Tap to retry
      </Text>
    ) : (
      <Text style={[thumbStyles.name, { color: colors.textMuted }]} numberOfLines={1}>
        Identifying…
      </Text>
    )}
    <Pressable onPress={onRemove} style={thumbStyles.removeBtn} hitSlop={6}>
      <Ionicons name="close" size={12} color="#fff" />
    </Pressable>
  </Pressable>
);

interface CaptureStageProps {
  entries: ReviewEntry[];
  onCardRecognized: (card: NewCard) => void;
  isActive: boolean;
  onOpenReview: () => void;
  onRetry: (entry: ReviewEntry) => void;
  onRemove: (id: string) => void;
  recognizedCount: number;
  pendingCount: number;
  failedCount: number;
  error: string | null;
}

const CaptureStage = ({
  entries,
  onCardRecognized,
  isActive,
  onOpenReview,
  onRetry,
  onRemove,
  recognizedCount,
  pendingCount,
  failedCount,
  error,
}: CaptureStageProps): React.JSX.Element => (
  <View style={styles.flex}>
    <ScrollView contentContainerStyle={styles.captureScroll}>
      <Text style={styles.captureSubtitle}>
        Point the camera at each card — it scans automatically.
      </Text>

      <LiveCameraView
        style={styles.liveCameraBulk}
        mode="bulk"
        isActive={isActive}
        onCardRecognized={onCardRecognized}
      />

      {entries.length > 0 ? (
        <View style={styles.summaryRow}>
          <SummaryPill
            label="Identified"
            value={recognizedCount}
            color={colors.success}
            icon="checkmark-circle"
          />
          <SummaryPill
            label="Pending"
            value={pendingCount}
            color={colors.primaryAccent}
            icon="hourglass"
          />
          <SummaryPill
            label="Failed"
            value={failedCount}
            color={colors.danger}
            icon="alert-circle"
          />
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#fca5a5" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {entries.length > 0 ? (
        <View style={styles.thumbStripWrap}>
          <Text style={styles.sectionLabel}>Queue</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
          >
            {entries.map((entry) => (
              <ThumbnailItem
                key={entry.id}
                entry={entry}
                onPress={() => {
                  if (entry.status === STATUS.FAILED) onRetry(entry);
                }}
                onRemove={() => onRemove(entry.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.emptyHint}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.emptyHintText}>
            Recognized cards will appear here as you scan them.
          </Text>
        </View>
      )}
    </ScrollView>

    {entries.length > 0 ? (
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={`Review & Save (${entries.length})`}
          onPress={onOpenReview}
          icon="list-outline"
          size="lg"
        />
      </View>
    ) : null}
  </View>
);

const BulkScanScreen = ({ navigation }: BulkScanScreenProps): React.JSX.Element => {
  const { cards, bulkAddToCollection, updateCardInCollection } = useCollection();
  const isFocused = useIsFocused();

  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [stage, setStage] = useState<Stage>('capture');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [batchTags, setBatchTags] = useState<string[]>([]);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const updateEntry = useCallback((id: string, patch: Partial<ReviewEntry>): void => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }, []);

  const removeEntry = useCallback((id: string): void => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const handleCardRecognized = useCallback((card: NewCard): void => {
    setGlobalError(null);
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
          e.id === existing.id
            ? { ...e, quantity: (e.quantity || 1) + 1, mergedFromBatch: true }
            : e
        );
      }

      return [
        ...prev,
        {
          id: newId(),
          uri: null,
          status: STATUS.RECOGNIZED,
          card,
          quantity: 1,
          isFoil: false,
          error: null,
        },
      ];
    });
  }, []);

  const handleRetry = useCallback(
    (entry: ReviewEntry): void => {
      updateEntry(entry.id, {
        status: STATUS.FAILED,
        error: 'Manual retry not available in live scan mode.',
      });
    },
    [updateEntry]
  );

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
      const newCardsPayload: import('../types/api').NewCard[] = [];
      const updates: Array<{ id: string; patch: import('../types/api').CardUpdate }> = [];

      recognized.forEach((entry) => {
        const existing = findExistingByScryfallId(cards, entry.card?.scryfallId);
        if (existing && entry.isFoil === (existing.isFoil === true)) {
          const mergedTags = Array.from(new Set([...(existing.tags ?? []), ...batchTags]));
          updates.push({
            id: existing.id,
            patch: { quantity: (existing.quantity || 1) + (entry.quantity || 1), tags: mergedTags },
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
  }, [entries, cards, bulkAddToCollection, updateCardInCollection, navigation, batchTags]);

  const handleExit = useCallback((): void => {
    if (entries.length === 0) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Discard scans?',
      `You have ${entries.length} scanned card${entries.length === 1 ? '' : 's'} in your queue. They will be lost.`,
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  }, [entries.length, navigation]);

  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (entriesRef.current.length === 0 || saving) return;
      e.preventDefault();
      Alert.alert(
        'Discard scans?',
        `You have ${entriesRef.current.length} scanned card${entriesRef.current.length === 1 ? '' : 's'} in your queue. They will be lost.`,
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
  }, [navigation, saving]);

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
          <Text style={styles.title}>{stage === 'capture' ? 'Bulk Scan' : 'Review & Save'}</Text>
          {stage === 'capture' ? (
            <Pressable
              onPress={() => {
                if (entries.length) setStage('review');
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
              onPress={() => setStage('capture')}
              style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}
              hitSlop={6}
            >
              <Ionicons name="add" size={18} color={colors.primaryAccent} />
              <Text style={styles.reviewBtnText}>Add more</Text>
            </Pressable>
          )}
        </View>

        {stage === 'capture' ? (
          <CaptureStage
            entries={entries}
            onCardRecognized={handleCardRecognized}
            isActive={isFocused}
            onOpenReview={() => {
              if (entries.length) setStage('review');
            }}
            onRetry={handleRetry}
            onRemove={removeEntry}
            recognizedCount={recognizedCount}
            pendingCount={pendingCount}
            failedCount={failedCount}
            error={globalError}
          />
        ) : (
          <ReviewStage
            entries={entries}
            cards={cards}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            onRetry={handleRetry}
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

const summaryStyles = StyleSheet.create({
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
});

const thumbStyles = StyleSheet.create({
  wrap: { width: 84, marginRight: 10 },
  img: { width: 84, height: 116, borderRadius: radius.md, backgroundColor: '#000' },
  statusOverlay: { position: 'absolute', top: 6, left: 6 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  dotPending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  name: { marginTop: 6, fontSize: 11, fontWeight: '600', color: colors.text },
});

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
  captureScroll: { paddingHorizontal: 20, paddingBottom: 100 },
  captureSubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  liveCameraBulk: { height: 320, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 22, marginBottom: 14 },
  thumbStripWrap: { marginTop: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  thumbStrip: { paddingRight: 16 },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 22,
  },
  emptyHintText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 16 },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'rgba(15,10,31,0.95)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
});

export default BulkScanScreen;
