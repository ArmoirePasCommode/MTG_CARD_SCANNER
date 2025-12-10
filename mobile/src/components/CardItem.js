import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const CardItem = ({ card, onPress, onDelete }) => {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: card.imageUrl || 'https://cards.scryfall.io/art_crop/front/9/3/93beef.jpg' }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{card.name}</Text>
        <Text style={styles.subtitle}>{card.setName}</Text>
        <Text style={styles.subtitle}>{card.typeLine || card.oracleText}</Text>
        <View style={styles.actions}>
          <Text style={styles.tag}>{card.rarity?.toUpperCase()}</Text>
          {onDelete ? (
            <Pressable style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  image: {
    width: 80,
    height: 110,
    borderRadius: 10,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111'
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'space-between'
  },
  tag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '600'
  }
});

export default CardItem;

