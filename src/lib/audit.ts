// ============================================
// CollegeDost — Audit Logging
// ============================================

import { adminDb } from '@/lib/firebase/admin';
import { type AuditAction, type UserRole } from '@/types';

export interface AuditLogEntry {
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const db = adminDb();
    await db.collection('auditLogs').add({
      ...entry,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

export async function logLoginAttempt(params: {
  email: string;
  success: boolean;
  role: UserRole;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  device?: string;
}): Promise<void> {
  await logAuditEvent({
    action: params.success ? 'login' : 'login_failed',
    userId: params.email,
    userName: params.email,
    userRole: params.role,
    details: params.success
      ? `Successful login as ${params.role}`
      : `Failed login attempt as ${params.role}`,
    metadata: {
      browser: params.browser,
      device: params.device,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}
