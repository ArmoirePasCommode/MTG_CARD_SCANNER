import { fetch } from 'expo/fetch';
import Constants from 'expo-constants';

import { recognizeCardImage } from './api';
import type { NewCard } from '../types/api';

export interface SetInfo {
  code: string;
  name: string;
  cardCount: number;
  iconSvgUri: string | null;
  releasedAt: string | null;
  setType: string | null;
}

const baseUrl =
  process.env.EXPO_PUBLIC_SCRYFALL_URL ??
  (Constants?.expoConfig?.extra as Record<string, string> | undefined)?.scryfallBaseUrl ??
  'https://api.scryfall.com';

const SCRYFALL_TIMEOUT_MS = 8000;

/** Required by Scryfall — identify the app (see https://scryfall.com/docs/api) */
const USER_AGENT = `MTGCardScanner/${Constants.expoConfig?.version ?? '1.0.0'} (Android; Expo)`;

const JSON_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent': USER_AGENT,
};

/**
 * Global pacing: `/cards/named`, `/cards/autocomplete`, `/cards/{set}/{nr}`, etc. share tight limits.
 */
const MIN_REQUEST_INTERVAL_MS = 550;

/** After 429, Scryfall often asks for a multi-second pause — honor header or default. */
const DEFAULT_RETRY_AFTER_MS = 30_000;
const MAX_429_RETRIES = 5;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface ScryfallImageUris {
  normal?: string;
  large?: string;
  small?: string;
}

interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  colors?: string[];
  rarity: string;
  set: string;
  set_name: string;
  collector_number: string;
  released_at?: string;
  image_uris?: ScryfallImageUris;
  card_faces?: { image_uris?: ScryfallImageUris }[];
  prices?: {
    usd?: string | null;
    eur?: string | null;
    usd_foil?: string | null;
  };
}

function parseRetryAfterMs(response: Response): number {
  const raw = response.headers?.get?.('Retry-After');
  if (!raw) return DEFAULT_RETRY_AFTER_MS;
  const sec = parseInt(String(raw).trim(), 10);
  if (Number.isFinite(sec)) {
    return Math.min(Math.max(sec * 1000, 500), 120_000);
  }
  return DEFAULT_RETRY_AFTER_MS;
}

let requestMutex: Promise<unknown> = Promise.resolve();
let lastRequestStartMs = 0;

const scryfallRequest = async <T = unknown>(path: string): Promise<T> => {
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
          return (await response.json()) as T;
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
        (err as Error & { status: number }).status = response.status;
        throw err;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Scryfall request timed out.');
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error('Max retries exceeded');
  });

  requestMutex = ticket.catch(() => {});
  return ticket as Promise<T>;
};

const parseMoney = (v: string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeCardPayload = (card: ScryfallCard): NewCard => ({
  name: card.name,
  manaCost: card.mana_cost ?? null,
  typeLine: card.type_line ?? null,
  oracleText: card.oracle_text ?? null,
  colors: card.colors ?? null,
  rarity: card.rarity,
  setName: card.set_name,
  edition: card.set,
  collectorNumber: card.collector_number,
  imageUrl:
    card.image_uris?.normal ??
    card.image_uris?.large ??
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.large ??
    null,
  scryfallId: card.id,
  priceUsd: parseMoney(card.prices?.usd),
  priceEur: parseMoney(card.prices?.eur),
  priceUsdFoil: parseMoney(card.prices?.usd_foil),
});

export const fetchCardByName = async (
  name: string | null,
  fuzzy = true
): Promise<NewCard | null> => {
  if (!name) return null;
  const param = fuzzy ? 'fuzzy' : 'exact';
  const data = await scryfallRequest<ScryfallCard>(
    `/cards/named?${param}=${encodeURIComponent(name)}`
  );
  return normalizeCardPayload(data);
};

export const fetchCardBySetAndCollector = async (
  set: string | null,
  number: string | null
): Promise<NewCard | null> => {
  if (!set || !number) return null;
  const data = await scryfallRequest<ScryfallCard>(
    `/cards/${encodeURIComponent(set)}/${encodeURIComponent(number)}`
  );
  return normalizeCardPayload(data);
};

/**
 * Fetch Scryfall set metadata (name, code, card_count, icon_svg_uri, released_at).
 * Used by the "By set" completion view on Home.
 */
export const fetchSetInfo = async (setCode: string | null): Promise<SetInfo | null> => {
  if (!setCode) return null;
  const data = await scryfallRequest<{
    code: string;
    name: string;
    card_count?: number;
    icon_svg_uri?: string;
    released_at?: string;
    set_type?: string;
  }>(`/sets/${encodeURIComponent(setCode)}`);
  return {
    code: data.code,
    name: data.name,
    cardCount: data.card_count ?? 0,
    iconSvgUri: data.icon_svg_uri ?? null,
    releasedAt: data.released_at ?? null,
    setType: data.set_type ?? null,
  };
};

/**
 * Autocomplete card names via Scryfall for live search suggestions.
 * Returns an array of up to 20 name strings, or [] on any failure.
 */
export const autocompleteCardName = async (query: string): Promise<string[]> => {
  if (!query || query.length < 2) return [];
  try {
    const data = await scryfallRequest<{ data?: string[] }>(
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
export const processCardRecognition = async ({
  imageUri,
}: {
  imageUri: string | null;
}): Promise<NewCard | null> => {
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
