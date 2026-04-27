/**
 * Shared review-and-save UI used by BulkScanScreen and AddCardsScreen.
 *
 * Exports:
 *   STATUS          — entry status constants
 *   newId           — unique id generator
 *   ReviewStage     — full review list with summary header, tags selector and save bar
 *   RecognizedRow   — row for a successfully identified card
 *   PendingRow      — row for a card still being resolved
 *   FailedRow       — row for a card that failed to resolve
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FoilToggle from './FoilToggle';
import PrimaryButton from './PrimaryButton';
import QuantityStepper from './QuantityStepper';
import TagPicker from './TagPicker';
import { colors, getRarityColor, radius } from '../theme';
import { formatUsd, getDisplayPrice } from '../utils/format';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STATUS = {
  PENDING: 'pending',
  RECOGNIZED: 'recognized',
  FAILED: 'failed',
};

let _idCounter = 0;
export const newId = () => `entry-${Date.now()}-${++_idCounter}`;

export const findExistingByScryfallId = (cards, scryfallId) =>
  scryfallId ? cards.find((c) => c.scryfallId === scryfallId) : null;

// ---------------------------------------------------------------------------
// ReviewStage
// ---------------------------------------------------------------------------

/**
 * Props:
 *   entries           Entry[]
 *   cards             Card[]          user's existing collection (for merge detection)
 *   onUpdate          (id, patch) => void
 *   onRemove          (id) => void
 *   onRetry           (entry) => void
 *   onSaveAll         () => void
 *   saving            boolean
 *   error             string | null
 *   totalEstimate     number
 *   recognizedCount   number
 *   failedCount       number
 *   batchTags         string[]        tags to assign to all saved entries
 *   onBatchTagsChange (tags) => void
 */
