import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');

    let query: any = adminDb().collection('announcements');
    
    if (role && role !== 'principal') {
      // Teachers and mentors should only see announcements meant for them or 'both'
      query = query.where('targetRoles', 'array-contains', role);
    }
    
    const snapshot = await query.get();

    let records = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    }));
    
    // For roles, 'both' might not be perfectly filtered by array-contains if stored differently, 
    // but the schema says targetRoles: ('principal' | 'teacher' | 'mentor' | 'both')[].
    // Let's also do a client side filter just in case the array-contains misses 'both'
    if (role && role !== 'principal') {
      records = records.filter((r: any) => 
        r.targetRoles?.includes(role) || r.targetRoles?.includes('both')
      );
    }

    // Sort descending by timestamp or createdAt
    records.sort((a: any, b: any) => {
      const aTime = a.timestamp || new Date(a.createdAt).getTime();
      const bTime = b.timestamp || new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const docRef = await adminDb().collection('announcements').add({
      ...body,
      isActive: true,
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
