import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
// Si estuviéramos en ESM, usaríamos fileURLToPath(import.meta.url)

const serviceAccountPath = path.join(process.cwd(), 'firebase-adminsdk.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized from JSON file');
} else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized from individual env vars');
  } catch (error: any) {
    console.error('❌ Error initializing Firebase with individual env vars:', error.message);
  }
} else {
  console.warn('⚠️ Firebase configuration missing (no JSON file or individual env vars).');
}

export const auth = admin.auth();
