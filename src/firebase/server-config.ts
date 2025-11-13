
import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

// Singleton pattern to ensure we only initialize the admin app once.
let adminApp: admin.app.App;
let adminFirestore: admin.firestore.Firestore;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    adminApp = admin.app();
    adminFirestore = admin.firestore();
    return;
  }

  try {
    // In the Firebase Studio environment, initializing with the project ID
    // is sufficient as the credentials are handled by the environment.
    adminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
    // If initialization fails, provide guidance.
    throw new Error(
      `Firebase Admin SDK could not be initialized. This might be a temporary environment issue. Please try again.`
    );
  }
  
  adminFirestore = admin.firestore();
}

/**
 * Returns an initialized Firebase Admin SDK instance.
 * It ensures the app is initialized only once.
 */
export function getFirebaseAdmin() {
  if (!adminApp) {
    initializeAdminApp();
  }
  return { adminApp, firestore: adminFirestore };
}
