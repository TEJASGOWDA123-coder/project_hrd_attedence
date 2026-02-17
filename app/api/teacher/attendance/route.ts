import { db } from '@/lib/db';
import { attendance, teachers, students, subjectStats, users } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { recalculateStudentStats } from '@/lib/attendance-utils';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || session.user.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionId, timetableId, records, subject, isDraft } = await request.json();
    const date = new Date().toISOString().split('T')[0];

    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    try {
        for (const [studentId, status] of Object.entries(records)) {
            // 1. Check if record already exists for this student/date/timetable
            // We force timetableId if available to avoid overlapping session bugs
            const existing = await db.query.attendance.findFirst({
                where: and(
                    eq(attendance.studentId, studentId),
                    eq(attendance.date, date),
                    timetableId ? eq(attendance.timetableId, timetableId) : eq(attendance.subject, subject)
                )
            });

            if (existing) {
                // Update existing record
                await db.update(attendance)
                    .set({
                        teacherId: teacher.id,
                        status: status as any,
                        isDraft: isDraft || false,
                        updatedAt: sql`CURRENT_TIMESTAMP`
                    })
                    .where(eq(attendance.id, existing.id));
            } else {
                // Insert new record
                const id = Math.random().toString(36).substring(2, 11);
                await db.insert(attendance).values({
                    id,
                    studentId,
                    sectionId,
                    teacherId: teacher.id,
                    timetableId: timetableId || null,
                    date,
                    status: status as any,
                    subject: subject,
                    isDraft: isDraft || false
                });
            }

            // ONLY update stats if it's NOT a draft
            if (!isDraft) {
                await recalculateStudentStats(studentId, subject);
            }
        }

        // Send email if it's a draft
        if (isDraft) {
            try {
                const { sendEmail } = await import('@/lib/email');
                const teacherUser = await db.query.users.findFirst({
                    where: eq(users.id, teacher.userId)
                });
                
                if (teacherUser && teacherUser.email) {
                    await sendEmail({
                        to: teacherUser.email,
                        subject: 'Your attendance is saved',
                        text: `Hello ${teacherUser.name}, your attendance for ${subject} (Section ${sectionId}) has been saved as a draft. It will be automatically finalized when the session ends.`,
                        html: `
                            <p>Hello <b>${teacherUser.name}</b>,</p>
                            <p>Your attendance for <b>${subject}</b> (Section <b>${sectionId}</b>) has been successfully <b>saved as a draft</b>.</p>
                            <p>It will be automatically finalized when the session ends according to the timetable.</p>
                        `
                    });
                }
            } catch (emailErr) {
                console.error('Error sending save notification:', emailErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
