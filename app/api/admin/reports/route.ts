import { db } from '@/lib/db';
import { attendance, students, sections, teachers, users } from '@/lib/db/schema';
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
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const minAttendance = searchParams.get('minAttendance');
    const maxAttendance = searchParams.get('maxAttendance');
    const batch = searchParams.get('batch');
    const year = searchParams.get('year');
    const defaulterOnly = searchParams.get('defaulterOnly') === 'true';
    const teacherId = searchParams.get('teacherId');
    const lateCountMin = searchParams.get('lateCountMin');

    let query = db.select({
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        subject: attendance.subject,
        studentName: students.name,
        usn: students.usn,
        batch: students.batch,
        year: students.year,
        sectionName: sections.name,
        attendancePercentage: students.attendancePercentage,
        createdAt: attendance.createdAt,
        teacherName: users.name,
    })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .leftJoin(sections, eq(attendance.sectionId, sections.id))
        .leftJoin(teachers, eq(attendance.teacherId, teachers.id))
        .leftJoin(users, eq(teachers.userId, users.id))
        .$dynamic();

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
        filters.push(sql`LOWER(${attendance.subject}) LIKE LOWER(${'%' + subject + '%'})`);
    }

    if (search && search !== '') {
        filters.push(sql`(LOWER(${students.name}) LIKE LOWER(${'%' + search + '%'}) OR LOWER(${students.usn}) LIKE LOWER(${'%' + search + '%'}))`);
    }

    if (status && status !== '' && status !== 'all') {
        filters.push(eq(attendance.status, status as any));
    }

    if (defaulterOnly) {
        filters.push(sql`${students.attendancePercentage} < 75`);
    } else {
        if (minAttendance && minAttendance !== '') {
            filters.push(sql`${students.attendancePercentage} >= ${parseInt(minAttendance)}`);
        }
        if (maxAttendance && maxAttendance !== '') {
            filters.push(sql`${students.attendancePercentage} <= ${parseInt(maxAttendance)}`);
        }
    }

    if (batch && batch !== '') {
        filters.push(eq(students.batch, batch));
    }

    if (year && year !== '') {
        filters.push(eq(students.year, year));
    }

    if (teacherId && teacherId !== '') {
        filters.push(eq(attendance.teacherId, teacherId));
    }

    if (lateCountMin && lateCountMin !== '') {
        // Subquery to find students who have more than lateCountMin late arrivals in ANY subject
        const threshold = parseInt(lateCountMin);
        filters.push(sql`${attendance.studentId} IN (
            SELECT student_id FROM subject_stats WHERE late_count >= ${threshold}
        )`);
    }

    if (filters.length > 0) {
        query = query.where(and(...filters));
    }

    // Order by date and time
    query = query.orderBy(sql`${attendance.date} DESC, ${attendance.createdAt} DESC`);

    const data = await query;
    return NextResponse.json(data);
}
