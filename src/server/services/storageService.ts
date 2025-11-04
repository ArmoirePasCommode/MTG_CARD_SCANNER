import { bucket } from '../db/firestore.js';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImageBuffer(ownerId: string, buffer: Buffer, mimeType: string): Promise<string> {
  const objectName = `uploads/${ownerId}/${Date.now()}-${uuidv4()}`;
  const file = bucket.file(objectName);
  await file.save(buffer, {
    contentType: mimeType,
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  await file.makePrivate({ strict: false });
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60, // 1 hour
  });
  return url;
}


