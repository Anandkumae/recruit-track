
'use server';

import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore;

const serviceAccount = {
  "type": "service_account",
  "project_id": "studio-7488920972-4ef9c",
  "private_key_id": "624b3515ed778e98414c158ede3decc6ee7df5eb",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDFjjKFQIsbmBs0\ncBx/YhDBxm7kMvxqqy2OtxJSwkKmZSq0/byXq+7ejyrTHMDdo/syVaw+DeHTl669\nNCPsILM10wA5Hx4+OwLP6jO/hMP/J4U/5iZzD4DN2Y+8PrIHDu7eL4yoC08XcEBq\nRDaOhhNGB/+//+FH9rqWIXL4USM1+KTZRjdG9vIsrRq7P0dSuQYzb86w3FZGSH/R\n2ujRl2fyW//4Mn/vv36Pl9dnH9woRqKkkGpj5JrTbaw7Oe2pxOXQNuWpXWEr1hho\nFrwhst3N0lI/YuzjwDQv51fYJffzRGwzMlK4sR74MHFefn7qbqtu7BUaA/RzAyen\nCsC/R/Y7AgMBAAECggEALQLdF+dAyqS5bhUtKQja8IuZsHy9bkBaPO4RSrHgJbFf\nLaWyVoxh/Gt6QmeGufkmvq0udWUMUv14XruGg8Jfkp/kqR8h8OPZHC4sZDKHxZbn\nkUuK7yRVIJG1YhqWzWzll9IVpiQNfTWiN5QbKhX6RjaEWuaeGZtpn9M3MsSp1R3O\n+VQxJX01sQm2hS1VDqKqVmD1jkvLYsNc1icqdCsS1ONW1H0hBCejoSQ9qxdEJxNS\n5S8KOhXgQAyD0EWtRgCXn22Bu1zW9USbns3TGtxFhnxeST1sjBFsItx+Vy9PIJr2\nWyABTeGBP+ySVf5J8xAxdTaCErngfQLdnEeTOXRagQKBgQD0tsCEEq7B0KDyYvOr\ncuLjwRz++4Zd0esFhwnZt6K68wm2+9G+tqFrBV15N4a8Fueh2LVcRX6OVHGA45TC\n3y+GwzMkYvj/AEHY7s1jodtU75cE5W0l+MfNKGaXhaimqHOV50krekCAR5ItLVaq\nfdYfvpFedQBo4htxxQo4fAHE0QKBgQDOqqm6uAwylYaTe2jaauqfYIFga3Rj3ylv\nKB3JcCGuBtPmySa2Xah4Mss5XwmsiwlicSm5RN5uUr1JOorxq/dFrULTkf0z+z1G\nwMnCO/X5+UmNlLxqYZNiXHWwjg4dGy/nRJneyy51G3/ZB6fL5bxVjp1iETrmlmcD\nmIkClmW9SwKBgEFI8BtMEKtMSWPg2jkHMVipkF7GI5asBhM3b31R7GwLoq/ahp5m\ngrHWgJVyJtPPGISpF9lCAP1fsdg83tcOS9OcB+zRKrR9ERQawVivOaBzOsrnmjLj\nKAqnmJcb5V5w2kVHqtGaj9KpRWogClr5r0JQyN92P2G70K6NbqibDK3BAoGAD9Yo\nF3TPCnlGzLpiOIqE3B2rDFZvns+U/z2Vur/q9Mj1J/Q2ETdwF3Xc+NJ9jUlCONbv\nGZFbchzJAHmJ+CbzVdWHD2taecdA1NElJMsveC5QIpdJMOW1Q45OPm9ESZqxuwkY\nuWfccYDf9SOPCiLaobvB96fWWaEg17eymA4qUa0CgYBmxeLCbwMCH8MQn4Nkj85e\nZGlRs+IllHqnw3W4dX98H52RseRsSBf0/sYP+9ZFwUgJz9etOzZzOaU9O1pRhr37\nCjnPFGoOjfwd+F78QafA9cleJHvUwDQyUrwNmYInKHhonBWYotaNj03eI7ghK7lV\nAeuxwNL8X89nKFBv82hrlg==\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@studio-7488920972-4ef9c.iam.gserviceaccount.com",
  "client_id": "106876530727233003202",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40studio-7488920972-4ef9c.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This function is memoized to ensure it only runs once.
 */
const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'studio-7488920972-4ef9c.appspot.com',
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error);
    throw new Error(
      'Firebase Admin SDK could not be initialized. Check your service account credentials.'
    );
  }
};

// Initialize the app.
initializeAdminApp();

// Export the initialized firestore instance.
firestore = admin.firestore();

export { firestore };
