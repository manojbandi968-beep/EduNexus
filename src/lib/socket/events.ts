export const SOCKET_EVENTS = {
  // Teacher -> Server
  TEACHER_MARK_ATTENDANCE: 'teacher:mark-attendance',
  TEACHER_START_QUIZ: 'teacher:start-quiz',
  TEACHER_START_CLASS: 'teacher:start-class',

  // Server -> Principal
  TEACHER_ACTIVITY: 'teacher:activity',
  ATTENDANCE_UPDATED: 'attendance:updated',
  QUIZ_STARTED: 'quiz:started',
} as const;

export interface TeacherActivityPayload {
  teacherName: string;
  action: string;
  details?: string;
  timestamp: number;
  type: 'attendance' | 'quiz' | 'class' | 'system';
}

export interface AttendanceUpdatedPayload {
  teacherName: string;
  status: 'present' | 'late' | 'absent';
  timestamp: number;
}

export interface QuizStartedPayload {
  teacherName: string;
  subject: string;
  section: string;
  timestamp: number;
}
