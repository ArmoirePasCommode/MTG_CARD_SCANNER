import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { addCard, deleteCard, getCards } from '../services/api';
import { fetchCardByName, processCardRecognition } from '../services/scryfallService';

const CollectionContext = createContext({
  cards: [],
  loading: false,
  error: null,
  fetchCards: async () => {},
  addCardToCollection: async () => {},
  removeCard: async () => {},
  recognizeCard: async () => {},
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

  /**
   * OCR an image or lookup by name via Scryfall — does NOT save to collection
   * and does NOT touch shared loading/error state (it's a read-only lookup).
   * Callers are responsible for managing their own loading and error UI.
   */
  const recognizeCard = useCallback(async ({ imageUri, cardName }) => {
    const card = cardName
      ? await fetchCardByName(cardName, true)
      : await processCardRecognition({ imageUri });
    if (!card) throw new Error('Card not found');
    return card;
  }, []);

  /**
   * Recognize a card and save it as one atomic operation with a single,
   * uninterrupted loading state. Calls the API directly instead of delegating
   * to addCardToCollection to avoid a loading=false gap between the two phases.
   */
  const recognizeAndSaveCard = useCallback(
    async ({ imageUri, cardName }) => {
      setLoading(true);
      setError(null);
      try {
        const recognizedCard = await recognizeCard({ imageUri, cardName });
        const saved = await addCard(recognizedCard);
        setCards((prev) => [saved, ...prev]);
        return saved;
      } catch (err) {
        setError(err.message || 'Failed to recognize and save card');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [recognizeCard]
  );

  const value = useMemo(
    () => ({
      cards,
      loading,
      error,
      fetchCards,
      addCardToCollection,
      removeCard,
      recognizeCard,
      recognizeAndSaveCard
    }),
    [cards, loading, error, fetchCards, addCardToCollection, removeCard, recognizeCard, recognizeAndSaveCard]
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
};

export const useCollection = () => useContext(CollectionContext);

export default CollectionContext;

