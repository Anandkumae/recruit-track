
import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore;

function initializeAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // The private key from the environment variable often has escaped newlines.
  // We need to replace them with actual newline characters.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  const missingVars = [];
  if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
  if (!storageBucket) missingVars.push('FIREBASE_STORAGE_BUCKET');
  
  if (missingVars.length > 0) {
      const errorMessage = `Firebase Admin SDK initialization failed. The following environment variables are missing or empty: ${missingVars.join(', ')}. Please check your .env file.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
  }

  // Prevent re-initialization
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
    } catch (error: any) {
      console.error('Firebase Admin SDK initialization failed with error:', error.message);
      throw new Error('Firebase Admin SDK could not be initialized. Check your service account credentials and environment variables.');
    }
  }

  firestore = admin.firestore();
}

// Run the initialization logic when the module is first loaded on the server.
initializeAdminApp();

/**
 * Returns an initialized Firebase Admin SDK Firestore instance.
 */
export function getFirebaseAdmin() {
  // The firestore instance is initialized when the module loads.
  // If it's not available here, initialization failed.
  if (!firestore) {
    throw new Error('Firestore admin instance is not available. The application might not have started correctly.');
  }
  return { firestore };
}
