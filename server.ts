import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import {
  SOCKET_EVENTS,
  type AttendanceUpdatedPayload,
  type QuizStartedPayload,
  type TeacherActivityPayload,
  type LeaveRequestedPayload,
  type LeaveStatusPayload,
  type AnnouncementPayload,
  type TaskPayload,
  type EventPayload,
  type ResourcePayload,
  type SessionLoggedPayload,
  type NotificationPayload,
  type ActivityLoggedPayload,
  type StudentReportPayload,
} from './src/lib/socket/events';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    handle(req, res).catch((err: Error) => {
      console.error(err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
  });

  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Track connected users by role
  const connectedUsers = new Map<string, { socketId: string; role: string; userId: string }>();

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Register user with role
    socket.on('register', (data: { userId: string; role: string; name: string }) => {
      connectedUsers.set(socket.id, { socketId: socket.id, role: data.role, userId: data.userId });
      socket.join(data.role); // Join role-based room
      socket.join(`user-${data.userId}`); // Join personal room
      console.log(`[Socket] User registered: ${data.name} (${data.role}) - ${socket.id}`);
    });

    // Teacher -> Server events
    socket.on(SOCKET_EVENTS.TEACHER_MARK_ATTENDANCE, (payload: AttendanceUpdatedPayload) => {
      // Broadcast to principal room
      io.to('principal').emit(SOCKET_EVENTS.ATTENDANCE_UPDATED, payload);
      
      // Also broadcast to mentors for their students
      io.to('mentor').emit(SOCKET_EVENTS.ATTENDANCE_UPDATED, payload);

      let locationString = '';
      if (payload.inCollege !== undefined) {
        locationString = payload.inCollege ? ' (In Campus)' : ' (Off Campus)';
      }

      const activity: TeacherActivityPayload = {
        teacherName: payload.teacherName,
        action: `Marked attendance as ${payload.status}${locationString}`,
        details: payload.location ? `Lat: ${payload.location.lat.toFixed(4)}, Lng: ${payload.location.lng.toFixed(4)}` : undefined,
        timestamp: new Date().toISOString() as any,
        type: 'attendance',
      };
      io.to('principal').emit(SOCKET_EVENTS.TEACHER_ACTIVITY, activity);
    });

    socket.on(SOCKET_EVENTS.TEACHER_START_QUIZ, (payload: QuizStartedPayload) => {
      io.to('principal').emit(SOCKET_EVENTS.QUIZ_STARTED, payload);
      io.to('principal').emit(SOCKET_EVENTS.TEACHER_ACTIVITY, {
        teacherName: payload.teacherName,
        action: `Conducted quiz in ${payload.section}`,
        details: payload.subject,
        timestamp: payload.timestamp,
        type: 'quiz',
      });
    });

    socket.on(SOCKET_EVENTS.TEACHER_END_QUIZ, (payload: any) => {
      io.to('principal').emit(SOCKET_EVENTS.QUIZ_ENDED, payload);
      io.to('teacher').emit(SOCKET_EVENTS.QUIZ_ENDED, payload);
      io.to('principal').emit(SOCKET_EVENTS.TEACHER_ACTIVITY, {
        teacherName: payload.teacherName,
        action: `Completed a quiz on ${payload.topic}`,
        details: `Students graded: ${payload.totalStudents}`,
        timestamp: payload.timestamp,
        type: 'quiz',
      });
    });

    socket.on(SOCKET_EVENTS.TEACHER_START_CLASS, (payload: { teacherName: string; section: string; subject: string; timestamp: number }) => {
      io.to('principal').emit(SOCKET_EVENTS.CLASS_STARTED, payload);
      io.to('principal').emit(SOCKET_EVENTS.TEACHER_ACTIVITY, {
        teacherName: payload.teacherName,
        action: `Started class in ${payload.section}`,
        details: payload.subject,
        timestamp: payload.timestamp,
        type: 'class',
      });
    });

    socket.on(SOCKET_EVENTS.TEACHER_REQUEST_LEAVE, (payload: LeaveRequestedPayload) => {
      // Notify principal
      io.to('principal').emit(SOCKET_EVENTS.LEAVE_REQUESTED, payload);
      
      // Notify the specific teacher
      io.to(`user-${payload.teacherId}`).emit(SOCKET_EVENTS.LEAVE_REQUESTED, payload);
    });

    socket.on(SOCKET_EVENTS.TEACHER_LOG_SESSION, (payload: SessionLoggedPayload) => {
      // Notify principal
      io.to('principal').emit(SOCKET_EVENTS.SESSION_LOGGED, payload);
      
      // Notify mentor's students (via role room)
      io.to('mentor').emit(SOCKET_EVENTS.SESSION_LOGGED, payload);
    });

    // Principal -> Server events
    socket.on(SOCKET_EVENTS.PRINCIPAL_CREATE_ANNOUNCEMENT, (payload: AnnouncementPayload) => {
      // Broadcast to all targeted roles
      payload.targetRoles.forEach((role) => {
        io.to(role).emit(SOCKET_EVENTS.ANNOUNCEMENT_CREATED, payload);
        
        // Also send notification to each user in target role
        const notification: NotificationPayload = {
          id: `notif-${Date.now()}`,
          userId: '',
          title: `New ${payload.type}: ${payload.title}`,
          message: payload.content,
          type: 'announcement',
          isRead: false,
          actionUrl: '/announcements',
          metadata: { announcementId: payload.id },
          createdAt: payload.createdAt,
          timestamp: payload.timestamp,
        };
        io.to(role).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, notification);
      });
    });

    socket.on(SOCKET_EVENTS.PRINCIPAL_APPROVE_LEAVE, (payload: LeaveStatusPayload) => {
      io.to('principal').emit(SOCKET_EVENTS.LEAVE_APPROVED, payload);
      io.to(`user-${payload.teacherId}`).emit(SOCKET_EVENTS.LEAVE_APPROVED, payload);
      
      const notification: NotificationPayload = {
        id: `notif-${Date.now()}`,
        userId: payload.teacherId,
        title: 'Leave Approved',
        message: `Your ${payload.status === 'approved' ? 'leave request has been approved' : 'leave request was rejected'}`,
        type: 'leave',
        isRead: false,
        actionUrl: '/teacher/leave',
        createdAt: new Date().toISOString(),
        timestamp: payload.timestamp,
      };
      io.to(`user-${payload.teacherId}`).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, notification);
    });

    socket.on(SOCKET_EVENTS.PRINCIPAL_REJECT_LEAVE, (payload: LeaveStatusPayload) => {
      io.to('principal').emit(SOCKET_EVENTS.LEAVE_REJECTED, payload);
      io.to(`user-${payload.teacherId}`).emit(SOCKET_EVENTS.LEAVE_REJECTED, payload);
      
      const notification: NotificationPayload = {
        id: `notif-${Date.now()}`,
        userId: payload.teacherId,
        title: 'Leave Rejected',
        message: `Your leave request was rejected. Reason: ${payload.rejectionReason || 'Not specified'}`,
        type: 'leave',
        isRead: false,
        actionUrl: '/teacher/leave',
        createdAt: new Date().toISOString(),
        timestamp: payload.timestamp,
      };
      io.to(`user-${payload.teacherId}`).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, notification);
    });

    socket.on(SOCKET_EVENTS.PRINCIPAL_ASSIGN_TASK, (payload: TaskPayload) => {
      io.to('principal').emit(SOCKET_EVENTS.TASK_ASSIGNED, payload);
      io.to(`user-${payload.assignedTo}`).emit(SOCKET_EVENTS.TASK_ASSIGNED, payload);
      
      const notification: NotificationPayload = {
        id: `notif-${Date.now()}`,
        userId: payload.assignedTo,
        title: 'New Task Assigned',
        message: `${payload.assignedByName} assigned you: ${payload.title}`,
        type: 'task',
        isRead: false,
        actionUrl: '/tasks',
        metadata: { taskId: payload.id },
        createdAt: payload.createdAt,
        timestamp: payload.timestamp,
      };
      io.to(`user-${payload.assignedTo}`).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, notification);
    });

    socket.on(SOCKET_EVENTS.PRINCIPAL_CREATE_EVENT, (payload: EventPayload) => {
      payload.targetRoles.forEach((role) => {
        io.to(role).emit(SOCKET_EVENTS.EVENT_CREATED, payload);
        
        const notification: NotificationPayload = {
          id: `notif-${Date.now()}`,
          userId: '',
          title: 'New Event',
          message: `${payload.createdByName} created: ${payload.title}`,
          type: 'event',
          isRead: false,
          actionUrl: '/calendar',
          metadata: { eventId: payload.id },
          createdAt: payload.startDate,
          timestamp: payload.timestamp,
        };
        io.to(role).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, notification);
      });
    });

    socket.on(SOCKET_EVENTS.PRINCIPAL_UPLOAD_RESOURCE, (payload: ResourcePayload) => {
      payload.targetRoles.forEach((role) => {
        io.to(role).emit(SOCKET_EVENTS.RESOURCE_UPLOADED, payload);
        
        const notification: NotificationPayload = {
          id: `notif-${Date.now()}`,
          userId: '',
          title: 'New Resource',
          message: `${payload.uploadedByName} uploaded: ${payload.title}`,
          type: 'resource',
          isRead: false,
          actionUrl: '/resources',
          metadata: { resourceId: payload.id },
          createdAt: payload.createdAt,
          timestamp: payload.timestamp,
        };
        io.to(role).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, notification);
      });
    });

    // Task status updates from teachers/mentors
    socket.on('task:update-status', (payload: { taskId: string; status: 'pending' | 'in_progress' | 'completed'; userId: string; userName: string; timestamp: number }) => {
      io.to('principal').emit(SOCKET_EVENTS.TASK_UPDATED, payload);
      if (payload.status === 'completed') {
        io.to('principal').emit(SOCKET_EVENTS.TASK_COMPLETED, payload);
      }
    });

    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`[Socket] Disconnected: ${user.userId} (${user.role}) - ${socket.id}`);
        connectedUsers.delete(socket.id);
      } else {
        console.log(`[Socket] Disconnected: ${socket.id}`);
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});