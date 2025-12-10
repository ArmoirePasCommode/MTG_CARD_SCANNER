import axios from 'axios';
import Constants from 'expo-constants';

import { uploadCardImage } from './api';
import { simulateOcrText } from './ocrService';

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
  collectorNumber: card.collector_number,
  imageUrl: card.image_uris?.normal || card.image_uris?.large || card.image_uris?.small,
  scryfallId: card.id
});

export const fetchCardByName = async (name, fuzzy = true) => {
  if (!name) return null;
  const endpoint = `/cards/named?${fuzzy ? 'fuzzy' : 'exact'}=${encodeURIComponent(name)}`;
  const { data } = await scryfallClient.get(endpoint);
  return normalizeCardPayload(data);
};

export const fetchCardBySetAndCollector = async (set, number) => {
  if (!set || !number) return null;
  const { data } = await scryfallClient.get(`/cards/${set}/${number}`);
  return normalizeCardPayload(data);
};

export const processCardRecognition = async ({ imageUri, cardName }) => {
  if (cardName) {
    return fetchCardByName(cardName, true);
  }
  if (!imageUri) return null;
  const uploaded = await uploadCardImage({ uri: imageUri });
  const ocrText = uploaded.text || (await simulateOcrText(imageUri));
  const lines = ocrText.split('\n').map((line) => line.trim());
  const probableName = lines.find((line) => line.length > 2);
  if (!probableName) return null;
  return fetchCardByName(probableName, true);
};

export default {
  fetchCardByName,
  fetchCardBySetAndCollector,
  processCardRecognition
};

