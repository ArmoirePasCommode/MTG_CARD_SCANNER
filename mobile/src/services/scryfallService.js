import { fetch } from 'expo/fetch';
import Constants from 'expo-constants';

import { recognizeCardImage } from './api';

const baseUrl =
  process.env.EXPO_PUBLIC_SCRYFALL_URL ||
  Constants?.expoConfig?.extra?.scryfallBaseUrl ||
  'https://api.scryfall.com';

const SCRYFALL_TIMEOUT_MS = 8000;

/** Required by Scryfall — identify the app (see https://scryfall.com/docs/api) */
const USER_AGENT = `MTGCardScanner/${
  Constants.expoConfig?.version ?? '1.0.0'
} (Android; Expo)`;

const JSON_HEADERS = {
  Accept: 'application/json',
  'User-Agent': USER_AGENT,
};

/**
 * Global pacing: `/cards/named`, `/cards/autocomplete`, `/cards/{set}/{nr}`, etc. share tight limits.
 * Anything that bypassed pacing (e.g. autocomplete while paste resolves) still triggered 429.
 */
const MIN_REQUEST_INTERVAL_MS = 550;

/** After 429, Scryfall often asks for a multi-second pause — honor header or default. */
const DEFAULT_RETRY_AFTER_MS = 30_000;
const MAX_429_RETRIES = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseRetryAfterMs(response) {
  const raw = response.headers?.get?.('Retry-After');
  if (!raw) return DEFAULT_RETRY_AFTER_MS;
  const sec = parseInt(String(raw).trim(), 10);
  if (Number.isFinite(sec)) {
    return Math.min(Math.max(sec * 1000, 500), 120_000);
  }
  return DEFAULT_RETRY_AFTER_MS;
}

let requestMutex = Promise.resolve();
let lastRequestStartMs = 0;

const scryfallRequest = async (path) => {
  const ticket = requestMutex.then(async () => {
    const now = Date.now();
    const elapsed = now - lastRequestStartMs;
    if (lastRequestStartMs > 0 && elapsed < MIN_REQUEST_INTERVAL_MS) {
      await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
    }

    let attempt = 0;
    while (attempt <= MAX_429_RETRIES) {
      lastRequestStartMs = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SCRYFALL_TIMEOUT_MS);
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          headers: JSON_HEADERS,
          signal: controller.signal,
        });

        if (response.ok) {
          return await response.json();
        }

        if (response.status === 429 && attempt < MAX_429_RETRIES) {
          const waitMs = parseRetryAfterMs(response);
          await sleep(waitMs);
          attempt += 1;
          continue;
        }

        let message = `Scryfall request failed (${response.status})`;
        if (response.status === 429) {
          message =
            'Scryfall rate limit exceeded after retries. Wait ~1 minute and retry failed rows.';
        }
        const err = new Error(message);
        err.status = response.status;
        throw err;
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw new Error('Scryfall request timed out.');
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
  });

  requestMutex = ticket.catch(() => {});
  return ticket;
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
    card.image_uris?.small ||
    card.card_faces?.[0]?.image_uris?.normal ||
    card.card_faces?.[0]?.image_uris?.large,
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
  const data = await scryfallRequest(
    `/cards/${encodeURIComponent(set)}/${encodeURIComponent(number)}`
  );
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
