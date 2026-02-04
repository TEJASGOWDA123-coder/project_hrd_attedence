import { db } from '@/lib/db';
import { attendance, students, sections, teachers } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session || session.user.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const subject = searchParams.get('subject');

    let query = db.select({
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        subject: attendance.subject, // Added subject to selection
        studentName: students.name,
        sectionName: sections.name,
    })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .leftJoin(sections, eq(attendance.sectionId, sections.id))
        .where(eq(attendance.teacherId, teacher.id));

    const filters = [];
    if (sectionId && sectionId !== '') filters.push(eq(attendance.sectionId, sectionId));
    
    // Date range filtering
    if (startDate && startDate !== '') {
        filters.push(sql`${attendance.date} >= ${startDate}`);
    }
    if (endDate && endDate !== '') {
        filters.push(sql`${attendance.date} <= ${endDate}`);
    }

    if (subject && subject !== '') {
        filters.push(sql`LOWER(${attendance.subject}) LIKE LOWER(${'%' + subject + '%'})`);
    }

    if (filters.length > 0) {
        // @ts-ignore
        query = query.where(and(eq(attendance.teacherId, teacher.id), ...filters));
    }

    const data = await query;
    return NextResponse.json(data);
}
