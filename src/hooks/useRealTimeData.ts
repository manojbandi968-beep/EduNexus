'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { useSocket, useSocketEvent } from '@/lib/socket/client';
import type {
  TeacherAttendance,
  MentorAttendance,
  LeaveRequest,
  Announcement,
  Task,
  Event,
  Resource,
  StudentReport,
  Notification,
  ActivityLog,
  DashboardStats,
  AttendanceChartData,
  QuizChartData,
} from '@/types';

// ---- API Functions ----

const api = {
  attendance: {
    getTeacher: (teacherId: string) =>
      fetch(`/api/attendance/teacher/${teacherId}`).then((r) => r.json()),
    getAll: () => fetch('/api/attendance').then((r) => r.json()),
    mark: (data: Partial<TeacherAttendance>) =>
      fetch('/api/attendance', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
  },
  mentorAttendance: {
    getAll: () => fetch('/api/mentor-attendance').then((r) => r.json()),
    checkIn: (data: Partial<MentorAttendance>) =>
      fetch('/api/mentor-attendance', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
  },
  leaves: {
    getAll: () => fetch('/api/leaves').then((r) => r.json()),
    getTeacher: (teacherId: string) => fetch(`/api/leaves/teacher/${teacherId}`).then((r) => r.json()),
    request: (data: Partial<LeaveRequest>) =>
      fetch('/api/leaves', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
    updateStatus: (id: string, status: 'approved' | 'rejected', reason?: string) =>
      fetch(`/api/leaves/${id}`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }).then((r) => r.json()),
  },
  announcements: {
    getAll: () => fetch('/api/announcements').then((r) => r.json()),
    create: (data: Partial<Announcement>) =>
      fetch('/api/announcements', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
    update: (id: string, data: Partial<Announcement>) =>
      fetch(`/api/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((r) => r.json()),
    delete: (id: string) => fetch(`/api/announcements/${id}`, { method: 'DELETE' }).then((r) => r.json()),
  },
  tasks: {
    getAll: () => fetch('/api/tasks').then((r) => r.json()),
    getAssigned: (userId: string) => fetch(`/api/tasks/assigned/${userId}`).then((r) => r.json()),
    create: (data: Partial<Task>) =>
      fetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
    updateStatus: (id: string, status: 'pending' | 'in_progress' | 'completed') =>
      fetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }).then((r) => r.json()),
  },
  events: {
    getAll: () => fetch('/api/events').then((r) => r.json()),
    create: (data: Partial<Event>) =>
      fetch('/api/events', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
  },
  resources: {
    getAll: () => fetch('/api/resources').then((r) => r.json()),
    create: (data: Partial<Resource>) =>
      fetch('/api/resources', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
  },
  studentReports: {
    getAll: () => fetch('/api/student-reports').then((r) => r.json()),
    getMentor: (mentorId: string) => fetch(`/api/student-reports/mentor/${mentorId}`).then((r) => r.json()),
    create: (data: Partial<StudentReport>) =>
      fetch('/api/student-reports', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
  },
  notifications: {
    getAll: () => fetch('/api/notifications').then((r) => r.json()),
    markRead: (id: string) => fetch(`/api/notifications/${id}/read`, { method: 'POST' }).then((r) => r.json()),
    markAllRead: () => fetch('/api/notifications/read-all', { method: 'POST' }).then((r) => r.json()),
  },
  activityLogs: {
    getAll: (params?: { startDate?: string; endDate?: string; userId?: string; action?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.userId) searchParams.set('userId', params.userId);
      if (params?.action) searchParams.set('action', params.action);
      return fetch(`/api/activity-logs?${searchParams}`).then((r) => r.json());
    },
  },
  dashboard: {
    getStats: () => fetch('/api/dashboard/stats').then((r) => r.json()),
    getAttendanceChart: () => fetch('/api/dashboard/attendance-chart').then((r) => r.json()),
    getQuizChart: () => fetch('/api/dashboard/quiz-chart').then((r) => r.json()),
  },
};

// ---- Real-time Query Keys ----

export const queryKeys = {
  attendance: {
    all: ['attendance'] as const,
    teacher: (teacherId: string) => [...queryKeys.attendance.all, 'teacher', teacherId] as const,
  },
  mentorAttendance: {
    all: ['mentorAttendance'] as const,
  },
  leaves: {
    all: ['leaves'] as const,
    teacher: (teacherId: string) => [...queryKeys.leaves.all, 'teacher', teacherId] as const,
  },
  announcements: {
    all: ['announcements'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    assigned: (userId: string) => [...queryKeys.tasks.all, 'assigned', userId] as const,
  },
  events: {
    all: ['events'] as const,
  },
  resources: {
    all: ['resources'] as const,
  },
  studentReports: {
    all: ['studentReports'] as const,
    mentor: (mentorId: string) => [...queryKeys.studentReports.all, 'mentor', mentorId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  activityLogs: {
    all: ['activityLogs'] as const,
    filtered: (params: { startDate?: string; endDate?: string; userId?: string; action?: string }) =>
      [...queryKeys.activityLogs.all, params] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    attendanceChart: ['dashboard', 'attendanceChart'] as const,
    quizChart: ['dashboard', 'quizChart'] as const,
  },
};

// ---- Real-time Hooks ----

export function useTeacherAttendance(teacherId: string) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.attendance.teacher(teacherId),
    queryFn: () => api.attendance.getTeacher(teacherId),
  });

  // Listen for real-time updates
  useSocketEvent(socket ? 'attendance:updated' : '', (payload: any) => {
    if (payload.teacherId === teacherId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.teacher(teacherId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendanceChart });
    }
  });

  return query;
}

export function useAllAttendance() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.attendance.all,
    queryFn: api.attendance.getAll,
  });

  useSocketEvent(socket ? 'attendance:updated' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendanceChart });
  });

  return query;
}

export function useMentorAttendance() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.mentorAttendance.all,
    queryFn: api.mentorAttendance.getAll,
  });

  useSocketEvent(socket ? 'session:logged' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.mentorAttendance.all });
  });

  return query;
}

export function useLeaves(teacherId?: string) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: teacherId ? queryKeys.leaves.teacher(teacherId) : queryKeys.leaves.all,
    queryFn: teacherId ? () => api.leaves.getTeacher(teacherId) : api.leaves.getAll,
  });

  useSocketEvent(socket ? 'leave:requested' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    if (teacherId) queryClient.invalidateQueries({ queryKey: queryKeys.leaves.teacher(teacherId) });
  });

  useSocketEvent(socket ? 'leave:approved' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    if (teacherId) queryClient.invalidateQueries({ queryKey: queryKeys.leaves.teacher(teacherId) });
  });

  useSocketEvent(socket ? 'leave:rejected' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    if (teacherId) queryClient.invalidateQueries({ queryKey: queryKeys.leaves.teacher(teacherId) });
  });

  return query;
}

export function useAnnouncements() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.announcements.all,
    queryFn: api.announcements.getAll,
  });

  useSocketEvent(socket ? 'announcement:created' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
  });

  useSocketEvent(socket ? 'announcement:updated' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
  });

  useSocketEvent(socket ? 'announcement:deleted' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
  });

  return query;
}

export function useTasks(userId?: string) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: userId ? queryKeys.tasks.assigned(userId) : queryKeys.tasks.all,
    queryFn: userId ? () => api.tasks.getAssigned(userId) : api.tasks.getAll,
  });

  useSocketEvent(socket ? 'task:assigned' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.tasks.assigned(userId) });
  });

  useSocketEvent(socket ? 'task:updated' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.tasks.assigned(userId) });
  });

  useSocketEvent(socket ? 'task:completed' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.tasks.assigned(userId) });
  });

  return query;
}

export function useEvents() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.events.all,
    queryFn: api.events.getAll,
  });

  useSocketEvent(socket ? 'event:created' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
  });

  return query;
}

export function useResources() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.resources.all,
    queryFn: api.resources.getAll,
  });

  useSocketEvent(socket ? 'resource:uploaded' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
  });

  return query;
}

export function useStudentReports(mentorId?: string) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: mentorId ? queryKeys.studentReports.mentor(mentorId) : queryKeys.studentReports.all,
    queryFn: mentorId ? () => api.studentReports.getMentor(mentorId) : api.studentReports.getAll,
  });

  useSocketEvent(socket ? 'student-report:created' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.studentReports.all });
    if (mentorId) queryClient.invalidateQueries({ queryKey: queryKeys.studentReports.mentor(mentorId) });
  });

  return query;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: api.notifications.getAll,
    refetchInterval: 30000, // Poll every 30s as fallback
  });

  useSocketEvent(socket ? 'notification:created' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  });

  return query;
}

export function useActivityLogs(params?: { startDate?: string; endDate?: string; userId?: string; action?: string }) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.activityLogs.filtered(params || {}),
    queryFn: () => api.activityLogs.getAll(params),
  });

  useSocketEvent(socket ? 'activity:logged' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs.all });
  });

  return query;
}

export function useDashboardStats() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: api.dashboard.getStats,
    refetchInterval: 60000,
  });

  // Invalidate on any relevant real-time event
  useSocketEvent(socket ? 'attendance:updated' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendanceChart });
  });

  useSocketEvent(socket ? 'leave:requested' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  });

  useSocketEvent(socket ? 'leave:approved' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  });

  useSocketEvent(socket ? 'task:assigned' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  });

  useSocketEvent(socket ? 'task:completed' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  });

  return query;
}

export function useAttendanceChart() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.dashboard.attendanceChart,
    queryFn: api.dashboard.getAttendanceChart,
  });

  useSocketEvent(socket ? 'attendance:updated' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendanceChart });
  });

  return query;
}

export function useQuizChart() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: queryKeys.dashboard.quizChart,
    queryFn: api.dashboard.getQuizChart,
  });

  useSocketEvent(socket ? 'quiz:started' : '', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.quizChart });
  });

  return query;
}

// ---- Mutation Hooks ----

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.attendance.mark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendanceChart });
    },
  });
}

export function useMentorCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.mentorAttendance.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorAttendance.all });
    },
  });
}

export function useRequestLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.leaves.request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'approved' | 'rejected'; reason?: string }) =>
      api.leaves.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.announcements.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) => api.announcements.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.announcements.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'in_progress' | 'completed' }) =>
      api.tasks.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.events.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

export function useUploadResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.resources.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
    },
  });
}

export function useCreateStudentReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.studentReports.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentReports.all });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.notifications.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.notifications.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}