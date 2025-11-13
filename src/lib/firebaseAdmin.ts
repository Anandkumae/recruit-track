'use server';

import * as admin from 'firebase-admin';
import 'dotenv/config';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase admin environment variables. Please check your .env file.');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (err: any) {
    console.error('Firebase Admin SDK initialization failed:', err);
    throw new Error('Firebase Admin SDK failed to initialize. The credentials may be malformed. Original error: ' + err.message);
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
