import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getAdminApp(): App | null {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      _app = initializeApp({ credential: cert(serviceAccount) });
      return _app;
    } catch {
      console.error('Failed to initialize Firebase Admin with FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  }

  return _app;
}

export function adminAuth(): Auth {
  if (_auth) return _auth;
  const app = getAdminApp();
  if (!app) throw new Error('Firebase Admin not initialized — set FIREBASE_SERVICE_ACCOUNT_KEY');
  _auth = getAuth(app);
  return _auth;
}

export function adminDb(): Firestore {
  if (_db) return _db;
  const app = getAdminApp();
  if (!app) throw new Error('Firebase Admin not initialized — set FIREBASE_SERVICE_ACCOUNT_KEY');
  _db = getFirestore(app);
  return _db;
}

export default getAdminApp;
