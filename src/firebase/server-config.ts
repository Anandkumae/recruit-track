
import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization.
if (!admin.apps.length) {
  try {
    // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // if it's set in a managed environment (like App Hosting).
    // As a fallback for local/workstation development, it uses the explicit env vars.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines for .env variables
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    // Provide a more specific error if credentials are not set
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error(
          'Firebase Admin SDK credentials are not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
        );
    }
    throw new Error('Firebase Admin SDK could not be initialized. Check your service account credentials.');
  }
}

const adminApp = admin.app();
const adminFirestore = admin.firestore();

/**
 * Returns an initialized Firebase Admin SDK instance.
 */
export function getFirebaseAdmin() {
  return { adminApp, firestore: adminFirestore };
}
