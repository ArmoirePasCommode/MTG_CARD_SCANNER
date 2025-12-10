import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { addCard, deleteCard, getCards } from '../services/api';
import { processCardRecognition } from '../services/scryfallService';

const CollectionContext = createContext({
  cards: [],
  loading: false,
  error: null,
  fetchCards: async () => {},
  addCardToCollection: async () => {},
  removeCard: async () => {},
  recognizeAndSaveCard: async () => {}
});

export const CollectionProvider = ({ children }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCards();
      setCards(data);
    } catch (err) {
      setError(err.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCardToCollection = useCallback(async (cardPayload) => {
    setLoading(true);
    setError(null);
    try {
      const saved = await addCard(cardPayload);
      setCards((prev) => [saved, ...prev]);
      return saved;
    } catch (err) {
      setError(err.message || 'Failed to add card');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCard = useCallback(async (cardId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteCard(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (err) {
      setError(err.message || 'Failed to delete card');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const recognizeAndSaveCard = useCallback(
    async ({ imageUri, cardName }) => {
      setLoading(true);
      setError(null);
      try {
        const recognizedCard = await processCardRecognition({ imageUri, cardName });
        if (!recognizedCard) {
          throw new Error('Card not recognized');
        }
        const saved = await addCardToCollection(recognizedCard);
        return saved;
      } catch (err) {
        setError(err.message || 'Failed to recognize card');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addCardToCollection]
  );

  const value = useMemo(
    () => ({
      cards,
      loading,
      error,
      fetchCards,
      addCardToCollection,
      removeCard,
      recognizeAndSaveCard
    }),
    [cards, loading, error, fetchCards, addCardToCollection, removeCard, recognizeAndSaveCard]
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
};

export const useCollection = () => useContext(CollectionContext);

export default CollectionContext;

