import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import { useCollection } from '../context/CollectionContext';

const CardDetailsScreen = ({ route }) => {
  const { card } = route.params || {};
  const { addCardToCollection } = useCollection();

  if (!card) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.name}>No card selected</Text>
      </View>
    );
  }

  const handleSave = async () => {
    await addCardToCollection(card);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: card.imageUrl }} style={styles.image} />
      <Text style={styles.name}>{card.name}</Text>
      <Text style={styles.subtext}>Set: {card.setName}</Text>
      <Text style={styles.subtext}>Rarity: {card.rarity?.toUpperCase()}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type</Text>
        <Text style={styles.body}>{card.typeLine}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Oracle Text</Text>
        <Text style={styles.body}>{card.oracleText}</Text>
      </View>
      <PrimaryButton title="Add to collection" onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff'
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 20
  },
  name: {
    fontSize: 26,
    fontWeight: '700'
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6
  },
  body: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22
  }
});

export default CardDetailsScreen;

