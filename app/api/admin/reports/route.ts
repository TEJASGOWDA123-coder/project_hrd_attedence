import { db } from '@/lib/db';
import { attendance, students, sections } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const date = searchParams.get('date');

    let query = db.select({
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        studentName: students.name,
        sectionName: sections.name,
    })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .leftJoin(sections, eq(attendance.sectionId, sections.id));

    const filters = [];
    if (sectionId) filters.push(eq(attendance.sectionId, sectionId));
    if (date) filters.push(eq(attendance.date, date));

    if (filters.length > 0) {
        // @ts-ignore
        query = query.where(and(...filters));
    }

    const data = await query;
    return NextResponse.json(data);
}
