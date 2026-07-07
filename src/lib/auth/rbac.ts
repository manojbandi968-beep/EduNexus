// ============================================
// CollegeDost — Role-Based Access Control
// ============================================

import { type UserRole } from '@/types';
import { verifySession, type SessionUser } from './session';

// ---- Permission Matrix ----

const PERMISSIONS: Record<string, UserRole[]> = {
  // Principal-only
  'manage:teachers': ['principal'],
  'manage:students': ['principal'],
  'manage:subjects': ['principal'],
  'manage:sections': ['principal'],
  'manage:timetable': ['principal'],
  'manage:settings': ['principal'],
  'manage:announcements': ['principal'],
  'view:audit-logs': ['principal'],
  'view:reports': ['principal'],
  'view:teacher-performance': ['principal'],
  'approve:leave': ['principal'],
  'approve:teachers': ['principal'],

  // Teacher permissions
  'mark:attendance': ['principal', 'teacher', 'both'],
  'create:quiz': ['principal', 'teacher', 'both'],
  'request:leave': ['teacher', 'both'],
  'view:timetable': ['principal', 'teacher', 'mentor', 'both'],
  'view:announcements': ['principal', 'teacher', 'mentor', 'both'],

  // Mentor permissions
  'mark:mentor-attendance': ['principal', 'mentor', 'both'],
  'log:study-hour': ['principal', 'mentor', 'both'],

  // Shared
  'view:dashboard': ['principal', 'teacher', 'mentor', 'both'],
  'view:own-profile': ['principal', 'teacher', 'mentor', 'both'],
};

// ---- Check Permission ----

export function hasPermission(role: UserRole, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

// ---- Require Role (for Server Actions) ----

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const session = await verifySession();

  if (!session) {
    throw new Error('UNAUTHORIZED: Not authenticated');
  }

  // 'both' role matches both 'teacher' and 'mentor'
  const effectiveRoles: UserRole[] = [session.role];
  if (session.role === 'both') {
    effectiveRoles.push('teacher', 'mentor');
  }

  const hasRole = roles.some((role) => effectiveRoles.includes(role));

  if (!hasRole) {
    throw new Error(`FORBIDDEN: Required role: ${roles.join(' or ')}`);
  }

  return session;
}

// ---- Require Principal ----

export async function requirePrincipal(): Promise<SessionUser> {
  return requireRole('principal');
}

// ---- Require Teacher ----

export async function requireTeacher(): Promise<SessionUser> {
  return requireRole('teacher', 'both');
}

// ---- Require Mentor ----

export async function requireMentor(): Promise<SessionUser> {
  return requireRole('mentor', 'both');
}

// ---- Require Any Authenticated User ----

export async function requireAuth(): Promise<SessionUser> {
  const session = await verifySession();
  if (!session) {
    throw new Error('UNAUTHORIZED: Not authenticated');
  }
  return session;
}

// ---- Get Role Dashboard Path ----

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'principal':
      return '/principal';
    case 'teacher':
      return '/teacher';
    case 'mentor':
      return '/mentor';
    case 'both':
      return '/teacher'; // Default to teacher dashboard for dual-role users
    default:
      return '/';
  }
}
