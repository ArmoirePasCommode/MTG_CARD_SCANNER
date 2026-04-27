import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, getRarityColor, radius } from '../theme';
import { formatUsd, getDisplayPrice } from '../utils/format';

const PLACEHOLDER_URI = 'https://cards.scryfall.io/art_crop/front/9/3/93beef.jpg';
const FOIL_GRADIENT = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f472b6'];

const formatRarity = (rarity) => {
  if (!rarity) return 'COMMON';
  return String(rarity).toUpperCase();
};

const CardItem = ({ card, onPress, onDelete }) => {
  const rarity = getRarityColor(card.rarity);
  const isFoil = card.isFoil === true;
  const quantity = Math.max(1, card.quantity || 1);
  const price = getDisplayPrice(card);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isFoil && styles.containerFoil,
        pressed && styles.pressed,
      ]}
    >
      {isFoil ? (
        <LinearGradient
          colors={FOIL_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.foilStripe}
        />
      ) : (
        <View style={[styles.rarityStripe, { backgroundColor: rarity.fg }]} />
      )}

      <View style={styles.imageWrap}>
        <Image
          source={{ uri: card.imageUrl || PLACEHOLDER_URI }}
          style={styles.image}
        />
        {quantity > 1 ? (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyBadgeText}>×{quantity}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {card.name}
          </Text>
          {card.manaCost ? (
            <Text style={styles.manaCost} numberOfLines={1}>
              {card.manaCost}
            </Text>
          ) : null}
        </View>
        {card.typeLine ? (
          <Text style={styles.typeLine} numberOfLines={1}>
            {card.typeLine}
          </Text>
        ) : null}
        <Text style={styles.setName} numberOfLines={1}>
          {card.setName || card.edition || 'Unknown set'}
          {card.collectorNumber ? ` · #${card.collectorNumber}` : ''}
        </Text>
        <View style={styles.footer}>
          <View style={styles.badgeRow}>
            <View style={[styles.rarityBadge, { backgroundColor: rarity.bg }]}>
              <Text style={[styles.rarityText, { color: rarity.fg }]}>
                {formatRarity(card.rarity)}
              </Text>
            </View>
            {isFoil ? (
              <View style={styles.foilBadge}>
                <Ionicons name="sparkles" size={10} color="#a78bfa" />
                <Text style={styles.foilBadgeText}>FOIL</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.footerRight}>
            {price !== null && price !== undefined ? (
              <Text style={styles.price}>{formatUsd(price)}</Text>
            ) : null}
            {onDelete ? (
              <Pressable
                hitSlop={8}
                onPress={onDelete}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && styles.deleteBtnPressed,
                ]}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCardSolid,
    borderRadius: radius.lg,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerFoil: {
    borderColor: 'rgba(167,139,250,0.45)',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  rarityStripe: {
    width: 3,
  },
  foilStripe: {
    width: 3,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: 70,
    height: 100,
    borderRadius: radius.sm,
    margin: 10,
    backgroundColor: '#000',
  },
  qtyBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 26,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  qtyBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  manaCost: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  typeLine: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  setName: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  foilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(167,139,250,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.4)',
  },
  foilBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#c4b5fd',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
  deleteBtnPressed: {
    backgroundColor: colors.dangerSoft,
  },
});

export default CardItem;
