import { db } from '@/lib/db';
import { attendance, students, subjectStats } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { calculateAttendancePercentage } from '@/lib/attendance-utils';

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
            // Update Subject Stats
            const subjStats = await db.select({
                status: attendance.status,
                count: sql<number>`count(*)`
            })
            .from(attendance)
            .where(and(
                eq(attendance.studentId, studentId),
                eq(attendance.subject, subject),
                eq(attendance.isDraft, false)
            ))
            .groupBy(attendance.status);

            let present = 0, late = 0, absent = 0;
            subjStats.forEach(s => {
                if (s.status === 'present') present = s.count;
                if (s.status === 'late') late = s.count;
                if (s.status === 'absent') absent = s.count;
            });

            const newSubjPercentage = calculateAttendancePercentage(present, late, absent);

            const existingSubjStat = await db.query.subjectStats.findFirst({
                where: and(
                    eq(subjectStats.studentId, studentId),
                    eq(subjectStats.subject, subject)
                )
            });

            if (existingSubjStat) {
                await db.update(subjectStats)
                    .set({
                        presentCount: present,
                        lateCount: late,
                        absentCount: absent,
                        totalSessions: present + late + absent,
                        percentage: newSubjPercentage,
                        updatedAt: sql`CURRENT_TIMESTAMP`
                    })
                    .where(eq(subjectStats.id, existingSubjStat.id));
            } else {
                await db.insert(subjectStats).values({
                    id: Math.random().toString(36).substring(2, 11),
                    studentId,
                    subject,
                    presentCount: present,
                    lateCount: late,
                    absentCount: absent,
                    totalSessions: present + late + absent,
                    percentage: newSubjPercentage,
                });
            }

            // Update Global Student Stats
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

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
