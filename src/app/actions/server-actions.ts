'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getServerSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  teacherAttendanceSchema,
  mentorAttendanceSchema,
  leaveRequestSchema,
  announcementSchema,
  taskSchema,
  eventSchema,
  resourceSchema,
  studentReportSchema,
  quizSchema,
} from '@/lib/validations';
import type { TaskStatus } from '@/types';

async function checkRole(allowedRoles: string[]) {
  const session = await getServerSession();
  if (!session) throw new Error('Unauthorized');
  if (!allowedRoles.includes(session.role)) throw new Error('Forbidden');
  return session;
}

export async function markAttendance(data: z.infer<typeof teacherAttendanceSchema>) {
  const session = await checkRole(['teacher', 'both']);
  const validated = teacherAttendanceSchema.parse(data);

  const dateStr = new Date().toISOString().split('T')[0];
  const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const attendanceData = {
    teacherId: session.uid,
    teacherName: session.displayName || 'Unknown',
    email: session.email,
    status: validated.status,
    checkIn: checkInTime,
    date: dateStr,
    timestamp: new Date().toISOString(),
    location: validated.location,
  };

  await adminDb().collection('attendance').add(attendanceData);

  // Emit real-time event
  await adminDb().collection('activityLogs').add({
    action: 'attendance_marked',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Marked attendance as ${validated.status}`,
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/teacher/attendance');
  revalidatePath('/principal/attendance');
  return { success: true, data: attendanceData };
}

export async function markMentorAttendance(data: z.infer<typeof mentorAttendanceSchema>) {
  const session = await checkRole(['mentor', 'both']);
  const validated = mentorAttendanceSchema.parse(data);

  const dateStr = new Date().toISOString().split('T')[0];
  const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const attendanceData = {
    mentorId: session.uid,
    mentorName: session.displayName || 'Unknown',
    email: session.email,
    studyHour: validated.studyHour,
    topic: validated.topic,
    notes: validated.notes,
    studentCount: validated.studentCount,
    sectionId: validated.sectionId,
    checkIn: checkInTime,
    date: dateStr,
    timestamp: new Date().toISOString(),
  };

  await adminDb().collection('mentorAttendance').add(attendanceData);

  await adminDb().collection('activityLogs').add({
    action: 'session_logged',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Logged study hour ${validated.studyHour}: ${validated.topic}`,
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/mentor/attendance');
  revalidatePath('/principal/attendance');
  return { success: true, data: attendanceData };
}

export async function requestLeave(data: z.infer<typeof leaveRequestSchema>) {
  const session = await checkRole(['teacher', 'mentor', 'both']);
  const validated = leaveRequestSchema.parse(data);

  const start = new Date(validated.startDate);
  const end = new Date(validated.endDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const leaveData = {
    teacherId: session.uid,
    teacherName: session.displayName || 'Unknown',
    email: session.email,
    type: validated.type,
    startDate: validated.startDate,
    endDate: validated.endDate,
    reason: validated.reason,
    status: 'pending' as const,
    days,
    appliedOn: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  };

  const docRef = await adminDb().collection('leaveRequests').add(leaveData);

  await adminDb().collection('activityLogs').add({
    action: 'leave_requested',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Requested ${validated.type} leave for ${days} day(s)`,
    metadata: { leaveId: docRef.id },
    timestamp: new Date().toISOString(),
  });

  // Create notification for principal
  await adminDb().collection('notifications').add({
    userId: 'principal',
    title: 'New Leave Request',
    message: `${session.displayName} requested ${validated.type} leave for ${days} day(s)`,
    type: 'leave',
    isRead: false,
    actionUrl: '/principal/leave',
    metadata: { leaveId: docRef.id, teacherId: session.uid },
    createdAt: new Date().toISOString(),
  });

  revalidatePath('/teacher/leave');
  revalidatePath('/principal/leave');
  return { success: true, data: { ...leaveData, id: docRef.id } };
}

export async function approveLeave(leaveId: string) {
  const session = await checkRole(['principal']);
  const leaveRef = adminDb().collection('leaveRequests').doc(leaveId);
  const leaveDoc = await leaveRef.get();

  if (!leaveDoc.exists) throw new Error('Leave request not found');

  await leaveRef.update({
    status: 'approved',
    approvedBy: session.uid,
    approvalDate: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  });

  const leaveData = leaveDoc.data();
  await adminDb().collection('notifications').add({
    userId: leaveData?.teacherId,
    title: 'Leave Approved',
    message: `Your ${leaveData?.type} leave request has been approved`,
    type: 'leave',
    isRead: false,
    actionUrl: '/teacher/leave',
    metadata: { leaveId, status: 'approved' },
    createdAt: new Date().toISOString(),
  });

  await adminDb().collection('activityLogs').add({
    action: 'leave_approved',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Approved leave request for ${leaveData?.teacherName}`,
    metadata: { leaveId },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/principal/leave');
  revalidatePath('/teacher/leave');
  return { success: true };
}

export async function rejectLeave(leaveId: string, reason: string) {
  const session = await checkRole(['principal']);
  const leaveRef = adminDb().collection('leaveRequests').doc(leaveId);
  const leaveDoc = await leaveRef.get();

  if (!leaveDoc.exists) throw new Error('Leave request not found');

  await leaveRef.update({
    status: 'rejected',
    approvedBy: session.uid,
    rejectionReason: reason,
    approvalDate: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  });

  const leaveData = leaveDoc.data();
  await adminDb().collection('notifications').add({
    userId: leaveData?.teacherId,
    title: 'Leave Rejected',
    message: `Your leave request was rejected. Reason: ${reason}`,
    type: 'leave',
    isRead: false,
    actionUrl: '/teacher/leave',
    metadata: { leaveId, status: 'rejected', rejectionReason: reason },
    createdAt: new Date().toISOString(),
  });

  await adminDb().collection('activityLogs').add({
    action: 'leave_rejected',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Rejected leave request for ${leaveData?.teacherName}. Reason: ${reason}`,
    metadata: { leaveId },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/principal/leave');
  revalidatePath('/teacher/leave');
  return { success: true };
}

export async function createAnnouncement(data: z.infer<typeof announcementSchema>) {
  const session = await checkRole(['principal']);
  const validated = announcementSchema.parse(data);

  const announcementData = {
    ...validated,
    publishedBy: session.uid,
    publisherName: session.displayName || 'Principal',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await adminDb().collection('announcements').add(announcementData);

  // Create notifications for target roles
  const notificationBatch = adminDb().batch();
  const usersSnapshot = await adminDb().collection('users').get();
  
  usersSnapshot.docs.forEach((userDoc) => {
    const user = userDoc.data();
    if (validated.targetRoles.includes(user.role)) {
      const notificationRef = adminDb().collection('notifications').doc();
      notificationBatch.set(notificationRef, {
        userId: userDoc.id,
        title: `New ${validated.type}: ${validated.title}`,
        message: validated.content,
        type: 'announcement',
        isRead: false,
        actionUrl: `/${user.role}/announcements`,
        metadata: { announcementId: docRef.id },
        createdAt: new Date().toISOString(),
      });
    }
  });
  await notificationBatch.commit();

  await adminDb().collection('activityLogs').add({
    action: 'announcement_created',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Created ${validated.type} announcement: ${validated.title}`,
    metadata: { announcementId: docRef.id },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/principal/announcements');
  revalidatePath('/teacher/announcements');
  revalidatePath('/mentor/announcements');
  return { success: true, data: { ...announcementData, id: docRef.id } };
}

export async function updateAnnouncement(id: string, data: Partial<z.infer<typeof announcementSchema>>) {
  const session = await checkRole(['principal']);
  const validated = announcementSchema.partial().parse(data);

  await adminDb().collection('announcements').doc(id).update({
    ...validated,
    updatedAt: new Date().toISOString(),
  });

  await adminDb().collection('activityLogs').add({
    action: 'announcement_updated',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Updated announcement`,
    metadata: { announcementId: id },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/principal/announcements');
  revalidatePath('/teacher/announcements');
  revalidatePath('/mentor/announcements');
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const session = await checkRole(['principal']);
  await adminDb().collection('announcements').doc(id).delete();

  await adminDb().collection('activityLogs').add({
    action: 'announcement_deleted',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Deleted announcement`,
    metadata: { announcementId: id },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/principal/announcements');
  revalidatePath('/teacher/announcements');
  revalidatePath('/mentor/announcements');
  return { success: true };
}

export async function createTask(data: z.infer<typeof taskSchema>) {
  const session = await checkRole(['principal']);
  const validated = taskSchema.parse(data);

  // Get assignee details
  const assigneeDoc = await adminDb().collection('users').doc(validated.assignedTo).get();
  const assigneeData = assigneeDoc.data();

  const taskData = {
    ...validated,
    assignedToName: assigneeData?.fullName || 'Unknown',
    assignedBy: session.uid,
    assignedByName: session.displayName || 'Principal',
    status: 'pending' as TaskStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await adminDb().collection('tasks').add(taskData);

  await adminDb().collection('notifications').add({
    userId: validated.assignedTo,
    title: 'New Task Assigned',
    message: `${session.displayName} assigned you: ${validated.title}`,
    type: 'task',
    isRead: false,
    actionUrl: '/teacher/tasks',
    metadata: { taskId: docRef.id },
    createdAt: new Date().toISOString(),
  });

  await adminDb().collection('activityLogs').add({
    action: 'task_created',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Assigned task to ${assigneeData?.fullName}: ${validated.title}`,
    metadata: { taskId: docRef.id },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/principal/tasks');
  revalidatePath('/teacher/tasks');
  revalidatePath('/mentor/tasks');
  return { success: true, data: { ...taskData, id: docRef.id } };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const session = await getServerSession();
  if (!session) throw new Error('Unauthorized');

  const updateData: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
  if (status === 'completed') updateData.completedAt = new Date().toISOString();

  await adminDb().collection('tasks').doc(taskId).update(updateData);

  const taskDoc = await adminDb().collection('tasks').doc(taskId).get();
  const taskData = taskDoc.data();

  await adminDb().collection('activityLogs').add({
    action: status === 'completed' ? 'task_completed' : 'task_updated',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `${session.displayName} marked task "${taskData?.title}" as ${status}`,
    metadata: { taskId, status },
    timestamp: new Date().toISOString(),
  });

  // Notify principal if teacher completes task
  if (session.role !== 'principal' && status === 'completed') {
    await adminDb().collection('notifications').add({
      userId: 'principal',
      title: 'Task Completed',
      message: `${session.displayName} completed: ${taskData?.title}`,
      type: 'task',
      isRead: false,
      actionUrl: '/principal/tasks',
      metadata: { taskId },
      createdAt: new Date().toISOString(),
    });
  }

  revalidatePath('/principal/tasks');
  revalidatePath('/teacher/tasks');
  revalidatePath('/mentor/tasks');
  return { success: true };
}

export async function createEvent(data: z.infer<typeof eventSchema>) {
  const session = await checkRole(['principal']);
  const validated = eventSchema.parse(data);

  const eventData = {
    ...validated,
    createdBy: session.uid,
    createdByName: session.displayName || 'Principal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await adminDb().collection('events').add(eventData);

  // Create notifications for target roles
  const usersSnapshot = await adminDb().collection('users').get();
  const notificationBatch = adminDb().batch();
  
  usersSnapshot.docs.forEach((userDoc) => {
    const user = userDoc.data();
    if (validated.targetRoles.includes(user.role)) {
      const notificationRef = adminDb().collection('notifications').doc();
      notificationBatch.set(notificationRef, {
        userId: userDoc.id,
        title: 'New Event',
        message: `${session.displayName} created: ${validated.title}`,
        type: 'event',
        isRead: false,
        actionUrl: `/${user.role}/calendar`,
        metadata: { eventId: docRef.id },
        createdAt: new Date().toISOString(),
      });
    }
  });
  await notificationBatch.commit();

  await adminDb().collection('activityLogs').add({
    action: 'event_created',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Created event: ${validated.title}`,
    metadata: { eventId: docRef.id },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/principal/calendar');
  revalidatePath('/teacher/calendar');
  revalidatePath('/mentor/calendar');
  return { success: true, data: { ...eventData, id: docRef.id } };
}

export async function uploadResource(data: z.infer<typeof resourceSchema>) {
  const session = await checkRole(['principal']);
  const validated = resourceSchema.parse(data);

  const resourceData = {
    ...validated,
    uploadedBy: session.uid,
    uploadedByName: session.displayName || 'Principal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await adminDb().collection('resources').add(resourceData);

  const usersSnapshot = await adminDb().collection('users').get();
  const notificationBatch = adminDb().batch();
  
  usersSnapshot.docs.forEach((userDoc) => {
    const user = userDoc.data();
    if (validated.targetRoles.includes(user.role)) {
      const notificationRef = adminDb().collection('notifications').doc();
      notificationBatch.set(notificationRef, {
        userId: userDoc.id,
        title: 'New Resource Uploaded',
        message: `${session.displayName} uploaded: ${validated.title}`,
        type: 'resource',
        isRead: false,
        actionUrl: `/${user.role}/resources`,
        metadata: { resourceId: docRef.id },
        createdAt: new Date().toISOString(),
      });
    }
  });
  await notificationBatch.commit();

  await adminDb().collection('activityLogs').add({
    action: 'resource_uploaded',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Uploaded resource: ${validated.title}`,
    metadata: { resourceId: docRef.id },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/principal/resources');
  revalidatePath('/teacher/resources');
  revalidatePath('/mentor/resources');
  return { success: true, data: { ...resourceData, id: docRef.id } };
}

export async function createStudentReport(data: z.infer<typeof studentReportSchema>) {
  const session = await checkRole(['mentor', 'both']);
  const validated = studentReportSchema.parse(data);

  const studentDoc = await adminDb().collection('students').doc(validated.studentId).get();
  const studentData = studentDoc.data();

  const reportData = {
    ...validated,
    mentorId: session.uid,
    mentorName: session.displayName || 'Unknown',
    studentName: studentData?.name || 'Unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await adminDb().collection('studentReports').add(reportData);

  await adminDb().collection('activityLogs').add({
    action: 'student_report_created',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Created report for ${studentData?.name}: ${validated.topic}`,
    metadata: { reportId: docRef.id, studentId: validated.studentId },
    timestamp: new Date().toISOString(),
  });

  // Notify principal
  await adminDb().collection('notifications').add({
    userId: 'principal',
    title: 'New Student Report',
    message: `${session.displayName} created report for ${studentData?.name}`,
    type: 'student_report',
    isRead: false,
    actionUrl: '/principal/reports',
    metadata: { reportId: docRef.id },
    createdAt: new Date().toISOString(),
  });

  revalidatePath('/mentor/reports');
  revalidatePath('/principal/reports');
  return { success: true, data: { ...reportData, id: docRef.id } };
}

export async function createQuiz(data: z.infer<typeof quizSchema>) {
  const session = await checkRole(['teacher', 'both']);
  const validated = quizSchema.parse(data);

  const quizData = {
    ...validated,
    teacherId: session.uid,
    teacherName: session.displayName || 'Unknown',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await adminDb().collection('quizzes').add(quizData);

  await adminDb().collection('activityLogs').add({
    action: 'quiz_created',
    userId: session.uid,
    userName: session.displayName,
    userRole: session.role,
    details: `Created quiz: ${validated.name}`,
    metadata: { quizId: docRef.id },
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/teacher/quiz');
  revalidatePath('/principal/quizzes');
  return { success: true, data: { ...quizData, id: docRef.id } };
}