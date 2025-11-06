
import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

// Ensure the necessary environment variables are set for production.
// In a real production environment, you would use GOOGLE_APPLICATION_CREDENTIALS
// or have the environment automatically configured (e.g., in Cloud Functions/Run).
if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // A service account key is needed for server-side admin access.
    // For this demonstration, we'll try to use a placeholder but warn the user.
    // In a real app, this should be a securely managed service account JSON file.
    console.warn(
      `WARNING: GOOGLE_APPLICATION_CREDENTIALS environment variable not set.
       Firebase Admin SDK initialization might fail in a production environment.
       For local development, this might be okay if you've logged in via the gcloud CLI.`
    );
}

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
    // In many server environments (like Cloud Run, Cloud Functions),
    // initializing with no arguments will automatically use the environment's
    // default credentials.
    adminApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId
    });
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
    // If automatic initialization fails, it might be because the credentials
    // are not set up in the environment. Provide guidance.
    throw new Error(
      `Firebase Admin SDK could not be initialized. Ensure your server environment
       is configured with the correct Google Application Credentials.`
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
