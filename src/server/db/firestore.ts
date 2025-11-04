import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { env } from '../config';

const isTest = process.env.NODE_ENV === 'test';

export const firestore = isTest
  ? ({
      collection: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: true, docs: [] as any[] }),
          }),
        }),
        add: async (_doc: any) => ({ id: 'test-id' }),
      }),
    } as unknown as Firestore)
  : new Firestore({ projectId: env.GCP_PROJECT_ID });

export const storage = isTest
  ? ({} as unknown as Storage)
  : new Storage({ projectId: env.GCP_PROJECT_ID });

export const bucket = isTest
  ? ({
      file: () => ({
        save: async () => {},
        makePrivate: async () => {},
        getSignedUrl: async () => ['https://example.com/test.jpg'],
      }),
    } as any)
  : storage.bucket(env.GCS_BUCKET);


