import { db } from '@/lib/db';
import { attendance, teachers, students, subjectStats } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { calculateAttendancePercentage } from '@/lib/attendance-utils';

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
                        teacherId: teacher.id, // Ensure current teacher is attributed
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
                // 2. Fetch all-time stats for this student and this specific subject
                const stats = await db.select({
                    status: attendance.status,
                    count: sql<number>`count(*)`
                })
                    .from(attendance)
                    .where(and(
                        eq(attendance.studentId, studentId),
                        eq(attendance.subject, subject),
                        eq(attendance.isDraft, false) // Only count finalized records
                    ))
                    .groupBy(attendance.status);

                let present = 0, late = 0, absent = 0;
                stats.forEach(s => {
                    if (s.status === 'present') present = s.count;
                    if (s.status === 'late') late = s.count;
                    if (s.status === 'absent') absent = s.count;
                });

                const newPercentage = calculateAttendancePercentage(present, late, absent);

                // 3. Update subject-specific persistent stats
                const existingStat = await db.query.subjectStats.findFirst({
                    where: and(
                        eq(subjectStats.studentId, studentId),
                        eq(subjectStats.subject, subject)
                    )
                });

                if (existingStat) {
                    await db.update(subjectStats)
                        .set({
                            presentCount: present,
                            lateCount: late,
                            absentCount: absent,
                            totalSessions: present + late + absent,
                            percentage: newPercentage,
                            updatedAt: sql`CURRENT_TIMESTAMP`
                        })
                        .where(eq(subjectStats.id, existingStat.id));
                } else {
                    await db.insert(subjectStats).values({
                        id: Math.random().toString(36).substring(2, 11),
                        studentId,
                        subject,
                        presentCount: present,
                        lateCount: late,
                        absentCount: absent,
                        totalSessions: present + late + absent,
                        percentage: newPercentage,
                    });
                }

                // 4. Update the global student percentage
                const globalStats = await db.select({
                    status: attendance.status,
                    count: sql<number>`count(*)`
                })
                    .from(attendance)
                    .where(and(
                        eq(attendance.studentId, studentId),
                        eq(attendance.isDraft, false)
                    ))
                    .groupBy(attendance.status);

                let gPresent = 0, gLate = 0, gAbsent = 0;
                globalStats.forEach(s => {
                    if (s.status === 'present') gPresent = s.count;
                    if (s.status === 'late') gLate = s.count;
                    if (s.status === 'absent') gAbsent = s.count;
                });

                const globalPercentage = calculateAttendancePercentage(gPresent, gLate, gAbsent);
                await db.update(students)
                    .set({ attendancePercentage: globalPercentage })
                    .where(eq(students.id, studentId));
            }
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
