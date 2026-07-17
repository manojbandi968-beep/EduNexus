import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    const [teacherSnapshot, mentorSnapshot] = await Promise.all([
      adminDb().collection('attendance').where('date', '==', date).get(),
      adminDb().collection('mentorAttendance').where('date', '==', date).get()
    ]);

    const records: any[] = [
      ...teacherSnapshot.docs.map(d => ({ id: d.id, role: 'teacher', ...d.data() })),
      ...mentorSnapshot.docs.map(d => ({ id: d.id, role: 'mentor', ...d.data() }))
    ];

    // Sort by timestamp descending
    records.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
