import { Response } from 'express';
import { firestore } from '../db/firestore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { uploadImageBuffer } from '../services/storageService.js';

function nowIso(): string { return new Date().toISOString(); }

export async function addCard(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, edition, rarity } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'Missing field: name' });
  }

  try {
    let imageUrl: string | null = null;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file && file.buffer && file.mimetype) {
      imageUrl = await uploadImageBuffer(user.id, file.buffer, file.mimetype);
    }

    const card = {
      name,
      edition: edition || null,
      rarity: rarity || null,
      imageUrl,
      ownerId: user.id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const ref = await firestore.collection('cards').add(card);
    return res.status(201).json({ id: ref.id, ...card });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}

export async function listCards(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const snap = await firestore.collection('cards').where('ownerId', '==', user.id).orderBy('createdAt', 'desc').get();
    const cards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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


