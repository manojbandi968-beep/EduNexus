type Listener = () => void;

export interface AttendanceRecord {
  teacherName: string;
  status: 'present' | 'late' | 'absent';
  time: string;
  date: string;
}

export interface LeaveRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  type: 'casual' | 'sick' | 'emergency';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  days: number;
  appliedOn: string;
}

export interface QuizRecord {
  id: string;
  name: string;
  topic: string;
  section: string;
  stream: string;
  teacherName: string;
  date: string;
  avgScore: number;
  students: number;
  totalStudents: number;
}

interface AppData {
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRecord[];
  quizzes: QuizRecord[];
}

let data: AppData = {
  attendance: [],
  leaveRequests: [],
  quizzes: [],
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getData(): AppData {
  return data;
}

export function markAttendance(record: AttendanceRecord) {
  data = { ...data, attendance: [record, ...data.attendance] };
  notify();
}

export function requestLeave(record: LeaveRecord) {
  data = { ...data, leaveRequests: [record, ...data.leaveRequests] };
  notify();
}

export function updateLeaveStatus(id: string, status: 'approved' | 'rejected') {
  data = { ...data, leaveRequests: data.leaveRequests.map(l => l.id === id ? { ...l, status } : l) };
  notify();
}

export function createQuiz(record: QuizRecord) {
  data = { ...data, quizzes: [record, ...data.quizzes] };
  notify();
}
