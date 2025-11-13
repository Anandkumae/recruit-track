
'use server';

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    let missingVars = [];
    if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
    if (!storageBucket) missingVars.push('FIREBASE_STORAGE_BUCKET');
    
    throw new Error(`Firebase Admin SDK initialization failed. The following environment variables are missing: ${missingVars.join(', ')}. Please check your .env file.`);
  }

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
    console.error("Firebase Admin initialization error after variables checked:", error);
    throw new Error(`Firebase Admin SDK could not be initialized even with environment variables. The service account credentials may be invalid. Please verify them in your Firebase project settings. Original error: ${error.message}`);
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
