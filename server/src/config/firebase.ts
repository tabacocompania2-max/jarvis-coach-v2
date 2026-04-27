import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// En CommonJS (que estamos usando ahora) __dirname está disponible.
// Si estuviéramos en ESM, usaríamos fileURLToPath(import.meta.url)

const serviceAccountPath = path.join(process.cwd(), 'firebase-adminsdk.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized from JSON file');
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized from environment variable');
  } catch (error) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', error);
  }
} else {
  console.warn('⚠️ Firebase configuration missing (no JSON file or env var). Backend auth will fail.');
}

export const auth = admin.auth();
