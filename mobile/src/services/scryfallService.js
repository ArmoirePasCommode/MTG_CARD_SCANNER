import { fetch } from 'expo/fetch';
import Constants from 'expo-constants';

import { recognizeCardImage } from './api';

const baseUrl =
  process.env.EXPO_PUBLIC_SCRYFALL_URL ||
  Constants?.expoConfig?.extra?.scryfallBaseUrl ||
  'https://api.scryfall.com';

const SCRYFALL_TIMEOUT_MS = 8000;

const scryfallRequest = async (path) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCRYFALL_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      const message = `Scryfall request failed (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Scryfall request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const parseMoney = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeCardPayload = (card) => ({
  name: card.name,
  manaCost: card.mana_cost,
  typeLine: card.type_line,
  oracleText: card.oracle_text,
  colors: card.colors,
  rarity: card.rarity,
  setName: card.set_name,
  edition: card.set,
  collectorNumber: card.collector_number,
  imageUrl:
    card.image_uris?.normal ||
    card.image_uris?.large ||
    card.image_uris?.small,
  scryfallId: card.id,
  priceUsd: parseMoney(card.prices?.usd),
  priceEur: parseMoney(card.prices?.eur),
  priceUsdFoil: parseMoney(card.prices?.usd_foil),
  releasedAt: card.released_at || null,
});

export const fetchCardByName = async (name, fuzzy = true) => {
  if (!name) return null;
  const param = fuzzy ? 'fuzzy' : 'exact';
  const data = await scryfallRequest(
    `/cards/named?${param}=${encodeURIComponent(name)}`
  );
  return normalizeCardPayload(data);
};

export const fetchCardBySetAndCollector = async (set, number) => {
  if (!set || !number) return null;
  const data = await scryfallRequest(`/cards/${set}/${number}`);
  return normalizeCardPayload(data);
};

/**
 * Fetch Scryfall set metadata (name, code, card_count, icon_svg_uri, released_at).
 * Used by the "By set" completion view on Home.
 */
export const fetchSetInfo = async (setCode) => {
  if (!setCode) return null;
  const data = await scryfallRequest(`/sets/${encodeURIComponent(setCode)}`);
  return {
    code: data.code,
    name: data.name,
    cardCount: data.card_count ?? 0,
    iconSvgUri: data.icon_svg_uri || null,
    releasedAt: data.released_at || null,
    setType: data.set_type || null,
  };
};

/**
 * Autocomplete card names via Scryfall for live search suggestions.
 * Returns an array of up to 20 name strings, or [] on any failure.
 */
export const autocompleteCardName = async (query) => {
  if (!query || query.length < 2) return [];
  try {
    const data = await scryfallRequest(
      `/cards/autocomplete?q=${encodeURIComponent(query)}`
    );
    return data?.data ?? [];
  } catch {
    return [];
  }
};

/**
 * Given an image URI, sends it to the backend OCR endpoint to extract a card name,
 * then queries Scryfall with the result.
 */
export const processCardRecognition = async ({ imageUri }) => {
  if (!imageUri) return null;
  const { cardName } = await recognizeCardImage({ uri: imageUri });
  if (!cardName) throw new Error('Could not extract card name from image');
  return fetchCardByName(cardName, true);
};

export default {
  fetchCardByName,
  fetchCardBySetAndCollector,
  fetchSetInfo,
  autocompleteCardName,
  processCardRecognition,
};
