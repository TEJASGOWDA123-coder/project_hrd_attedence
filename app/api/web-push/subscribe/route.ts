import { db } from '@/lib/db';
import { teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || session.user.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await request.json();

    if (!subscription) {
        return NextResponse.json({ error: 'No subscription provided' }, { status: 400 });
    }

    // Find the teacher record associated with the user
    // Note: session.user.id corresponds to users.id, which teachers.userId references
    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    await db.update(teachers)
        .set({ pushSubscription: JSON.stringify(subscription) })
        .where(eq(teachers.id, teacher.id)); // Update by teacher.id

    return NextResponse.json({ success: true });
}
