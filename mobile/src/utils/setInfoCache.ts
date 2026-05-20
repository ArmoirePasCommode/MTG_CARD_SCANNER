/**
 * In-memory cache for Scryfall set metadata, used by the "By set" completion view.
 *
 * Why in-memory: Scryfall set data is small and read-only, the user typically
 * touches a few dozen distinct sets per session, and a session-only cache fully
 * eliminates duplicate Scryfall calls within a single app run. Persistence
 * across launches is intentionally out of scope.
 *
 * Inflight de-duplication guarantees that 10 simultaneous calls for the same
 * set produce a single network request.
 */

import { fetchSetInfo } from '../services/scryfallService';

export interface SetInfo {
  code: string;
  name: string;
  cardCount: number;
  iconSvgUri: string | null;
  releasedAt: string | null;
  setType: string | null;
}

const cache = new Map<string, SetInfo>();
const inflight = new Map<string, Promise<SetInfo | null>>();

const normalize = (code: string | null | undefined): string =>
  code ? String(code).toLowerCase().trim() : '';

export const getCachedSetInfo = (code: string | null | undefined): SetInfo | null => {
  const key = normalize(code);
  if (!key) return null;
  return cache.get(key) ?? null;
};

export const loadSetInfo = async (code: string | null | undefined): Promise<SetInfo | null> => {
  const key = normalize(code);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;
  if (inflight.has(key)) return inflight.get(key) ?? null;

  const promise: Promise<SetInfo | null> = (async () => {
    try {
      const info = await fetchSetInfo(key);
      if (info) cache.set(key, info);
      return info;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
};

export const primeSetInfo = async (codes: (string | null | undefined)[]): Promise<void> => {
  const unique = Array.from(new Set((codes ?? []).map(normalize).filter(Boolean)));
  await Promise.all(unique.map((c) => loadSetInfo(c)));
};

export default { getCachedSetInfo, loadSetInfo, primeSetInfo };
