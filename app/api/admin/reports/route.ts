import { db } from '@/lib/db';
import { attendance, students, sections } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const timezoneOffset = searchParams.get('timezoneOffset'); // in minutes, from client
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

    // Time range filtering (SQLite specific, handles UTC to Local conversion using provided offset)
    if (startTime && startTime !== '' && timezoneOffset) {
        const offsetMinutes = -parseInt(timezoneOffset);
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const absMinutes = Math.abs(offsetMinutes);
        const offsetString = `${sign}${absMinutes} minutes`;
        filters.push(sql`strftime('%H:%M', ${attendance.createdAt}, ${offsetString}) >= ${startTime}`);
    }
    if (endTime && endTime !== '' && timezoneOffset) {
        const offsetMinutes = -parseInt(timezoneOffset);
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const absMinutes = Math.abs(offsetMinutes);
        const offsetString = `${sign}${absMinutes} minutes`;
        filters.push(sql`strftime('%H:%M', ${attendance.createdAt}, ${offsetString}) <= ${endTime}`);
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
