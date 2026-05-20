import { Response } from 'express';
import { firestore } from '../db/firestore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { uploadImageBuffer } from '../services/storageService.js';
import { extractCardName, extractTextFromBuffer } from '../services/visionService.js';
import { CardUpdate, NewCard } from '../models/Card.js';

const MAX_BULK_CARDS = 250;

function nowIso(): string { return new Date().toISOString(); }

const toStringOrNull = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

const toNumberOrNull = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const toStringArrayOrNull = (v: unknown): string[] | null => {
  if (!Array.isArray(v)) return null;
  const arr = v.map((x) => String(x)).filter(Boolean);
  return arr.length ? arr : null;
};

const toQuantity = (v: unknown): number => {
  const n = toNumberOrNull(v);
  if (n === null) return 1;
  const i = Math.max(1, Math.floor(n));
  return Number.isFinite(i) ? i : 1;
};

const toTags = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  for (const t of v) {
    const s = String(t).trim().toLowerCase();
    if (s && s.length <= 32) seen.add(s);
  }
  return [...seen].slice(0, 20);
};

/**
 * Build the persisted shape for a card from an arbitrary client payload.
 * Sanitizes every field so we never store undefined and never trust unknown keys.
 */
const buildCardDocument = (input: NewCard, ownerId: string, imageUrl: string | null) => {
  const created = nowIso();
  return {
    ownerId,
    name: String(input.name).trim(),
    edition: toStringOrNull(input.edition),
    setName: toStringOrNull(input.setName),
    collectorNumber: toStringOrNull(input.collectorNumber),
    scryfallId: toStringOrNull(input.scryfallId),
    manaCost: toStringOrNull(input.manaCost),
    typeLine: toStringOrNull(input.typeLine),
    oracleText: toStringOrNull(input.oracleText),
    colors: toStringArrayOrNull(input.colors),
    rarity: toStringOrNull(input.rarity),
    imageUrl: imageUrl ?? toStringOrNull(input.imageUrl),
    quantity: toQuantity(input.quantity),
    isFoil: input.isFoil === true,
    priceUsd: toNumberOrNull(input.priceUsd),
    priceEur: toNumberOrNull(input.priceEur),
    priceUsdFoil: toNumberOrNull(input.priceUsdFoil),
    tags: toTags(input.tags),
    createdAt: created,
    updatedAt: created,
  };
};

