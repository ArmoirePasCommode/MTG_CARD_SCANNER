import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import FoilToggle from '../components/FoilToggle';
import PrimaryButton from '../components/PrimaryButton';
import QuantityStepper from '../components/QuantityStepper';
import TagPicker from '../components/TagPicker';
import { useCollection } from '../context/CollectionContext';
import { colors, getRarityColor, gradients, radius } from '../theme';
import { formatEur, formatUsd } from '../utils/format';
import type { CardDetailsScreenProps } from '../navigation/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const formatRarity = (rarity: string | null | undefined): string => {
  if (!rarity) return 'Common';
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};

interface MetaItemProps {
  icon: IoniconName;
  label: string;
  value: string;
}

const MetaItem = ({ icon, label, value }: MetaItemProps): React.JSX.Element => (
  <View style={metaStyles.item}>
    <Ionicons name={icon} size={14} color={colors.textMuted} />
    <View style={metaStyles.text}>
      <Text style={metaStyles.label}>{label}</Text>
      <Text style={metaStyles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const CardDetailsScreen = ({ route, navigation }: CardDetailsScreenProps): React.JSX.Element => {
  const { card, fromScan } = route.params ?? {};
  const { addCardToCollection, updateCardInCollection } = useCollection();

  const isInCollection = !fromScan && Boolean((card as { id?: string } | undefined)?.id);

  const cardRouteKey = useMemo(() => {
    if (!card) return '';
    const c = card as { id?: string; scryfallId?: string | null; name?: string };
    if (c.id) return `id:${c.id}`;
    return `lookup:${String(c.scryfallId ?? '')}::${String(c.name ?? '')}`;
  }, [(card as { id?: string } | undefined)?.id, card?.scryfallId, card?.name]);

  const [quantity, setQuantity] = useState(
    Math.max(1, (card as { quantity?: number } | undefined)?.quantity ?? 1)
  );
  const [isFoil, setIsFoil] = useState((card as { isFoil?: boolean } | undefined)?.isFoil === true);
  const [tags, setTags] = useState<string[]>(
    Array.isArray((card as { tags?: string[] } | undefined)?.tags)
      ? ([...(card as { tags: string[] }).tags] as string[])
      : []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSavedAt, setUpdateSavedAt] = useState<number | null>(null);

  const initialState = useRef({
    quantity: Math.max(1, (card as { quantity?: number } | undefined)?.quantity ?? 1),
    isFoil: (card as { isFoil?: boolean } | undefined)?.isFoil === true,
    tags: Array.isArray((card as { tags?: string[] } | undefined)?.tags)
      ? ([...(card as { tags: string[] }).tags] as string[])
      : ([] as string[]),
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!card || !cardRouteKey) return;
    const c = card as { quantity?: number; isFoil?: boolean; tags?: string[] };
    const q = Math.max(1, c.quantity ?? 1);
    const foil = c.isFoil === true;
    const nextTags = Array.isArray(c.tags) ? [...c.tags] : [];
    setQuantity(q);
    setIsFoil(foil);
    setTags(nextTags);
    initialState.current = { quantity: q, isFoil: foil, tags: nextTags };
    setSaving(false);
    setSaved(false);
    setSaveError(null);
    setUpdateError(null);
    setUpdateSavedAt(null);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, [cardRouteKey]);

  const dirty = useMemo(() => {
    if (!isInCollection) return false;
    const tagsChanged =
      tags.length !== initialState.current.tags.length ||
      tags.some((t) => !initialState.current.tags.includes(t));
    return (
      quantity !== initialState.current.quantity ||
      isFoil !== initialState.current.isFoil ||
      tagsChanged
    );
  }, [isInCollection, quantity, isFoil, tags]);

  useEffect(() => {
    if (!isInCollection || !dirty) return undefined;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const cardWithId = card as unknown as { id: string };
    debounceTimer.current = setTimeout(() => {
      void (async () => {
        try {
          setUpdateError(null);
          await updateCardInCollection(cardWithId.id, { quantity, isFoil, tags });
          initialState.current = { quantity, isFoil, tags: [...tags] };
          setUpdateSavedAt(Date.now());
        } catch (err: unknown) {
          setUpdateError(err instanceof Error ? err.message : 'Failed to save changes');
        }
      })();
    }, 450);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [isInCollection, dirty, quantity, isFoil, tags, card, updateCardInCollection]);

  if (!card) {
    return (
      <LinearGradient colors={gradients.background} style={styles.flex}>
        <SafeAreaView style={[styles.flex, styles.center]} edges={['top']}>
          <Text style={styles.title}>No card selected</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const rarity = getRarityColor(card.rarity);

  const handleAddToCollection = async (): Promise<void> => {
    setSaving(true);
    setSaveError(null);
    try {
      await addCardToCollection(card, { quantity, isFoil });
      setSaved(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const showFoilPrice = isFoil && card.priceUsdFoil != null;
  const primaryPrice = showFoilPrice ? card.priceUsdFoil : card.priceUsd;

  return (
    <LinearGradient colors={gradients.background} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={[styles.rarityPill, { backgroundColor: rarity.bg }]}>
              <Text style={[styles.rarityPillText, { color: rarity.fg }]}>
                {formatRarity(card.rarity)}
              </Text>
            </View>
          </View>

          <View style={styles.heroWrap}>
            <View style={[styles.heroGlow, { shadowColor: rarity.fg }]} />
            {card.imageUrl ? (
              <Image source={{ uri: card.imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]}>
                <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                <Text style={styles.heroPlaceholderText}>No image available</Text>
              </View>
            )}
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.cardName}>{card.name}</Text>
            {card.manaCost ? <Text style={styles.manaCost}>{card.manaCost}</Text> : null}
            {card.typeLine ? <Text style={styles.typeLine}>{card.typeLine}</Text> : null}
          </View>

          {primaryPrice != null ? (
            <View style={styles.priceCard}>
              <View style={styles.priceMain}>
                <Text style={styles.priceLabel}>{showFoilPrice ? 'USD (Foil)' : 'USD'}</Text>
                <Text style={styles.priceValue}>{formatUsd(primaryPrice)}</Text>
              </View>
              {card.priceEur != null ? (
                <>
                  <View style={styles.priceDivider} />
                  <View style={styles.priceMain}>
                    <Text style={styles.priceLabel}>EUR</Text>
                    <Text style={styles.priceValue}>{formatEur(card.priceEur)}</Text>
                  </View>
                </>
              ) : null}
              {!showFoilPrice && card.priceUsdFoil != null ? (
                <>
                  <View style={styles.priceDivider} />
                  <View style={styles.priceMain}>
                    <Text style={styles.priceLabel}>USD Foil</Text>
                    <Text style={styles.priceValue}>{formatUsd(card.priceUsdFoil)}</Text>
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <MetaItem
              icon="library-outline"
              label="Set"
              value={card.setName ?? card.edition ?? '—'}
            />
            {card.collectorNumber ? (
              <MetaItem icon="pricetag-outline" label="Number" value={`#${card.collectorNumber}`} />
            ) : null}
            {card.colors?.length ? (
              <MetaItem
                icon="color-palette-outline"
                label="Colors"
                value={card.colors.join(' / ')}
              />
            ) : null}
          </View>

          {card.oracleText ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Oracle Text</Text>
              <View style={styles.sectionBody}>
                <Text style={styles.body}>{card.oracleText}</Text>
              </View>
            </View>
          ) : null}

          {(fromScan ?? isInCollection) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {isInCollection ? 'Your copy' : 'Add options'}
              </Text>
              <View style={styles.controlsCard}>
                <View style={styles.controlRow}>
                  <View style={styles.controlText}>
                    <Text style={styles.controlLabel}>Quantity</Text>
                    <Text style={styles.controlHint}>How many copies you own</Text>
                  </View>
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                </View>
                <View style={styles.controlDivider} />
                <View style={styles.controlRow}>
                  <View style={styles.controlText}>
                    <Text style={styles.controlLabel}>Finish</Text>
                    <Text style={styles.controlHint}>Toggle if your copy is foil</Text>
                  </View>
                  <FoilToggle value={isFoil} onChange={setIsFoil} />
                </View>
                <View style={styles.controlDivider} />
                <View style={styles.controlRowTags}>
                  <View style={styles.controlText}>
                    <Text style={styles.controlLabel}>Collections</Text>
                    <Text style={styles.controlHint}>Assign to one or more binders</Text>
                  </View>
                  <TagPicker tags={tags} onChange={setTags} disabled={saving} />
                </View>
              </View>

              {isInCollection && updateError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color="#fca5a5" />
                  <Text style={styles.errorText}>{updateError}</Text>
                </View>
              ) : null}
              {isInCollection && updateSavedAt != null && !dirty && !updateError ? (
                <View style={styles.savedHint}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.savedHintText}>Changes saved</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {fromScan ? (
            <View style={styles.actionArea}>
              {saved ? (
                <View style={styles.savedBanner}>
                  <View style={styles.savedIconWrap}>
                    <Ionicons name="checkmark" size={20} color={colors.success} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.savedText}>Added to your collection!</Text>
                    <Text style={styles.savedSubtext}>
                      {quantity > 1 ? `${quantity}× ` : ''}
                      {card.name}
                      {isFoil ? ' (Foil)' : ''}
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  <PrimaryButton
                    title="Add to Collection"
                    onPress={() => {
                      void handleAddToCollection();
                    }}
                    loading={saving}
                    icon="add-circle-outline"
                    size="lg"
                  />
                  {saveError ? (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color="#fca5a5" />
                      <Text style={styles.errorText}>{saveError}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const metaStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: '45%' },
  text: { flex: 1 },
  label: { fontSize: 11, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { fontSize: 13, color: colors.text, fontWeight: '500', marginTop: 1 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 16,
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
  pressed: { opacity: 0.85 },
  rarityPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  rarityPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  heroWrap: { alignItems: 'center', marginVertical: 8 },
  heroGlow: {
    position: 'absolute',
    top: 20,
    width: 240,
    height: 320,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
    elevation: 20,
  },
  heroImage: { width: 260, height: 360, borderRadius: radius.xl, backgroundColor: '#000' },
  heroPlaceholder: {
    backgroundColor: colors.backgroundCardSolid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroPlaceholderText: { color: colors.textMuted, marginTop: 8, fontSize: 13 },
  title: { fontSize: 18, color: colors.text },
  titleSection: { alignItems: 'center', marginTop: 18, marginBottom: 16 },
  cardName: { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
  manaCost: {
    fontSize: 15,
    color: colors.primaryAccent,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  typeLine: { fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    marginBottom: 16,
  },
  priceMain: { flex: 1, alignItems: 'center' },
  priceLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priceValue: { fontSize: 18, color: colors.text, fontWeight: '700' },
  priceDivider: { width: 1, height: 28, backgroundColor: colors.border },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: colors.backgroundCardSolid,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionBody: {
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { fontSize: 14, color: colors.text, lineHeight: 22 },
  controlsCard: {
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  controlText: { flex: 1 },
  controlLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  controlHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  controlDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  controlRowTags: { paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  savedHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginLeft: 4 },
  savedHintText: { fontSize: 12, color: colors.textMuted },
  actionArea: { marginTop: 4 },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  savedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedText: { fontSize: 15, fontWeight: '600', color: colors.text },
  savedSubtext: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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

export default CardDetailsScreen;
