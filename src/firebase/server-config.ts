
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;
let adminFirestore: admin.firestore.Firestore;

function initializeAdminApp() {
  // Check if the app is already initialized to prevent re-initialization.
  if (admin.apps.length > 0) {
    adminApp = admin.app();
    adminFirestore = admin.firestore();
    return;
  }

  try {
    // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // if it's set, or default credentials in a managed environment.
    adminApp = admin.initializeApp();
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
    // Provide a clear error message.
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

    