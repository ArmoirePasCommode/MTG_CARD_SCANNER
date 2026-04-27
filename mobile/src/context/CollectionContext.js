import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  addCard,
  bulkAddCards,
  deleteCard,
  getCards,
  updateCard,
  tagCards as apiTagCards,
  renameTag as apiRenameTag,
  deleteTag as apiDeleteTag,
} from '../services/api';
import { fetchCardByName, processCardRecognition } from '../services/scryfallService';

const CollectionContext = createContext({
  cards: [],
  loading: false,
  error: null,
  activeTag: null,
  setActiveTag: () => {},
  tagsList: [],
  fetchCards: async () => {},
  addCardToCollection: async () => {},
  updateCardInCollection: async () => {},
  bulkAddToCollection: async () => {},
  removeCard: async () => {},
  recognizeCard: async () => {},
  recognizeAndSaveCard: async () => {},
  applyTagToCards: async () => {},
  removeTagFromCards: async () => {},
  renameTagEverywhere: async () => {},
  deleteTagEverywhere: async () => {},
});

export const CollectionProvider = ({ children }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTag, setActiveTag] = useState(null);

  // Derived tag list — stays in sync with local card mutations, no extra fetch needed
  const tagsList = useMemo(() => {
    const counts = new Map();
    cards.forEach((card) => {
      if (Array.isArray(card.tags)) {
        card.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
      }
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [cards]);

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

  const addCardToCollection = useCallback(async (cardPayload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...cardPayload,
        ...(options.quantity !== undefined ? { quantity: options.quantity } : {}),
        ...(options.isFoil !== undefined ? { isFoil: options.isFoil } : {}),
      };
      const saved = await addCard(payload);
      setCards((prev) => [saved, ...prev]);
      return saved;
    } catch (err) {
      setError(err.message || 'Failed to add card');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCardInCollection = useCallback(async (cardId, patch) => {
    setError(null);
    try {
      const updated = await updateCard(cardId, patch);
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updated } : c)));
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to update card');
      throw err;
    }
  }, []);

  const bulkAddToCollection = useCallback(async (cardsPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bulkAddCards(cardsPayload);
      const saved = result?.saved || [];
      setCards((prev) => [...saved, ...prev]);
      return saved;
    } catch (err) {
      setError(err.message || 'Failed to save cards');
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

  /** Add a tag to a set of cards by id */
  const applyTagToCards = useCallback(async (cardIds, tag) => {
    if (!tag || cardIds.length === 0) return;
    await apiTagCards({ cardIds, add: [tag] });
    const norm = tag.trim().toLowerCase();
    setCards((prev) =>
      prev.map((c) =>
        cardIds.includes(c.id)
          ? { ...c, tags: Array.from(new Set([...(c.tags || []), norm])) }
          : c
      )
    );
  }, []);

  /** Remove a tag from a set of cards by id */
  const removeTagFromCards = useCallback(async (cardIds, tag) => {
    if (!tag || cardIds.length === 0) return;
    await apiTagCards({ cardIds, remove: [tag] });
    const norm = tag.trim().toLowerCase();
    setCards((prev) =>
      prev.map((c) =>
        cardIds.includes(c.id)
          ? { ...c, tags: (c.tags || []).filter((t) => t !== norm) }
          : c
      )
    );
  }, []);

  /** Rename a tag on every card that has it */
  const renameTagEverywhere = useCallback(async (from, to) => {
    if (!from || !to || from === to) return;
    await apiRenameTag(from, to);
    const normFrom = from.trim().toLowerCase();
    const normTo = to.trim().toLowerCase();
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        tags: Array.from(
          new Set((c.tags || []).map((t) => (t === normFrom ? normTo : t)))
        ),
      }))
    );
    // If the renamed tag was active, follow it
    setActiveTag((prev) => (prev === normFrom ? normTo : prev));
  }, []);

  /** Delete a tag from every card */
  const deleteTagEverywhere = useCallback(async (name) => {
    if (!name) return;
    await apiDeleteTag(name);
    const norm = name.trim().toLowerCase();
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        tags: (c.tags || []).filter((t) => t !== norm),
      }))
    );
    setActiveTag((prev) => (prev === norm ? null : prev));
  }, []);

  const value = useMemo(
    () => ({
      cards,
      loading,
      error,
      activeTag,
      setActiveTag,
      tagsList,
      fetchCards,
      addCardToCollection,
      updateCardInCollection,
      bulkAddToCollection,
      removeCard,
      recognizeCard,
      recognizeAndSaveCard,
      applyTagToCards,
      removeTagFromCards,
      renameTagEverywhere,
      deleteTagEverywhere,
    }),
    [
      cards,
      loading,
      error,
      activeTag,
      tagsList,
      fetchCards,
      addCardToCollection,
      updateCardInCollection,
      bulkAddToCollection,
      removeCard,
      recognizeCard,
      recognizeAndSaveCard,
      applyTagToCards,
      removeTagFromCards,
      renameTagEverywhere,
      deleteTagEverywhere,
    ]
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
};

export const useCollection = () => useContext(CollectionContext);

export default CollectionContext;
