'use strict';

const admin = require('firebase-admin');

async function verifyToken(authorizationHeader) {
  if (!authorizationHeader) return null;
  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  const token = parts[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (_e) {
    return null;
  }
}

async function authMiddleware(req, res, next) {
  const decoded = await verifyToken(req.headers.authorization);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = { uid: decoded.uid, email: decoded.email || null };
  next();
}

module.exports = { authMiddleware };


