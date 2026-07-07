import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Dashboard',
  description: 'Teacher dashboard — timetable, attendance, quizzes, and analytics',
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