export const ReviewStage = ({
  entries,
  cards,
  onUpdate,
  onRemove,
  onRetry,
  onSaveAll,
  saving,
  error,
  totalEstimate,
  recognizedCount,
  failedCount,
  batchTags = [],
  onBatchTagsChange,
}) => {
  const sections = useMemo(() => {
    const recognized = entries.filter((e) => e.status === STATUS.RECOGNIZED);
    const pending = entries.filter((e) => e.status === STATUS.PENDING);
    const failed = entries.filter((e) => e.status === STATUS.FAILED);
    return { recognized, pending, failed };
  }, [entries]);

  return (
    <View style={styles.flex}>
      <FlatList
        data={[
          ...sections.pending.map((e) => ({ ...e, _kind: 'pending' })),
          ...sections.recognized.map((e) => ({ ...e, _kind: 'recognized' })),
          ...sections.failed.map((e) => ({ ...e, _kind: 'failed' })),
        ]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.reviewListContent}
        ListHeaderComponent={
          <View>
            <View style={styles.reviewSummary}>
              <View style={styles.reviewSummaryRow}>
                <Text style={styles.reviewSummaryLabel}>Ready to save</Text>
                <Text style={styles.reviewSummaryValue}>{recognizedCount}</Text>
              </View>
              {failedCount > 0 ? (
                <View style={styles.reviewSummaryRow}>
                  <Text style={styles.reviewSummaryLabel}>Failed</Text>
                  <Text style={[styles.reviewSummaryValue, { color: colors.danger }]}>
                    {failedCount}
                  </Text>
                </View>
              ) : null}
              {totalEstimate > 0 ? (
                <View style={styles.reviewSummaryRow}>
                  <Text style={styles.reviewSummaryLabel}>Estimated value</Text>
                  <Text style={[styles.reviewSummaryValue, { color: colors.success }]}>
                    {formatUsd(totalEstimate)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Batch tags selector */}
            {onBatchTagsChange ? (
              <View style={styles.batchTagsCard}>
                <Text style={styles.batchTagsLabel}>Add all to collection</Text>
                <Text style={styles.batchTagsHint}>
                  These tags will be applied to every card you save.
                </Text>
                <View style={styles.batchTagsRow}>
                  <TagPicker tags={batchTags} onChange={onBatchTagsChange} />
                </View>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          if (item._kind === 'recognized') {
            const existing = findExistingByScryfallId(cards, item.card?.scryfallId);
            const willMerge = existing && item.isFoil === (existing.isFoil === true);
            return (
              <RecognizedRow
                entry={item}
                onUpdate={onUpdate}
                onRemove={onRemove}
                willMerge={willMerge}
                existingQty={existing?.quantity}
              />
            );
          }
          if (item._kind === 'pending') {
            return <PendingRow entry={item} onRemove={onRemove} />;
          }
          return <FailedRow entry={item} onRetry={onRetry} onRemove={onRemove} />;
        }}
      />
      {error ? (
        <View style={[styles.errorBanner, { marginHorizontal: 20, marginBottom: 8 }]}>
          <Ionicons name="alert-circle" size={16} color="#fca5a5" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={
            recognizedCount === 0
              ? 'Nothing to save'
              : `Save ${recognizedCount} card${recognizedCount === 1 ? '' : 's'}`
          }
          onPress={onSaveAll}
          loading={saving}
          disabled={recognizedCount === 0}
          icon="cloud-upload-outline"
          size="lg"
        />
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Row components
// ---------------------------------------------------------------------------

export const RecognizedRow = ({ entry, onUpdate, onRemove, willMerge, existingQty }) => {
  const card = entry.card;
  const rarity = getRarityColor(card.rarity);
  const price = getDisplayPrice({ ...card, isFoil: entry.isFoil });
  return (
    <View style={rowStyles.container}>
      <View style={[rowStyles.stripe, { backgroundColor: rarity.fg }]} />
      <Image source={{ uri: card.imageUrl || entry.uri }} style={rowStyles.img} />
      <View style={rowStyles.body}>
        <View style={rowStyles.headerRow}>
          <Text style={rowStyles.name} numberOfLines={1}>
            {card.name}
          </Text>
          <Pressable
            onPress={() => onRemove(entry.id)}
            hitSlop={6}
            style={({ pressed }) => [rowStyles.iconBtn, pressed && rowStyles.iconBtnPressed]}
          >
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
        <Text style={rowStyles.meta} numberOfLines={1}>
          {card.setName || card.edition || '—'}
          {card.collectorNumber ? ` · #${card.collectorNumber}` : ''}
        </Text>
        {entry.mergedFromBatch ? (
          <View style={rowStyles.mergedBadge}>
            <Ionicons name="git-merge-outline" size={11} color={colors.primaryAccent} />
            <Text style={rowStyles.mergedText}>Merged duplicate</Text>
          </View>
        ) : null}
        {willMerge ? (
          <View style={rowStyles.mergeHint}>
            <Ionicons name="layers-outline" size={11} color={colors.warning} />
            <Text style={rowStyles.mergeHintText}>
              Will increment existing copy
              {existingQty ? ` (${existingQty} → ${existingQty + entry.quantity})` : ''}
            </Text>
          </View>
        ) : null}
        <View style={rowStyles.controls}>
          <QuantityStepper
            value={entry.quantity}
            onChange={(q) => onUpdate(entry.id, { quantity: q })}
          />
          <FoilToggle
            value={entry.isFoil}
            onChange={(v) => onUpdate(entry.id, { isFoil: v })}
          />
          {price !== null && price !== undefined ? (
            <Text style={rowStyles.price}>{formatUsd(price * entry.quantity)}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export const PendingRow = ({ entry, onRemove }) => (
  <View style={rowStyles.containerMuted}>
    {entry.uri ? (
      <Image source={{ uri: entry.uri }} style={rowStyles.img} />
    ) : (
      <View style={[rowStyles.img, rowStyles.imgPlaceholder]}>
        <Ionicons name="help-outline" size={20} color={colors.textMuted} />
      </View>
    )}
    <View style={rowStyles.body}>
      <View style={rowStyles.headerRow}>
        <View style={rowStyles.pendingTitleWrap}>
          <ActivityIndicator size="small" color={colors.primaryAccent} />
          <Text style={rowStyles.pendingText}>
            {entry.name ? `Looking up "${entry.name}"…` : 'Identifying card…'}
          </Text>
        </View>
        <Pressable
          onPress={() => onRemove(entry.id)}
          hitSlop={6}
          style={({ pressed }) => [rowStyles.iconBtn, pressed && rowStyles.iconBtnPressed]}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  </View>
);

export const FailedRow = ({ entry, onRetry, onRemove }) => (
  <View style={rowStyles.containerFailed}>
    {entry.uri ? (
      <Image source={{ uri: entry.uri }} style={rowStyles.img} />
    ) : (
      <View style={[rowStyles.img, rowStyles.imgPlaceholder]}>
        <Ionicons name="alert-outline" size={20} color={colors.danger} />
      </View>
    )}
    <View style={rowStyles.body}>
      <View style={rowStyles.headerRow}>
        <View style={rowStyles.failedTitleWrap}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={rowStyles.failedText}>
            {entry.name ? `"${entry.name}" not found` : "Couldn't identify"}
          </Text>
        </View>
        <Pressable
          onPress={() => onRemove(entry.id)}
          hitSlop={6}
          style={({ pressed }) => [rowStyles.iconBtn, pressed && rowStyles.iconBtnPressed]}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <Text style={rowStyles.failedDetail} numberOfLines={2}>
        {entry.error || 'Try a clearer photo or check the spelling.'}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={() => onRetry(entry)}
          style={({ pressed }) => [rowStyles.retryBtn, pressed && rowStyles.iconBtnPressed]}
        >
          <Ionicons name="refresh" size={14} color={colors.primaryAccent} />
          <Text style={rowStyles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: { flex: 1 },
  reviewListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  reviewSummary: {
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginVertical: 8,
    gap: 6,
  },
  reviewSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewSummaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  reviewSummaryValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
  batchTagsCard: {
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  batchTagsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  batchTagsHint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  batchTagsRow: {
    marginTop: 4,
  },
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
    marginVertical: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 6,
    overflow: 'hidden',
  },
  containerMuted: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 6,
    padding: 10,
    gap: 10,
    opacity: 0.85,
  },
  containerFailed: {
    flexDirection: 'row',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginVertical: 6,
    padding: 10,
    gap: 10,
  },
  stripe: {
    width: 3,
  },
  img: {
    width: 64,
    height: 90,
    borderRadius: radius.sm,
    margin: 10,
    backgroundColor: '#000',
  },
  imgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCardSolid,
  },
  body: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  meta: {
    fontSize: 11,
    color: colors.textSubtle,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 'auto',
  },
  iconBtn: {
    padding: 4,
    borderRadius: radius.sm,
  },
  iconBtnPressed: {
    backgroundColor: colors.primarySoft,
  },
  pendingTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pendingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  failedTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  failedText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  failedDetail: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    marginTop: 6,
  },
  retryText: {
    color: colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  mergedBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.4)',
  },
  mergedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  mergeHint: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  mergeHintText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fbbf24',
  },
});
