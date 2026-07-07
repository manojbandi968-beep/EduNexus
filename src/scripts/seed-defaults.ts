// ============================================
// CollegeDost — Seed Default Data
// ============================================
// Seeds default schedule, streams, sections, and subjects
// Usage: npx ts-node --skip-project src/scripts/seed-defaults.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DEFAULT_SCHEDULE, DEFAULT_SUBJECTS, DEFAULT_SECTIONS } from '../lib/constants';

async function seedDefaults() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  const app = initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(app);

  console.log('🔧 Seeding default data...\n');

  try {
    // Seed Streams
    const streams = [
      {
        code: 'MPC',
        name: 'MPC',
        fullName: 'Mathematics, Physics, Chemistry',
        description: 'IIT-JEE Preparation',
        color: '#6366f1',
      },
      {
        code: 'BiPC',
        name: 'BiPC',
        fullName: 'Biology, Physics, Chemistry',
        description: 'NEET Preparation',
        color: '#10b981',
      },
      {
        code: 'CEC',
        name: 'CEC',
        fullName: 'Commerce, Economics, Civics',
        description: 'Commerce Stream',
        color: '#f59e0b',
      },
    ];

    for (const stream of streams) {
      await db.collection('streams').doc(stream.code).set({
        ...stream,
        sections: DEFAULT_SECTIONS.filter((s) => s.streamCode === stream.code).map((s) => s.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log('✅ Streams seeded (MPC, BiPC, CEC)');

    // Seed Sections
    for (const section of DEFAULT_SECTIONS) {
      await db.collection('sections').doc(section.name).set({
        ...section,
        currentStrength: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log('✅ Sections seeded (' + DEFAULT_SECTIONS.length + ' sections)');

    // Seed Subjects
    for (const subject of DEFAULT_SUBJECTS) {
      await db.collection('subjects').doc(subject.code).set({
        ...subject,
        assignedTeachers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log('✅ Subjects seeded (' + DEFAULT_SUBJECTS.length + ' subjects)');

    // Seed Default Schedule
    await db.collection('settings').doc('schedule').set({
      timeSlots: DEFAULT_SCHEDULE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Default schedule seeded (' + DEFAULT_SCHEDULE.length + ' time slots)');

    // Seed Default Settings
    await db.collection('settings').doc('institution').set({
      collegeName: 'EduNexus Academy',
      address: '',
      academicYear: '2025-2026',
      campusLocation: { latitude: 0, longitude: 0 },
      geofenceRadius: 200,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      holidays: [],
      lateCheckInWindow: 10,
      attendanceRules: {
        minAttendancePercentage: 75,
        lateThresholdMinutes: 10,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Institution settings seeded');

    console.log('\n🎉 All default data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding defaults:', error);
    process.exit(1);
  }
}

seedDefaults();
