
import * as admin from 'firebase-admin';

// This function ensures that Firebase Admin is initialized only once.
const initializeAdminApp = () => {
  // If the app is already initialized, return it.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Read credentials from environment variables.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Important: Replace escaped newlines in the private key.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK credentials are not fully set in environment variables. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error);
    throw new Error(
      'Firebase Admin SDK could not be initialized. Check your service account credentials.'
    );
  }
};

// Initialize the app and export the firestore instance.
const firestore = initializeAdminApp().firestore();

export { firestore };
