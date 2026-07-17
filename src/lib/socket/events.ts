export const SOCKET_EVENTS = {
  // Teacher -> Server
  TEACHER_MARK_ATTENDANCE: 'teacher:mark-attendance',
  TEACHER_START_QUIZ: 'teacher:start-quiz',
  TEACHER_START_CLASS: 'teacher:start-class',
  TEACHER_REQUEST_LEAVE: 'teacher:request-leave',
  TEACHER_LOG_SESSION: 'teacher:log-session',
  TEACHER_END_QUIZ: 'teacher:end-quiz',

  // Principal -> Server
  PRINCIPAL_CREATE_ANNOUNCEMENT: 'principal:create-announcement',
  PRINCIPAL_UPDATE_ANNOUNCEMENT: 'principal:update-announcement',
  PRINCIPAL_DELETE_ANNOUNCEMENT: 'principal:delete-announcement',
  PRINCIPAL_APPROVE_LEAVE: 'principal:approve-leave',
  PRINCIPAL_REJECT_LEAVE: 'principal:reject-leave',
  PRINCIPAL_ASSIGN_TASK: 'principal:assign-task',
  PRINCIPAL_CREATE_EVENT: 'principal:create-event',
  PRINCIPAL_UPLOAD_RESOURCE: 'principal:upload-resource',

  // Server -> All (Real-time broadcasts)
  ATTENDANCE_UPDATED: 'attendance:updated',
  QUIZ_STARTED: 'quiz:started',
  QUIZ_ENDED: 'quiz:ended',
  CLASS_STARTED: 'class:started',
  LEAVE_REQUESTED: 'leave:requested',
  LEAVE_APPROVED: 'leave:approved',
  LEAVE_REJECTED: 'leave:rejected',
  ANNOUNCEMENT_CREATED: 'announcement:created',
  ANNOUNCEMENT_UPDATED: 'announcement:updated',
  ANNOUNCEMENT_DELETED: 'announcement:deleted',
  TASK_ASSIGNED: 'task:assigned',
  TASK_UPDATED: 'task:updated',
  TASK_COMPLETED: 'task:completed',
  EVENT_CREATED: 'event:created',
  EVENT_UPDATED: 'event:updated',
  RESOURCE_UPLOADED: 'resource:uploaded',
  SESSION_LOGGED: 'session:logged',
  NOTIFICATION_CREATED: 'notification:created',
  ACTIVITY_LOGGED: 'activity:logged',
  STUDENT_REPORT_CREATED: 'student-report:created',

  // Teacher Activity (for Principal dashboard)
  TEACHER_ACTIVITY: 'teacher:activity',
} as const;

export interface TeacherActivityPayload {
  teacherName: string;
  action: string;
  details?: string;
  timestamp: number;
  type: 'attendance' | 'quiz' | 'class' | 'leave' | 'system' | 'session' | 'resource';
}

export interface AttendanceUpdatedPayload {
  teacherName: string;
  teacherId: string;
  status: 'present' | 'late' | 'absent';
  checkInTime: string;
  date: string;
  timestamp: number;
  location?: { lat: number; lng: number };
  inCollege?: boolean;
}

export interface QuizStartedPayload {
  teacherName: string;
  teacherId: string;
  subject: string;
  section: string;
  stream: string;
  timestamp: number;
}

export interface QuizEndedPayload {
  teacherName: string;
  teacherId: string;
  topic: string;
  totalStudents: number;
  timestamp: number;
  istTime: string;
}

export interface LeaveRequestedPayload {
  teacherId: string;
  teacherName: string;
  type: 'casual' | 'sick' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  days: number;
  appliedOn: string;
  timestamp: number;
}

export interface LeaveStatusPayload {
  leaveId: string;
  teacherId: string;
  teacherName: string;
  status: 'approved' | 'rejected';
  approvedBy?: string;
  rejectionReason?: string;
  timestamp: number;
}

export interface AnnouncementPayload {
  id: string;
  title: string;
  content: string;
  type: 'notice' | 'holiday' | 'meeting' | 'exam' | 'emergency';
  publishedBy: string;
  publisherName: string;
  targetRoles: ('principal' | 'teacher' | 'mentor' | 'both')[];
  targetStreams?: ('MPC' | 'BiPC' | 'CEC')[];
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  timestamp: number;
}

export interface TaskPayload {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedByName: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  timestamp: number;
}

export interface EventPayload {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'academic' | 'holiday' | 'meeting' | 'event' | 'exam';
  targetRoles: ('principal' | 'teacher' | 'mentor' | 'both')[];
  createdBy: string;
  createdByName: string;
  timestamp: number;
}

export interface ResourcePayload {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  targetRoles: ('principal' | 'teacher' | 'mentor' | 'both')[];
  targetStreams?: ('MPC' | 'BiPC' | 'CEC')[];
  targetSections?: string[];
  createdAt: string;
  timestamp: number;
}

export interface SessionLoggedPayload {
  mentorId: string;
  mentorName: string;
  studyHour: 1 | 2;
  topic: string;
  notes?: string;
  studentCount: number;
  sectionId?: string;
  date: string;
  checkInTime: string;
  timestamp: number;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  timestamp: number;
}

export interface ActivityLoggedPayload {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: 'principal' | 'teacher' | 'mentor' | 'both';
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface StudentReportPayload {
  id: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  sessionDate: string;
  topic: string;
  observations: string;
  studentProgress: 'excellent' | 'good' | 'average' | 'needs_improvement';
  createdAt: string;
  timestamp: number;
}