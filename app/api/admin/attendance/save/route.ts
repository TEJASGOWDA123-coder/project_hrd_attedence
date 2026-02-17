import { db } from '@/lib/db';
import { attendance, students, subjectStats } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { recalculateStudentStats } from '@/lib/attendance-utils';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionId, timetableId, date, records, subject, teacherId } = await request.json();

    try {
        for (const [studentId, status] of Object.entries(records)) {
            // 1. Check if record already exists
            const existing = await db.query.attendance.findFirst({
                where: and(
                    eq(attendance.studentId, studentId),
                    eq(attendance.date, date),
                    timetableId ? eq(attendance.timetableId, timetableId) : eq(attendance.subject, subject)
                )
            });

            if (existing) {
                await db.update(attendance)
                    .set({
                        status: status as any,
                        isDraft: false, // Admin corrections are always finalized
                        updatedAt: sql`CURRENT_TIMESTAMP`
                    })
                    .where(eq(attendance.id, existing.id));
            } else {
                await db.insert(attendance).values({
                    id: Math.random().toString(36).substring(2, 11),
                    studentId,
                    sectionId,
                    teacherId,
                    timetableId: timetableId || null,
                    date,
                    status: status as any,
                    subject,
                    isDraft: false
                });
            }

            // Always update global and subject stats for admin corrections
            await recalculateStudentStats(studentId, subject);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
