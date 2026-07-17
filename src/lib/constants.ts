// ============================================
// EduNexus — Constants & Configuration
// ============================================

import { type StreamCode, type DayOfWeek, type TimeSlot, type NavItem } from '@/types';

// ---- Stream Definitions ----
export const STREAMS: Record<StreamCode, { name: string; fullName: string; color: string; bgColor: string; textColor: string }> = {
  MPC: {
    name: 'MPC',
    fullName: 'Mathematics, Physics, Chemistry',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-500',
  },
  BiPC: {
    name: 'BiPC',
    fullName: 'Biology, Physics, Chemistry',
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
  },
  CEC: {
    name: 'CEC',
    fullName: 'Commerce, Economics, Civics',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
  },
};

// ---- Default Schedule ----
export const DEFAULT_SCHEDULE: TimeSlot[] = [
  { id: 'p1', label: 'Period 1', startTime: '07:00', endTime: '08:00', type: 'period' },
  { id: 'p2', label: 'Period 2', startTime: '08:00', endTime: '09:00', type: 'period' },
  { id: 'p3', label: 'Period 3', startTime: '09:00', endTime: '10:00', type: 'period' },
  { id: 'p4', label: 'Period 4', startTime: '10:00', endTime: '11:00', type: 'period' },
  { id: 'brk', label: 'Break', startTime: '11:00', endTime: '11:15', type: 'break' },
  { id: 'p5', label: 'Period 5', startTime: '11:15', endTime: '12:30', type: 'period' },
  { id: 'lunch', label: 'Lunch', startTime: '12:30', endTime: '13:30', type: 'lunch' },
  { id: 'p6', label: 'Period 6', startTime: '13:30', endTime: '14:30', type: 'period' },
  { id: 'p7', label: 'Period 7', startTime: '14:30', endTime: '15:30', type: 'period' },
  { id: 'p8', label: 'Period 8', startTime: '15:30', endTime: '16:30', type: 'period' },
  { id: 'snacks', label: 'Snacks', startTime: '16:30', endTime: '17:30', type: 'snacks' },
  { id: 'sh1', label: 'Study Hour 1', startTime: '17:30', endTime: '19:30', type: 'study_hour' },
  { id: 'dinner', label: 'Dinner', startTime: '19:30', endTime: '20:30', type: 'dinner' },
  { id: 'sh2', label: 'Study Hour 2', startTime: '20:30', endTime: '22:00', type: 'study_hour' },
];

// ---- Days of the Week ----
export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
];

// ---- Default Subjects ----
export const DEFAULT_SUBJECTS = [
  { name: 'Mathematics', code: 'MATH', streams: ['MPC'] as StreamCode[] },
  { name: 'Physics', code: 'PHY', streams: ['MPC', 'BiPC'] as StreamCode[] },
  { name: 'Chemistry', code: 'CHEM', streams: ['MPC', 'BiPC'] as StreamCode[] },
  { name: 'Biology', code: 'BIO', streams: ['BiPC'] as StreamCode[] },
  { name: 'Botany', code: 'BOT', streams: ['BiPC'] as StreamCode[] },
  { name: 'Zoology', code: 'ZOO', streams: ['BiPC'] as StreamCode[] },
  { name: 'Commerce', code: 'COM', streams: ['CEC'] as StreamCode[] },
  { name: 'Economics', code: 'ECO', streams: ['CEC'] as StreamCode[] },
  { name: 'Civics', code: 'CIV', streams: ['CEC'] as StreamCode[] },
  { name: 'English', code: 'ENG', streams: ['MPC', 'BiPC', 'CEC'] as StreamCode[] },
  { name: 'Sanskrit', code: 'SAN', streams: ['MPC', 'BiPC', 'CEC'] as StreamCode[] },
  { name: 'Second Language', code: 'SL', streams: ['MPC', 'BiPC', 'CEC'] as StreamCode[] },
];

// ---- Default Sections ----
export const DEFAULT_SECTIONS = [
  { name: 'MPC-A', streamCode: 'MPC' as StreamCode, capacity: 60 },
  { name: 'MPC-B', streamCode: 'MPC' as StreamCode, capacity: 60 },
  { name: 'MPC-C', streamCode: 'MPC' as StreamCode, capacity: 60 },
  { name: 'BiPC-A', streamCode: 'BiPC' as StreamCode, capacity: 60 },
  { name: 'BiPC-B', streamCode: 'BiPC' as StreamCode, capacity: 60 },
  { name: 'CEC-A', streamCode: 'CEC' as StreamCode, capacity: 60 },
  { name: 'CEC-B', streamCode: 'CEC' as StreamCode, capacity: 60 },
];

