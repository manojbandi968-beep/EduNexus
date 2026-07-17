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
  | 'announcement_updated'
  | 'announcement_deleted'
  | 'student_created'
  | 'student_edited'
  | 'student_deleted'
  | 'settings_updated'
  | 'principal_action'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'event_created'
  | 'event_updated'
  | 'resource_uploaded'
  | 'session_logged'
  | 'student_report_created'
  | 'notification_sent';

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

// ---- Tasks ----

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task extends Timestamps {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedByName: string;
  status: TaskStatus;
  dueDate: string;
  priority: TaskPriority;
  completedAt?: string;
}

// ---- Events ----

export type EventType = 'academic' | 'holiday' | 'meeting' | 'event' | 'exam';

export interface Event extends Timestamps {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: EventType;
  targetRoles: UserRole[];
  createdBy: string;
  createdByName: string;
}

// ---- Resources ----

export interface Resource extends Timestamps {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  targetRoles: UserRole[];
  targetStreams?: StreamCode[];
  subjectId?: string;
  sectionId?: string;
}

// ---- Student Reports ----

export interface StudentReport extends Timestamps {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  date: string;
  studyHour: 1 | 2;
  topic: string;
  observations: string;
  strengths: string[];
  areasOfImprovement: string[];
  actionItems: string[];
  studentCount: number;
  duration: number; // minutes
}

// ---- Dashboard Stats ----

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
  pendingTasks: number;
  upcomingEvents: number;
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

// ---- Teacher Dashboard Types ----

export interface TeacherDashboardStats {
  attendancePercent: number;
  todayClasses: number;
  completedClasses: number;
  upcomingClasses: number;
  totalQuizzes: number;
  avgQuizScore: number;
  pendingLeaves: number;
  assignedSections: number;
}

export interface TeacherAttendanceChartData {
  date: string;
  status: 'present' | 'late' | 'absent' | 'none';
}

export interface TeacherQuizChartData {
  subject: string;
  average: number;
  quizCount: number;
}

export interface TeacherTodayClass {
  period: string;
  time: string;
  subject: string;
  section: string;
  room: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface TeacherRecentQuiz {
  name: string;
  section: string;
  date: string;
  avg: number;
  students: number;
}

export interface TeacherAnnouncement {
  title: string;
  type: string;
  time: string;
}

export interface TeacherDashboardData {
  stats: TeacherDashboardStats;
  attendanceChartData: TeacherAttendanceChartData[];
  quizChartData: TeacherQuizChartData[];
  todaySchedule: TeacherTodayClass[];
  recentQuizzes: TeacherRecentQuiz[];
  announcements: TeacherAnnouncement[];
  teacherName: string;
  isAttendanceMarkedToday?: boolean;
  checkInTimeToday?: string | null;
}

// ---- Mentor Dashboard Types ----

export interface MentorDashboardStats {
  sessionsThisMonth: number;
  avgStudentsPerSession: number;
  totalHours: number;
  doubtsCleared: number;
  attendanceRate: number;
  currentStreak: number;
}

export interface MentorAttendanceChartData {
  date: string;
  studyHour: 1 | 2;
  checkedIn: boolean;
  topic?: string;
  studentCount?: number;
}

export interface MentorDashboardData {
  stats: MentorDashboardStats;
  attendanceChartData: MentorAttendanceChartData[];
  upcomingSessions: {
    studyHour: 1 | 2;
    time: string;
    isCurrent: boolean;
    isUpcoming: boolean;
  }[];
  previousSessions: {
    date: string;
    studyHour: 1 | 2;
    topic: string;
    students: number;
    duration: number;
    notes: string;
  }[];
  announcements: TeacherAnnouncement[];
  assignedBatches: string[];
  mentorName: string;
}

// ---- Activity Log ----

export interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ---- Navigation Types ----

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface CollegeEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  description?: string;
  createdBy: string;
  creatorName: string;
  timestamp: string;
}
