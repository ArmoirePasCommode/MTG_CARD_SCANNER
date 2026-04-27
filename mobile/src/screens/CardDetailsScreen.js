import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import { useCollection } from '../context/CollectionContext';

const CardDetailsScreen = ({ route, navigation }) => {
  const { card, fromScan } = route.params || {};
  const { addCardToCollection } = useCollection();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  if (!card) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.name}>No card selected</Text>
      </View>
    );
  }

  const handleAddToCollection = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await addCardToCollection(card);
      setSaved(true);
    } catch (err) {
      setSaveError(err.message || 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {card.imageUrl ? (
        <Image source={{ uri: card.imageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No image available</Text>
        </View>
      )}

      <Text style={styles.name}>{card.name}</Text>
      {card.manaCost ? <Text style={styles.manaCost}>{card.manaCost}</Text> : null}
      <Text style={styles.subtext}>Set: {card.setName ?? card.edition ?? '—'}</Text>
      <Text style={styles.subtext}>Rarity: {card.rarity ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) : '—'}</Text>

      {card.typeLine ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type</Text>
          <Text style={styles.body}>{card.typeLine}</Text>
        </View>
      ) : null}

      {card.oracleText ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oracle Text</Text>
          <Text style={styles.body}>{card.oracleText}</Text>
        </View>
      ) : null}

      {card.colors?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors</Text>
          <Text style={styles.body}>{card.colors.join(', ')}</Text>
        </View>
      ) : null}

      {/* Add to collection — only shown for cards coming from the scan flow */}
      {fromScan && (
        <View style={styles.actionArea}>
          {saved ? (
            <View style={styles.savedBanner}>
              <Text style={styles.savedIcon}>✓</Text>
              <Text style={styles.savedText}>Added to your collection!</Text>
            </View>
          ) : (
            <>
              <PrimaryButton
                title="Add to Collection"
                onPress={handleAddToCollection}
                loading={saving}
                disabled={saving}
              />
              {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 40
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#f3f4f6'
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imagePlaceholderText: {
    color: '#9ca3af',
    fontSize: 14
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827'
  },
  manaCost: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2
  },
  subtext: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 4
  },
  section: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  body: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22
  },
  actionArea: {
    marginTop: 32
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16
  },
  savedIcon: {
    fontSize: 22,
    color: '#059669'
  },
  savedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46'
  },
  error: {
    color: '#dc2626',
    marginTop: 8,
    fontSize: 14
  }
});

export default CardDetailsScreen;
