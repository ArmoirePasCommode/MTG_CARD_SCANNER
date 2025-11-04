import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { env } from '../config';

export const firestore = new Firestore({
  projectId: env.GCP_PROJECT_ID,
});

export const storage = new Storage({
  projectId: env.GCP_PROJECT_ID,
});

export const bucket = storage.bucket(env.GCS_BUCKET);


