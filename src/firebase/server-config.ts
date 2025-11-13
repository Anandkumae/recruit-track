
import * as admin from 'firebase-admin';

// This object will hold the initialized admin app and services.
const adminServices = {
  app: null as admin.app.App | null,
  firestore: null as admin.firestore.Firestore | null,
};

// This function initializes the admin SDK and is NOT exported.
// It runs only once when this module is first imported on the server.
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    const defaultApp = admin.apps[0];
    if (defaultApp) {
        adminServices.app = defaultApp;
        adminServices.firestore = admin.firestore(defaultApp);
        return;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Ensure private key is correctly formatted
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  const missingVars = [];
  if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
  if (!storageBucket) missingVars.push('FIREBASE_STORAGE_BUCKET');

  if (missingVars.length > 0) {
    console.error(
      `Firebase Admin SDK initialization failed. The following environment variables are missing: ${missingVars.join(', ')}. Please check your .env file.`
    );
    throw new Error(`Firebase Admin SDK initialization failed due to missing environment variables: ${missingVars.join(', ')}.`);
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
    adminServices.app = app;
    adminServices.firestore = admin.firestore(app);
  } catch (error: any) {
    console.error('Firebase Admin SDK could not be initialized. Check your service account credentials.', error);
    throw new Error('Firebase Admin SDK could not be initialized. Check your service account credentials.');
  }
}

// Run the initialization logic when the module is loaded.
initializeAdminApp();

/**
 * Returns the initialized Firebase Admin SDK instances.
 */
export function getFirebaseAdmin() {
  if (!adminServices.firestore) {
    // This should theoretically not happen if initialization is correct.
    throw new Error('Firestore admin instance is not available. The application might not have started correctly.');
  }
  return { firestore: adminServices.firestore };
}
