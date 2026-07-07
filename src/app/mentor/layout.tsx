import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentor Dashboard',
  description: 'Mentor dashboard — study hours, session logging, and student progress',
};

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
