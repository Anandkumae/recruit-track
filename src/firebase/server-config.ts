
'use server';

import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;

/**
 * Initializes the Firebase Admin SDK and returns a Firestore instance.
 * Ensures that initialization only happens once (singleton pattern).
 */
export function getFirestoreAdmin() {
  if (firestore) {
    return firestore;
  }

  if (admin.apps.length === 0) {
    try {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Crucially, replace the escaped newlines with actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase service account credentials are not fully set in environment variables.');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

    } catch (error: any) {
      console.error('Firebase Admin SDK initialization failed:', error);
      throw new Error(
        'Firebase Admin SDK could not be initialized. Check your service account credentials.'
      );
    }
  }

  firestore = admin.firestore();
  return firestore;
}
