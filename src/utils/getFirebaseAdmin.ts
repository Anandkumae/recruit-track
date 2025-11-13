let adminApp: any = null;

export async function getFirebaseAdmin() {
  // Lazy import to avoid RSC bundling
  const admin = await import("firebase-admin");

  if (!adminApp) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase admin environment variables");
    }

    if (!admin.apps.length) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      adminApp = admin.app();
    }
  }

  return {
    admin: (await import("firebase-admin")).default || (await import("firebase-admin")),
    db: adminApp.firestore(),
    storage: adminApp.storage(),
  };
}
