import { db } from '@/lib/db';
import { attendance, teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || session.user.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionId, records } = await request.json();
    const date = new Date().toISOString().split('T')[0];

    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    try {
        for (const [studentId, status] of Object.entries(records)) {
            const id = Math.random().toString(36).substring(2, 11);
            // In a real app, you might want to update if already exists for same day
            await db.insert(attendance).values({
                id,
                studentId,
                sectionId,
                teacherId: teacher.id,
                date,
                status: status as any,
            });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
