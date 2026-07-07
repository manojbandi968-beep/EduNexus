import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import {
  SOCKET_EVENTS,
  type AttendanceUpdatedPayload,
  type QuizStartedPayload,
  type TeacherActivityPayload,
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

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.TEACHER_MARK_ATTENDANCE, (payload: AttendanceUpdatedPayload) => {
      io.emit(SOCKET_EVENTS.ATTENDANCE_UPDATED, payload);
      const activity: TeacherActivityPayload = {
        teacherName: payload.teacherName,
        action: 'Marked attendance',
        timestamp: payload.timestamp,
        type: 'attendance',
      };
      io.emit(SOCKET_EVENTS.TEACHER_ACTIVITY, activity);
    });

    socket.on(SOCKET_EVENTS.TEACHER_START_QUIZ, (payload: QuizStartedPayload) => {
      io.emit(SOCKET_EVENTS.QUIZ_STARTED, payload);
      io.emit(SOCKET_EVENTS.TEACHER_ACTIVITY, {
        teacherName: payload.teacherName,
        action: `Conducted quiz in ${payload.section}`,
        details: payload.subject,
        timestamp: payload.timestamp,
        type: 'quiz',
      } satisfies TeacherActivityPayload);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
