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
  
  console.log('✅ Firebase Admin initialized');
} else {
  console.warn('⚠️ firebase-adminsdk.json not found. Backend auth will fail.');
}

export const auth = admin.auth();
