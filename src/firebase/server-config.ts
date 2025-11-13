
'use server';

import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore;

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This function is memoized to ensure it only runs once.
 */
const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Firebase Admin SDK service account credentials are not set in environment variables.');
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    return app;
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error);
    throw new Error(
      'Firebase Admin SDK could not be initialized. Check your service account credentials.'
    );
  }
};

// Initialize on module load.
const adminApp = initializeAdminApp();
firestore = admin.firestore(adminApp);

export { firestore };
