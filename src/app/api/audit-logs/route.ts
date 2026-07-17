import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db
      .collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      // Format the ISO string to a readable IST string
      let formattedTime = data.timestamp;
      try {
        const date = new Date(data.timestamp);
        formattedTime = date.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      } catch (e) {
        // ignore
      }

      return {
        id: doc.id,
        action: data.action === 'login' ? 'Successful Login' : data.action === 'login_failed' ? 'Login Failed' : data.action,
        user: data.userId || 'Unknown',
        role: data.userRole || 'unknown',
        details: data.details || '',
        timestamp: formattedTime,
        ipAddress: data.ipAddress || 'unknown',
        browser: data.metadata?.browser || 'unknown',
        device: data.metadata?.device || 'unknown',
        type: data.action?.includes('login') ? 'login' : 'system'
      };
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
