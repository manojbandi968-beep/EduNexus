import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    let query: any = adminDb().collection('leaves');
    
    if (userId) {
      query = query.where('teacherId', '==', userId);
    }
    
    // Fallback to client sorting since some index might be missing
    const snapshot = await query.get();

    const records = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    }));

    // Sort descending by timestamp or appliedOn
    records.sort((a: any, b: any) => {
      const aTime = a.timestamp || new Date(a.appliedOn).getTime();
      const bTime = b.timestamp || new Date(b.appliedOn).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const docRef = await adminDb().collection('leaves').add({
      ...body,
      status: 'pending',
      appliedOn: new Date().toISOString(),
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error creating leave:', error);
    return NextResponse.json({ error: 'Failed to create leave' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, approvedBy } = body;
    
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await adminDb().collection('leaves').doc(id).update({
      status,
      approvedBy: approvedBy || 'Principal',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating leave:', error);
    return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 });
  }
}
