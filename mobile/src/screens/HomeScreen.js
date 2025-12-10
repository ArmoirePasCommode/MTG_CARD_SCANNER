import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import CardItem from '../components/CardItem';
import PrimaryButton from '../components/PrimaryButton';
import { useCollection } from '../context/CollectionContext';

const HomeScreen = ({ navigation }) => {
  const { cards, fetchCards, loading, removeCard } = useCollection();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filtered = cards.filter((card) =>
    (card.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Collection</Text>
        <TextInput
          style={styles.search}
          placeholder="Search cards"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <PrimaryButton title="Scan a card" onPress={() => navigation.navigate('Scan')} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id || item.scryfallId}
        renderItem={({ item }) => (
          <CardItem
            card={item}
            onPress={() => navigation.navigate('CardDetails', { card: item })}
            onDelete={item.id ? () => removeCard(item.id) : undefined}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No cards yet. Try scanning one!</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchCards} tintColor="#7c3aed" />
        }
        contentContainerStyle={{ paddingBottom: 60 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16
  },
  header: {
    paddingVertical: 20
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827'
  },
  search: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  empty: {
    alignItems: 'center',
    marginTop: 100
  },
  emptyText: {
    color: '#6b7280'
  }
});

export default HomeScreen;

