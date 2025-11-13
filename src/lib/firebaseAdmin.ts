
import * as admin from 'firebase-admin';

// This file should only be imported on the server.

if (!admin.apps.length) {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    // This error will be thrown during build time or server startup if the variables are missing.
    throw new Error('Firebase Admin environment variables are not set. Please check your .env file and server configuration.');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // This is the crucial step: replace the literal `\n` characters
        // in the environment variable with actual newline characters.
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (err: any) {
    console.error('Firebase Admin SDK initialization failed:', err);
    // Throw a more specific error to aid in debugging.
    throw new Error('Firebase Admin SDK failed to initialize. The credentials may be malformed. Original error: ' + err.message);
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
