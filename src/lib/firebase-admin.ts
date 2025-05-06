
import * as admin from 'firebase-admin';

// Path to your service account key JSON file
// IMPORTANT: Store this securely, ideally using environment variables.
// DO NOT commit the actual key file to your repository.
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
// OR directly use environment variables for credentials:
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Use `new Buffer.from(privateKey, 'base64').toString('ascii')` if storing base64 encoded key
  // Replace newline characters literal '\n' with actual newlines
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

try {
  if (!admin.apps.length) {
      if (serviceAccount.privateKey && serviceAccount.clientEmail) {
           admin.initializeApp({
             credential: admin.credential.cert(serviceAccount),
             // Optional: databaseURL if using Realtime Database
             // databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
           });
           console.log("Firebase Admin SDK initialized with environment variables.");
      } else if(serviceAccountPath) {
           admin.initializeApp({
               credential: admin.credential.cert(serviceAccountPath),
           });
           console.log("Firebase Admin SDK initialized with service account file.");
      } else {
           console.warn("Firebase Admin SDK not initialized: Missing credentials (service account path or specific env vars). Middleware authentication might fail.");
      }

  }
} catch (error: any) {
  console.error('Firebase Admin initialization error:', error.stack);
}

export default admin; // Export initialized admin instance
export const auth = admin.auth; // Export auth service
export const firestore = admin.firestore; // Export firestore service (optional)