export async function addCard(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const body = (req.body || {}) as NewCard;
  if (!body.name || !String(body.name).trim()) {
    return res.status(400).json({ error: 'Missing field: name' });
  }

  try {
    let imageUrl: string | null = null;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file && file.buffer && file.mimetype) {
      imageUrl = await uploadImageBuffer(user.id, file.buffer, file.mimetype);
    }

    const card = buildCardDocument(body, user.id, imageUrl);
    const ref = await firestore.collection('cards').add(card);
    return res.status(201).json({ id: ref.id, ...card });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

export async function bulkAddCards(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const cardsInput = (req.body?.cards as NewCard[] | undefined) || [];
  if (!Array.isArray(cardsInput) || cardsInput.length === 0) {
    return res.status(400).json({ error: 'Missing field: cards (non-empty array)' });
  }
  if (cardsInput.length > MAX_BULK_CARDS) {
    return res.status(400).json({ error: `Too many cards (max ${MAX_BULK_CARDS} per request)` });
  }
  for (const c of cardsInput) {
    if (!c?.name || !String(c.name).trim()) {
      return res.status(400).json({ error: 'Each card must have a non-empty name' });
    }
  }

  try {
    const batch = firestore.batch();
    const collection = firestore.collection('cards');
    const built = cardsInput.map((c) => {
      const ref = collection.doc();
      const data = buildCardDocument(c, user.id, null);
      batch.set(ref, data);
      return { id: ref.id, ...data };
    });
    await batch.commit();
    return res.status(201).json({ saved: built });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

export async function updateCard(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing card id' });

  const body = (req.body || {}) as CardUpdate;

  const patch: Record<string, unknown> = {};
  if (body.quantity !== undefined) patch.quantity = toQuantity(body.quantity);
  if (body.isFoil !== undefined) patch.isFoil = body.isFoil === true;
  if (body.priceUsd !== undefined) patch.priceUsd = toNumberOrNull(body.priceUsd);
  if (body.priceEur !== undefined) patch.priceEur = toNumberOrNull(body.priceEur);
  if (body.priceUsdFoil !== undefined) patch.priceUsdFoil = toNumberOrNull(body.priceUsdFoil);
  if (body.tags !== undefined) patch.tags = toTags(body.tags);

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No editable fields provided' });
  }

  try {
    const ref = firestore.collection('cards').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    if (doc.data()?.ownerId !== user.id) return res.status(403).json({ error: 'Forbidden' });

    patch.updatedAt = nowIso();
    await ref.update(patch);
    const updated = await ref.get();
    return res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

export async function listCards(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const snap = await firestore.collection('cards').where('ownerId', '==', user.id).orderBy('createdAt', 'desc').get();
    const cards = snap.docs.map(d => {
      const data = d.data();
      return { id: d.id, ...data, tags: Array.isArray(data.tags) ? data.tags : [] };
    });
    return res.status(200).json(cards);
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

export async function deleteCard(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing card id' });
  try {
    const ref = firestore.collection('cards').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    if (doc.data()?.ownerId !== user.id) return res.status(403).json({ error: 'Forbidden' });
    await ref.delete();
    return res.status(204).send();
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

export async function recognizeCard(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  let imageBuffer: Buffer | null = null;

  const file = (req as any).file as Express.Multer.File | undefined;
  if (file?.buffer) {
    imageBuffer = file.buffer;
  } else if (typeof req.body?.imageBase64 === 'string' && req.body.imageBase64.length > 0) {
    imageBuffer = Buffer.from(req.body.imageBase64, 'base64');
  }

  if (!imageBuffer) {
    return res.status(400).json({ error: 'Image file or imageBase64 is required' });
  }

  try {
    const ocrText = await extractTextFromBuffer(imageBuffer);
    const cardName = extractCardName(ocrText);
    return res.status(200).json({ text: ocrText, cardName });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

/** GET /api/tags — derive tag list from user's cards, sorted by count desc */
export async function listTags(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const snap = await firestore.collection('cards').where('ownerId', '==', user.id).get();
    const counts = new Map<string, number>();
    snap.docs.forEach(d => {
      const tags = d.data().tags;
      if (Array.isArray(tags)) {
        tags.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1));
      }
    });
    const result = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

/** POST /api/cards/tag — bulk add/remove a tag across many cards */
export async function tagCards(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { cardIds, add, remove } = req.body || {};
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return res.status(400).json({ error: 'Missing field: cardIds (non-empty array)' });
  }
  const addTags = toTags(add);
  const removeTags = toTags(remove);
  if (addTags.length === 0 && removeTags.length === 0) {
    return res.status(400).json({ error: 'Provide at least one tag in add or remove' });
  }
  try {
    const collection = firestore.collection('cards');
    const now = nowIso();
    const batch = firestore.batch();
    for (const id of cardIds) {
      const ref = collection.doc(id);
      const doc = await ref.get();
      if (!doc.exists || doc.data()?.ownerId !== user.id) continue;
      const existing: string[] = Array.isArray(doc.data()?.tags) ? doc.data()!.tags : [];
      const merged = Array.from(
        new Set([...existing.filter(t => !removeTags.includes(t)), ...addTags])
      ).slice(0, 20);
      batch.update(ref, { tags: merged, updatedAt: now });
    }
    await batch.commit();
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

/** POST /api/tags/rename — rename a tag across all user's cards */
export async function renameTag(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { from: rawFrom, to: rawTo } = req.body || {};
  const from = toStringOrNull(rawFrom)?.toLowerCase();
  const to = toStringOrNull(rawTo)?.toLowerCase();
  if (!from || !to) return res.status(400).json({ error: 'Missing fields: from, to' });
  if (from === to) return res.status(400).json({ error: 'from and to are identical' });
  try {
    const snap = await firestore.collection('cards')
      .where('ownerId', '==', user.id)
      .where('tags', 'array-contains', from)
      .get();
    if (snap.empty) return res.status(200).json({ updated: 0 });
    const now = nowIso();
    const batch = firestore.batch();
    snap.docs.forEach(d => {
      const tags: string[] = Array.isArray(d.data().tags) ? d.data().tags : [];
      const next = Array.from(new Set(tags.map(t => (t === from ? to : t)))).slice(0, 20);
      batch.update(d.ref, { tags: next, updatedAt: now });
    });
    await batch.commit();
    return res.status(200).json({ updated: snap.size });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

/** DELETE /api/tags/:name — remove a tag from all user's cards */
export async function deleteTag(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const name = toStringOrNull(req.params.name)?.toLowerCase();
  if (!name) return res.status(400).json({ error: 'Missing tag name' });
  try {
    const snap = await firestore.collection('cards')
      .where('ownerId', '==', user.id)
      .where('tags', 'array-contains', name)
      .get();
    if (snap.empty) return res.status(200).json({ updated: 0 });
    const now = nowIso();
    const batch = firestore.batch();
    snap.docs.forEach(d => {
      const tags: string[] = Array.isArray(d.data().tags) ? d.data().tags : [];
      batch.update(d.ref, { tags: tags.filter(t => t !== name), updatedAt: now });
    });
    await batch.commit();
    return res.status(200).json({ updated: snap.size });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

export async function syncCards(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { since } = req.query as { since?: string };
  if (!since) {
    return res.status(400).json({ error: 'Missing query param: since (ISO string)' });
  }
  try {
    const q = await firestore
      .collection('cards')
      .where('ownerId', '==', user.id)
      .where('updatedAt', '>', since)
      .orderBy('updatedAt', 'asc')
      .get();
    const cards = q.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ changes: cards, cursor: nowIso() });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}
