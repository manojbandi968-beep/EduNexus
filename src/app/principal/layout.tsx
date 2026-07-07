import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Principal Dashboard',
  description: 'Administrative dashboard with full platform control — EduNexus',
};

export default function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
