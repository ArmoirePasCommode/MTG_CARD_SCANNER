'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Local modules
const { authMiddleware } = require('./middleware/auth');
const cardsService = require('./services/cards');
const { handleUpload } = require('./services/upload');

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// Protected routes
app.post('/cards', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, set, rarity, imageUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing field: name' });
    }
    const card = await cardsService.addCard({
      name,
      set: set || null,
      rarity: rarity || null,
      imageUrl: imageUrl || null,
      userId,
    });
    res.status(201).json(card);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('POST /cards error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/cards', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const cards = await cardsService.getUserCards(userId);
    res.status(200).json(cards);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /cards error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.delete('/cards/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const deleted = await cardsService.deleteCard(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('DELETE /cards/:id error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Upload endpoint (multipart/form-data: field "image")
app.post('/upload', authMiddleware, handleUpload);

// Export HTTP function
exports.api = functions
  .region('europe-west1')
  .https.onRequest(app);


