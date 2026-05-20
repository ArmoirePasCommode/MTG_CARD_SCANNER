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
import type { Card, CardUpdate, NewCard, TagInfo } from '../types/api';

export interface CollectionContextValue {
  cards: Card[];
  loading: boolean;
  error: string | null;
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  tagsList: TagInfo[];
  fetchCards: () => Promise<void>;
  addCardToCollection: (
    payload: NewCard,
    options?: { quantity?: number; isFoil?: boolean }
  ) => Promise<Card>;
  updateCardInCollection: (cardId: string, patch: CardUpdate) => Promise<Card>;
  bulkAddToCollection: (cards: NewCard[]) => Promise<Card[]>;
  removeCard: (cardId: string) => Promise<void>;
  recognizeCard: (opts: { imageUri?: string | null; cardName?: string | null }) => Promise<NewCard>;
  recognizeAndSaveCard: (opts: {
    imageUri?: string | null;
    cardName?: string | null;
  }) => Promise<Card>;
  applyTagToCards: (cardIds: string[], tag: string) => Promise<void>;
  removeTagFromCards: (cardIds: string[], tag: string) => Promise<void>;
  renameTagEverywhere: (from: string, to: string) => Promise<void>;
  deleteTagEverywhere: (name: string) => Promise<void>;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export const CollectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tagsList = useMemo<TagInfo[]>(() => {
    const counts = new Map<string, number>();
    cards.forEach((card) => {
      if (Array.isArray(card.tags)) {
        card.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
      }
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [cards]);

  const fetchCards = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCards();
      setCards(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCardToCollection = useCallback(
    async (
      cardPayload: NewCard,
      options: { quantity?: number; isFoil?: boolean } = {}
    ): Promise<Card> => {
      setLoading(true);
      setError(null);
      try {
        const payload: NewCard = {
          ...cardPayload,
          ...(options.quantity !== undefined ? { quantity: options.quantity } : {}),
          ...(options.isFoil !== undefined ? { isFoil: options.isFoil } : {}),
        };
        const saved = await addCard(payload);
        setCards((prev) => [saved, ...prev]);
        return saved;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to add card');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateCardInCollection = useCallback(
    async (cardId: string, patch: CardUpdate): Promise<Card> => {
      setError(null);
      try {
        const updated = await updateCard(cardId, patch);
        setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updated } : c)));
        return updated;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to update card');
        throw err;
      }
    },
    []
  );

  const bulkAddToCollection = useCallback(async (cardsPayload: NewCard[]): Promise<Card[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await bulkAddCards(cardsPayload);
      const saved = result?.saved ?? [];
      setCards((prev) => [...saved, ...prev]);
      return saved;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save cards');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCard = useCallback(async (cardId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await deleteCard(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete card');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * OCR an image or lookup by name via Scryfall — does NOT save to collection.
   * Callers are responsible for managing their own loading and error UI.
   */
  const recognizeCard = useCallback(
    async ({
      imageUri,
      cardName,
    }: {
      imageUri?: string | null;
      cardName?: string | null;
    }): Promise<NewCard> => {
      const card = cardName
        ? await fetchCardByName(cardName, true)
        : await processCardRecognition({ imageUri: imageUri ?? null });
      if (!card) throw new Error('Card not found');
      return card;
    },
    []
  );

  /**
   * Recognize a card and save it as one atomic operation with a single,
   * uninterrupted loading state.
   */
  const recognizeAndSaveCard = useCallback(
    async ({
      imageUri,
      cardName,
    }: {
      imageUri?: string | null;
      cardName?: string | null;
    }): Promise<Card> => {
      setLoading(true);
      setError(null);
      try {
        const recognizedCard = await recognizeCard({ imageUri, cardName });
        const saved = await addCard(recognizedCard);
        setCards((prev) => [saved, ...prev]);
        return saved;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to recognize and save card');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [recognizeCard]
  );

  const applyTagToCards = useCallback(async (cardIds: string[], tag: string): Promise<void> => {
    if (!tag || cardIds.length === 0) return;
    await apiTagCards({ cardIds, add: [tag] });
    const norm = tag.trim().toLowerCase();
    setCards((prev) =>
      prev.map((c) =>
        cardIds.includes(c.id) ? { ...c, tags: Array.from(new Set([...(c.tags ?? []), norm])) } : c
      )
    );
  }, []);

  const removeTagFromCards = useCallback(async (cardIds: string[], tag: string): Promise<void> => {
    if (!tag || cardIds.length === 0) return;
    await apiTagCards({ cardIds, remove: [tag] });
    const norm = tag.trim().toLowerCase();
    setCards((prev) =>
      prev.map((c) =>
        cardIds.includes(c.id) ? { ...c, tags: (c.tags ?? []).filter((t) => t !== norm) } : c
      )
    );
  }, []);

  const renameTagEverywhere = useCallback(async (from: string, to: string): Promise<void> => {
    if (!from || !to || from === to) return;
    await apiRenameTag(from, to);
    const normFrom = from.trim().toLowerCase();
    const normTo = to.trim().toLowerCase();
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        tags: Array.from(new Set((c.tags ?? []).map((t) => (t === normFrom ? normTo : t)))),
      }))
    );
    setActiveTag((prev) => (prev === normFrom ? normTo : prev));
  }, []);

  const deleteTagEverywhere = useCallback(async (name: string): Promise<void> => {
    if (!name) return;
    await apiDeleteTag(name);
    const norm = name.trim().toLowerCase();
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        tags: (c.tags ?? []).filter((t) => t !== norm),
      }))
    );
    setActiveTag((prev) => (prev === norm ? null : prev));
  }, []);

  const value = useMemo<CollectionContextValue>(
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

export const useCollection = (): CollectionContextValue => {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used inside CollectionProvider');
  return ctx;
};

export default CollectionContext;
