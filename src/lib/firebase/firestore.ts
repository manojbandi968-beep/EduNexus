// ============================================
// CollegeDost — Firestore Helpers
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
  type WhereFilterOp,
} from 'firebase/firestore';
import { db } from './config';

// ---- Collection Names ----
export const COLLECTIONS = {
  USERS: 'users',
  TEACHERS: 'teachers',
  STUDENTS: 'students',
  SUBJECTS: 'subjects',
  SECTIONS: 'sections',
  STREAMS: 'streams',
  TIMETABLES: 'timetables',
  ATTENDANCE: 'attendance',
  STUDENT_ATTENDANCE: 'studentAttendance',
  MENTOR_ATTENDANCE: 'mentorAttendance',
  QUIZZES: 'quizzes',
  QUIZ_RESULTS: 'quizResults',
  ANNOUNCEMENTS: 'announcements',
  LEAVE_REQUESTS: 'leaveRequests',
  NOTIFICATIONS: 'notifications',
  PERFORMANCE: 'performance',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'auditLogs',
  EVENTS: 'events',
} as const;

// ---- Generic CRUD Operations ----

export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

// ---- Query Helpers ----

export function whereClause(field: string, operator: WhereFilterOp, value: unknown) {
  return where(field, operator, value);
}

export function orderByClause(field: string, direction: 'asc' | 'desc' = 'asc') {
  return orderBy(field, direction);
}

export function limitClause(count: number) {
  return limit(count);
}

// ---- Real-time Listeners ----

export function subscribeToCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
    callback(data);
  });
}

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...snapshot.data() } as T);
  });
}
