import { db } from './db';
import { attendance, subjectStats, students } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';

export function calculateAttendancePercentage(present: number, late: number, absent: number): number {
    const total = present + late + absent;
    if (total === 0) return 0;

    // RULE: 3 lates = 1 absent
    // Effective Absents = Actual Absents + floor(late / 3)
    // Effective Presents = Total Classes - Effective Absents
    
    const penaltyAbsents = Math.floor(late / 3);
    const effectiveAbsents = absent + penaltyAbsents;
    const effectivePresent = total - effectiveAbsents;

    return Math.round((effectivePresent / total) * 100);
}

/**
 * Recalculates and updates both subject-specific and global attendance stats for a student.
 */
export async function recalculateStudentStats(studentId: string, subject: string) {
    // 1. Fetch all-time stats for this student and this specific subject
    const stats = await db.select({
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
    stats.forEach(s => {
        if (s.status === 'present') present = s.count;
        if (s.status === 'late') late = s.count;
        if (s.status === 'absent') absent = s.count;
    });

    const newPercentage = calculateAttendancePercentage(present, late, absent);

    // 2. Update subject-specific persistent stats
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

    // 3. Update the global student percentage
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
    
    return { subjectPercentage: newPercentage, globalPercentage };
}
