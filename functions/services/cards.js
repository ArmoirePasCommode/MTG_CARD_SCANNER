'use strict';

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

const db = admin.firestore();
const CARDS_COLLECTION = 'cards';

function nowIso() {
  return new Date().toISOString();
}

async function addCard({ name, set, rarity, imageUrl, userId }) {
  const id = uuidv4();
  const doc = {
    id,
    name,
    set: set || null,
    rarity: rarity || null,
    imageUrl: imageUrl || null,
    createdAt: nowIso(),
    userId,
  };
  await db.collection(CARDS_COLLECTION).doc(id).set(doc);
  return doc;
}

async function getUserCards(userId) {
  const snap = await db
    .collection(CARDS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => d.data());
}

async function deleteCard(cardId, userId) {
  const ref = db.collection(CARDS_COLLECTION).doc(cardId);
  const doc = await ref.get();
  if (!doc.exists) return false;
  const data = doc.data();
  if (data.userId !== userId) return false;
  await ref.delete();
  return true;
}

module.exports = { addCard, getUserCards, deleteCard };