// ---- Attendance Status Options ----
export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present', color: '#10b981', icon: '✓' },
  { value: 'late', label: 'Late', color: '#f59e0b', icon: '⏰' },
  { value: 'absent', label: 'Absent', color: '#ef4444', icon: '✗' },
] as const;

// ---- Leave Types ----
export const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave', maxDays: 12 },
  { value: 'sick', label: 'Sick Leave', maxDays: 10 },
  { value: 'emergency', label: 'Emergency Leave', maxDays: 5 },
] as const;

// ---- Announcement Types ----
export const ANNOUNCEMENT_TYPES = [
  { value: 'notice', label: 'Notice', icon: '📋', color: '#6366f1' },
  { value: 'holiday', label: 'Holiday', icon: '🎉', color: '#10b981' },
  { value: 'meeting', label: 'Meeting', icon: '🤝', color: '#3b82f6' },
  { value: 'exam', label: 'Exam', icon: '📝', color: '#f59e0b' },
  { value: 'emergency', label: 'Emergency Alert', icon: '🚨', color: '#ef4444' },
] as const;

// ---- Navigation Items ----
export const PRINCIPAL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/principal', icon: 'LayoutDashboard' },
  { label: 'Teachers', href: '/principal/teachers', icon: 'Users' },
  { label: 'Students', href: '/principal/students', icon: 'GraduationCap' },
  { label: 'Subjects', href: '/principal/subjects', icon: 'BookOpen' },
  { label: 'Sections', href: '/principal/sections', icon: 'Layers' },
  { label: 'Timetable', href: '/principal/timetable', icon: 'Calendar' },
  { label: 'Attendance', href: '/principal/attendance', icon: 'ClipboardCheck' },
  { label: 'Quizzes', href: '/principal/quizzes', icon: 'FileQuestion' },
  { label: 'Leave Requests', href: '/principal/leave', icon: 'CalendarOff' },
  { label: 'Announcements', href: '/principal/announcements', icon: 'Megaphone' },
  { label: 'Calendar', href: '/principal/calendar', icon: 'CalendarDays' },
  { label: 'Audit Logs', href: '/principal/audit-logs', icon: 'Shield' },
  { label: 'Campus Map', href: '/principal/campus', icon: 'Map' },
  { label: 'Settings', href: '/principal/settings', icon: 'Settings' },
];

export const TEACHER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/teacher', icon: 'LayoutDashboard' },
  { label: 'Timetable', href: '/teacher/timetable', icon: 'Calendar' },
  { label: 'Attendance', href: '/teacher/attendance', icon: 'ClipboardCheck' },
  { label: 'Quizzes', href: '/teacher/quiz', icon: 'FileQuestion' },
  { label: 'Leave', href: '/teacher/leave', icon: 'CalendarOff' },
  { label: 'Announcements', href: '/teacher/announcements', icon: 'Megaphone' },
  { label: 'Campus Map', href: '/teacher/campus', icon: 'Map' },
  { label: 'Settings', href: '/teacher/settings', icon: 'Settings' },
];

export const MENTOR_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/mentor', icon: 'LayoutDashboard' },
  { label: 'Attendance', href: '/mentor/attendance', icon: 'ClipboardCheck' },
  { label: 'Leave', href: '/mentor/leave', icon: 'CalendarOff' },
  { label: 'Announcements', href: '/mentor/announcements', icon: 'Megaphone' },
  { label: 'Campus Map', href: '/mentor/campus', icon: 'Map' },
];

// ---- App Constants ----
export const APP_NAME = 'EduNexus';
export const APP_DESCRIPTION = 'Junior College Coaching Management Platform';
export const APP_VERSION = '1.0.0';

// ---- Rate Limiting ----
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

// ---- Geofence ----
export const DEFAULT_GEOFENCE_RADIUS = 200; // meters
export const DEFAULT_LATE_THRESHOLD = 10; // minutes
