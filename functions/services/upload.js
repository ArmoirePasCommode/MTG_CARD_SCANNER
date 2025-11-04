'use strict';

const admin = require('firebase-admin');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function handleUpload(req, res) {
  if (!req.headers['content-type'] || !req.headers['content-type'].startsWith('multipart/form-data')) {
    return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
  }

  const busboy = Busboy({ headers: req.headers });
  const tmpUploads = [];
  const fields = {};

  busboy.on('file', (fieldname, file, filename, _encoding, mimetype) => {
    if (fieldname !== 'image') {
      file.resume();
      return;
    }
    const tmpFilePath = path.join(os.tmpdir(), `${uuidv4()}-${filename}`);
    const writeStream = fs.createWriteStream(tmpFilePath);
    file.pipe(writeStream);
    tmpUploads.push({ tmpFilePath, filename, mimetype });
  });

  busboy.on('field', (name, val) => {
    fields[name] = val;
  });

  busboy.on('finish', async () => {
    try {
      if (tmpUploads.length === 0) {
        return res.status(400).json({ error: 'No image file provided (field: image)' });
      }

      const bucket = admin.storage().bucket();
      const { tmpFilePath, filename, mimetype } = tmpUploads[0];
      const destination = `uploads/${req.user.uid}/${Date.now()}-${filename}`;

      await bucket.upload(tmpFilePath, {
        destination,
        metadata: {
          contentType: mimetype,
          metadata: { firebaseStorageDownloadTokens: uuidv4() },
        },
      });

      // Keep object private and generate a V4 signed URL (temporary)
      const fileRef = bucket.file(destination);
      const expiresAtMs = Date.now() + 1000 * 60 * 60; // 1 hour
      const [signedUrl] = await fileRef.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: expiresAtMs,
      });

      // Optional: store reference in Firestore if requested
      if (fields.saveToFirestore === 'true') {
        const db = admin.firestore();
        await db.collection('uploads').add({
          userId: req.user.uid,
          path: destination,
          url: signedUrl,
          contentType: mimetype,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(expiresAtMs).toISOString(),
        });
      }

      // Clean up tmp file
      try { fs.unlinkSync(tmpFilePath); } catch (_e) {}

      res.status(201).json({ url: signedUrl, path: destination, expiresAt: new Date(expiresAtMs).toISOString() });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Upload error', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  busboy.end(req.rawBody);
}

module.exports = { handleUpload };


