/**
 * In-memory cache for Scryfall set metadata, used by the "By set" completion view.
 *
 * Why in-memory: Scryfall set data is small and read-only, the user typically
 * touches a few dozen distinct sets per session, and a session-only cache fully
 * eliminates duplicate Scryfall calls within a single app run. Persistence
 * across launches is intentionally out of scope (see plan deferrals).
 *
 * Inflight de-duplication guarantees that 10 simultaneous calls for the same
 * set produce a single network request.
 */

import { fetchSetInfo } from '../services/scryfallService';

const cache = new Map(); // setCode -> { code, name, cardCount, ... }
const inflight = new Map(); // setCode -> Promise

const normalize = (code) => (code ? String(code).toLowerCase().trim() : '');

export const getCachedSetInfo = (code) => {
  const key = normalize(code);
  if (!key) return null;
  return cache.get(key) || null;
};

export const loadSetInfo = async (code) => {
  const key = normalize(code);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
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

export const primeSetInfo = async (codes) => {
  const unique = Array.from(new Set((codes || []).map(normalize).filter(Boolean)));
  await Promise.all(unique.map((c) => loadSetInfo(c)));
};

export default { getCachedSetInfo, loadSetInfo, primeSetInfo };
