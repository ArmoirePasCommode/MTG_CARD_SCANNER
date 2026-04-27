import axios from 'axios';
import Constants from 'expo-constants';

import { recognizeCardImage } from './api';

const baseUrl =
  process.env.EXPO_PUBLIC_SCRYFALL_URL ||
  Constants?.expoConfig?.extra?.scryfallBaseUrl ||
  'https://api.scryfall.com';

const scryfallClient = axios.create({
  baseURL: baseUrl,
  timeout: 8000
});

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
  imageUrl: card.image_uris?.normal || card.image_uris?.large || card.image_uris?.small,
  scryfallId: card.id
});

export const fetchCardByName = async (name, fuzzy = true) => {
  if (!name) return null;
  const param = fuzzy ? 'fuzzy' : 'exact';
  const { data } = await scryfallClient.get(`/cards/named?${param}=${encodeURIComponent(name)}`);
  return normalizeCardPayload(data);
};

export const fetchCardBySetAndCollector = async (set, number) => {
  if (!set || !number) return null;
  const { data } = await scryfallClient.get(`/cards/${set}/${number}`);
  return normalizeCardPayload(data);
};

/**
 * Autocomplete card names via Scryfall for live search suggestions.
 * Returns an array of up to 20 name strings.
 */
export const autocompleteCardName = async (query) => {
  if (!query || query.length < 2) return [];
  try {
    const { data } = await scryfallClient.get(`/cards/autocomplete?q=${encodeURIComponent(query)}`);
    return data.data ?? [];
  } catch {
    return [];
  }
};

/**
 * Given an image URI, sends it to the backend OCR endpoint to extract a card name,
 * then queries Scryfall with the result.
 * Returns { cardName, scryfallCard } where scryfallCard may be null on failure.
 */
export const processCardRecognition = async ({ imageUri }) => {
  if (!imageUri) return null;
  const { cardName } = await recognizeCardImage({ uri: imageUri });
  if (!cardName) throw new Error('Could not extract card name from image');
  const scryfallCard = await fetchCardByName(cardName, true);
  return scryfallCard;
};

export default {
  fetchCardByName,
  fetchCardBySetAndCollector,
  autocompleteCardName,
  processCardRecognition
};
