
'use server';

import * as admin from "firebase-admin";

let app: admin.app.App;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("❌ Missing Firebase Admin environment variables");
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error("❌ Firebase Admin SDK failed to initialize:", error);
    throw error;
  }
} else {
  app = admin.app();
}

export const adminDb = app.firestore();
export const adminStorage = app.storage();
