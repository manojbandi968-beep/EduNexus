import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    await adminDb().collection('announcements').doc(id).update({
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    await adminDb().collection('announcements').doc(id).delete();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
