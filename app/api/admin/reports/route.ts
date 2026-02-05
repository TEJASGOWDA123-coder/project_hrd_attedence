import { db } from '@/lib/db';
import { attendance, students, sections } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const subject = searchParams.get('subject');

    let query = db.select({
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        subject: attendance.subject,
        studentName: students.name,
        sectionName: sections.name,
        attendancePercentage: students.attendancePercentage,
        createdAt: attendance.createdAt,
    })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .leftJoin(sections, eq(attendance.sectionId, sections.id));

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
        // Case-insensitive subject filter using LIKE
        filters.push(sql`LOWER(${attendance.subject}) LIKE LOWER(${'%' + subject + '%'})`);
    }

    if (filters.length > 0) {
        // @ts-ignore
        query = query.where(and(...filters));
    }

    const data = await query;
    return NextResponse.json(data);
}
