// ============================================
// CollegeDost — Zod Validation Schemas
// ============================================

import { z } from 'zod';

// ---- Auth Validations ----

export const principalLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  securityPin: z.string().length(6, 'Security PIN must be 6 digits').regex(/^\d+$/, 'PIN must contain only digits'),
  rememberMe: z.boolean().optional(),
});

export const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  subject: z.string().min(1, 'Please select a subject'),
  stream: z.enum(['MPC', 'BiPC', 'CEC']),
  role: z.enum(['teacher', 'mentor', 'both']),
});

export const phoneOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

// ---- Student Validations ----

export const studentSchema = z.object({
  rollNumber: z.string().min(1, 'Roll number is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  stream: z.enum(['MPC', 'BiPC', 'CEC']),
  section: z.string().min(1, 'Please select a section'),
  admissionNumber: z.string().min(1, 'Admission number is required'),
  parentMobile: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  studentMobile: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']),
  batch: z.string().min(1, 'Batch is required'),
  status: z.enum(['active', 'inactive', 'transferred']).default('active'),
});

// ---- Subject Validations ----

export const subjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z.string().min(2, 'Subject code is required').max(10),
  streams: z.array(z.enum(['MPC', 'BiPC', 'CEC'])).min(1, 'Select at least one stream'),
});

// ---- Section Validations ----

export const sectionSchema = z.object({
  name: z.string().min(2, 'Section name is required'),
  streamCode: z.enum(['MPC', 'BiPC', 'CEC']),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(200),
});

// ---- Timetable Validations ----

export const timetableEntrySchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
  timeSlotId: z.string().min(1, 'Time slot is required'),
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  roomNumber: z.string().optional(),
  isSubstitution: z.boolean().default(false),
  originalTeacherId: z.string().optional(),
  weeklyRecurring: z.boolean().default(true),
});

// ---- Attendance Validations ----

export const teacherAttendanceSchema = z.object({
  status: z.enum(['present', 'late', 'absent']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
  }).optional(),
});

export const mentorAttendanceSchema = z.object({
  studyHour: z.union([z.literal(1), z.literal(2)]),
  topic: z.string().min(2, 'Topic is required'),
  notes: z.string().optional(),
  studentCount: z.number().min(0, 'Student count must be non-negative'),
  sectionId: z.string().optional(),
});

export const studentAttendanceSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  studentName: z.string().min(1, 'Student name is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  subjectName: z.string().min(1, 'Subject name is required'),
  periodId: z.string().min(1, 'Period is required'),
  periodLabel: z.string().min(1, 'Period label is required'),
  status: z.enum(['present', 'late', 'absent']),
  isSubstitution: z.boolean().default(false),
  originalTeacherId: z.string().optional(),
});

export const bulkStudentAttendanceSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  subjectName: z.string().min(1, 'Subject name is required'),
  periodId: z.string().min(1, 'Period is required'),
  periodLabel: z.string().min(1, 'Period label is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  teacherName: z.string().min(1, 'Teacher name is required'),
  isSubstitution: z.boolean().default(false),
  originalTeacherId: z.string().optional(),
  records: z.array(studentAttendanceSchema).min(1, 'At least one student record required'),
});

// ---- Quiz Validations ----

export const quizSchema = z.object({
  name: z.string().min(2, 'Quiz name is required'),
  topic: z.string().min(2, 'Topic is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  sectionId: z.string().min(1, 'Section is required'),
  questionCount: z.number().min(1, 'Must have at least 1 question').max(100),
});

export const quizResultSchema = z.object({
  studentId: z.string().min(1),
  correct: z.number().min(0),
  incorrect: z.number().min(0),
  skipped: z.number().min(0),
});

// ---- Leave Validations ----

export const leaveRequestSchema = z.object({
  type: z.enum(['casual', 'sick', 'emergency']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

// ---- Announcement Validations ----

export const announcementSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  type: z.enum(['notice', 'holiday', 'meeting', 'exam', 'emergency']),
  targetRoles: z.array(z.enum(['principal', 'teacher', 'mentor', 'both'])).min(1, 'Select at least one target'),
  targetStreams: z.array(z.enum(['MPC', 'BiPC', 'CEC'])).optional(),
  expiresAt: z.string().optional(),
});

// ---- Settings Validations ----

export const settingsSchema = z.object({
  collegeName: z.string().min(2, 'College name is required'),
  address: z.string().min(5, 'Address is required'),
  academicYear: z.string().min(4, 'Academic year is required'),
  campusLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  geofenceRadius: z.number().min(50).max(5000),
  lateCheckInWindow: z.number().min(0).max(60),
  attendanceRules: z.object({
    minAttendancePercentage: z.number().min(0).max(100),
    lateThresholdMinutes: z.number().min(1).max(60),
  }),
});

// ---- Task Validations ----

export const taskSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  assignedTo: z.string().min(1, 'Assignee is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// ---- Event Validations ----

export const eventSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  description: z.string().min(10, 'Description is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.enum(['academic', 'holiday', 'meeting', 'event', 'exam']),
  targetRoles: z.array(z.enum(['principal', 'teacher', 'mentor', 'both'])).min(1, 'Select at least one role'),
});

// ---- Resource Validations ----

export const resourceSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  description: z.string().min(10, 'Description is required'),
  fileUrl: z.string().url('Valid file URL required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().min(1, 'File size is required'),
  targetRoles: z.array(z.enum(['principal', 'teacher', 'mentor', 'both'])).min(1, 'Select at least one role'),
  targetStreams: z.array(z.enum(['MPC', 'BiPC', 'CEC'])).optional(),
  subjectId: z.string().optional(),
  sectionId: z.string().optional(),
});

// ---- Student Report Validations ----

export const studentReportSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  date: z.string().min(1, 'Date is required'),
  studyHour: z.union([z.literal(1), z.literal(2)]),
  topic: z.string().min(2, 'Topic is required'),
  observations: z.string().min(10, 'Observations must be at least 10 characters'),
  strengths: z.array(z.string()).optional(),
  areasOfImprovement: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
  studentCount: z.number().min(1, 'Student count is required'),
  duration: z.number().min(1, 'Duration is required'),
});

// ---- Type Exports ----

export type PrincipalLoginInput = z.infer<typeof principalLoginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type TimetableEntryInput = z.infer<typeof timetableEntrySchema>;
export type TeacherAttendanceInput = z.infer<typeof teacherAttendanceSchema>;
export type MentorAttendanceInput = z.infer<typeof mentorAttendanceSchema>;
export type StudentAttendanceInput = z.infer<typeof studentAttendanceSchema>;
export type BulkStudentAttendanceInput = z.infer<typeof bulkStudentAttendanceSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type QuizResultInput = z.infer<typeof quizResultSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type StudentReportInput = z.infer<typeof studentReportSchema>;
