// ============================================
// CollegeDost — Seed Principal Account
// ============================================
// Run this script ONCE to create the initial Principal account
// Usage: npx ts-node --skip-project src/scripts/seed-principal.ts

// Note: This script requires firebase-admin to be configured
// with proper service account credentials.

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

async function seedPrincipal() {
  // Initialize Firebase Admin
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  const app = initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth(app);
  const db = getFirestore(app);

  const principalEmail = process.env.PRINCIPAL_EMAIL || 'principal@collegedost.com';
  const principalPassword = process.env.PRINCIPAL_PASSWORD || 'CollegeDost@2025';
  const principalPin = process.env.PRINCIPAL_SECURITY_PIN || '123456';

  console.log('🔧 Seeding Principal account...');

  try {
    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(principalEmail);
      console.log('ℹ️  Firebase Auth user already exists');
    } catch {
      firebaseUser = await auth.createUser({
        email: principalEmail,
        password: principalPassword,
        displayName: 'Principal',
        emailVerified: true,
      });
      console.log('✅ Firebase Auth user created');
    }

    // Set custom claims
    await auth.setCustomUserClaims(firebaseUser.uid, { role: 'principal' });
    console.log('✅ Custom claims set (role: principal)');

    // Create Firestore user document (using Auth UID as document ID)
    const principalDoc = await db.collection('users').doc(firebaseUser.uid).get();

    if (!principalDoc.exists) {
      await db.collection('users').doc(firebaseUser.uid).set({
        fullName: 'Principal',
        email: principalEmail,
        securityPin: principalPin,
        phone: '',
        role: 'principal',
        status: 'approved',
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ Firestore user document created');
    } else {
      console.log('ℹ️  Firestore user document already exists');
    }

    console.log('\n🎉 Principal account seeded successfully!');
    console.log(`   Email: ${principalEmail}`);
    console.log(`   PIN: ${principalPin}`);
    console.log('\n⚠️  CHANGE THESE CREDENTIALS IN PRODUCTION!');
  } catch (error) {
    console.error('❌ Error seeding principal:', error);
    process.exit(1);
  }
}

seedPrincipal();
