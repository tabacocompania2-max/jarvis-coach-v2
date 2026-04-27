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
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log('📡 Detectada variable FIREBASE_SERVICE_ACCOUNT, intentando procesar...');
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized from environment variable');
  } catch (error: any) {
    console.error('❌ Error al procesar FIREBASE_SERVICE_ACCOUNT (¿es un JSON válido?):', error.message);
  }
} else {
  console.warn('⚠️ No se encontró la variable FIREBASE_SERVICE_ACCOUNT en process.env');
  console.log('Variables disponibles (nombres):', Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('URL') && !k.includes('SECRET')));
}

export const auth = admin.auth();
