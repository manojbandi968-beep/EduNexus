// ============================================
// CollegeDost — TypeScript Type Definitions
// ============================================

// ---- Enums & Constants ----

export type UserRole = 'principal' | 'teacher' | 'mentor' | 'both';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'disabled';
export type AttendanceStatus = 'present' | 'late' | 'absent';
export type LeaveType = 'casual' | 'sick' | 'emergency';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type AnnouncementType = 'notice' | 'holiday' | 'meeting' | 'exam' | 'emergency';
export type StreamCode = 'MPC' | 'BiPC' | 'CEC';
export type Gender = 'male' | 'female' | 'other';
export type StudentStatus = 'active' | 'inactive' | 'transferred';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'attendance_marked'
  | 'attendance_edited'
  | 'quiz_created'
  | 'quiz_edited'
  | 'quiz_deleted'
  | 'timetable_created'
  | 'timetable_edited'
  | 'teacher_approved'
  | 'teacher_rejected'
  | 'teacher_disabled'
  | 'leave_requested'
  | 'leave_approved'
  | 'leave_rejected'
  | 'announcement_created'
  | 'announcement_deleted'
  | 'student_created'
  | 'student_edited'
  | 'student_deleted'
  | 'settings_updated'
  | 'principal_action';

// ---- Base Types ----

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// ---- User & Auth ----

export interface User extends Timestamps {
  id: string;
  uid: string; // Firebase Auth UID
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  photoURL?: string;
  subject?: string;
  stream?: StreamCode;
  lastLogin?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
}

export interface PrincipalUser extends User {
  role: 'principal';
  securityPin: string; // hashed
}

export interface TeacherUser extends User {
  role: 'teacher' | 'both';
  subject: string;
  stream: StreamCode;
  assignedSections: string[];
}

export interface MentorUser extends User {
  role: 'mentor' | 'both';
  assignedBatches: string[];
  stream: StreamCode;
}

// ---- Students ----

export interface Student extends Timestamps {
  id: string;
  rollNumber: string;
  name: string;
  stream: StreamCode;
  section: string;
  admissionNumber: string;
  parentMobile: string;
  studentMobile?: string;
  gender: Gender;
  batch: string;
  photoURL?: string;
  status: StudentStatus;
}

// ---- Streams & Sections ----

export interface Stream {
  id: string;
  code: StreamCode;
  name: string;
  description: string;
  color: string;
  sections: string[];
}

export interface Section extends Timestamps {
  id: string;
  name: string; // e.g., "MPC-A"
  streamCode: StreamCode;
  capacity: number;
  currentStrength: number;
}

// ---- Subjects ----

export interface Subject extends Timestamps {
  id: string;
  name: string;
  code: string;
  streams: StreamCode[];
  assignedTeachers: string[]; // User IDs
}

// ---- Schedule & Timetable ----

export interface TimeSlot {
  id: string;
  label: string; // "Period 1", "Break", etc.
  startTime: string; // "07:00"
  endTime: string; // "08:00"
  type: 'period' | 'break' | 'lunch' | 'snacks' | 'dinner' | 'study_hour';
}

export interface TimetableEntry extends Timestamps {
  id: string;
  dayOfWeek: DayOfWeek;
  timeSlotId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  roomNumber?: string;
  isSubstitution: boolean;
  originalTeacherId?: string;
  effectiveDate?: string; // For one-time substitutions
  weeklyRecurring: boolean;
}

export interface Timetable extends Timestamps {
  id: string;
  name: string;
  academicYear: string;
  isActive: boolean;
  entries: TimetableEntry[];
}

// ---- Attendance ----

export interface TeacherAttendance extends Timestamps {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  device?: string;
  userAgent?: string;
  isWithinGeofence?: boolean;
}

export interface MentorAttendance extends Timestamps {
  id: string;
  mentorId: string;
  mentorName: string;
  date: string;
  studyHour: 1 | 2;
  checkInTime: string;
  topic: string;
  notes?: string;
  studentCount: number;
  duration?: number; // minutes
  sectionId?: string;
}

// ---- Quizzes ----

export interface Quiz extends Timestamps {
  id: string;
  name: string;
  topic: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  sectionId: string;
  questionCount: number;
  date: string;
  classAverage?: number;
  championStudentId?: string;
  championStudentName?: string;
  highestScore?: number;
  totalStudents: number;
}

export interface QuizResult extends Timestamps {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  correct: number;
  incorrect: number;
  skipped: number;
  totalQuestions: number;
  score: number; // percentage
  rank?: number;
}

// ---- Leave Management ----

export interface LeaveRequest extends Timestamps {
  id: string;
  teacherId: string;
  teacherName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

// ---- Announcements ----

export interface Announcement extends Timestamps {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  publishedBy: string;
  publisherName: string;
  targetRoles: UserRole[];
  targetStreams?: StreamCode[];
  isActive: boolean;
  expiresAt?: string;
}

// ---- Notifications ----

export interface Notification extends Timestamps {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// ---- Performance (Principal Only) ----

export interface TeacherPerformance extends Timestamps {
  id: string;
  teacherId: string;
  academicYear: string;
  attendancePercentage: number;
  lateArrivals: number;
  totalQuizzes: number;
  averageQuizScore: number;
  mentorSessionsCount?: number;
  // Principal-only private fields
  privateNotes?: string;
  privateRating?: number; // 1-5
  behaviorComments?: string;
}

// ---- Settings ----

export interface InstitutionSettings extends Timestamps {
  id: string;
  collegeName: string;
  logo?: string;
  address: string;
  academicYear: string;
  campusLocation: {
    latitude: number;
    longitude: number;
  };
  geofenceRadius: number; // meters
  workingDays: DayOfWeek[];
  holidays: Holiday[];
  lateCheckInWindow: number; // minutes after period start
  attendanceRules: {
    minAttendancePercentage: number;
    lateThresholdMinutes: number;
  };
}

export interface Holiday {
  date: string;
  name: string;
  type: 'public' | 'institutional';
}

// ---- Audit Log ----

export interface AuditLog extends Timestamps {
  id: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// ---- Dashboard Types ----

export interface DashboardStats {
  totalTeachers: number;
  totalStudents: number;
  totalMentors: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  pendingLeaves: number;
  pendingApprovals: number;
  todayQuizzes: number;
  activeClasses: number;
}

export interface AttendanceChartData {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export interface QuizChartData {
  subject: string;
  average: number;
  quizCount: number;
}

// ---- Navigation Types ----

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}
