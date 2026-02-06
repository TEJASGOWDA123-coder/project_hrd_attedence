import { db } from '@/lib/db';
import { attendance, teachers, sections, users } from '@/lib/db/schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
    const authSession = await getSession();
    if (!authSession || authSession.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sectionId = searchParams.get('sectionId');

    try {
        const whereConditions = [];
        if (startDate) whereConditions.push(gte(attendance.date, startDate));
        if (endDate) whereConditions.push(lte(attendance.date, endDate));
        if (sectionId) whereConditions.push(eq(attendance.sectionId, sectionId));

        const sessions = await db.select({
            timetableId: attendance.timetableId,
            date: attendance.date,
            teacherId: attendance.teacherId,
            teacherName: users.name,
            sectionId: attendance.sectionId,
            sectionName: sections.name,
            subject: attendance.subject,
            presentCount: sql<number>`count(case when ${attendance.status} = 'present' then 1 end)`,
            absentCount: sql<number>`count(case when ${attendance.status} = 'absent' then 1 end)`,
            lateCount: sql<number>`count(case when ${attendance.status} = 'late' then 1 end)`,
            totalStudents: sql<number>`count(*)`,
            isDraft: sql<boolean>`max(${attendance.isDraft})`,
            updatedAt: sql<string>`max(${attendance.updatedAt})`
        })
        .from(attendance)
        .leftJoin(teachers, eq(attendance.teacherId, teachers.id))
        .leftJoin(users, eq(teachers.userId, users.id))
        .leftJoin(sections, eq(attendance.sectionId, sections.id))
        .where(and(...whereConditions))
        .groupBy(attendance.timetableId, attendance.date, attendance.teacherId, attendance.subject, attendance.sectionId)
        .orderBy(desc(attendance.date), desc(sql`max(${attendance.updatedAt})`));

        return NextResponse.json(sessions);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
