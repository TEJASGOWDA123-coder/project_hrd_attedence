import { db } from '@/lib/db';
import { students, sections, attendance } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    try {
        // Fetch students with their section and attendance counts
        const data = await db.select({
            id: students.id,
            usn: students.usn,
            name: students.name,
            batch: students.batch,
            year: students.year,
            sectionId: students.sectionId,
            sectionName: sections.name,
            attendancePercentage: students.attendancePercentage,
            // Subqueries for basic stats (informational)
            totalSessions: sql<number>`(SELECT COUNT(*) FROM attendance WHERE student_id = ${students.id})`,
            presentSessions: sql<number>`(SELECT COUNT(*) FROM attendance WHERE student_id = ${students.id} AND status = 'present')`,
        })
            .from(students)
            .leftJoin(sections, eq(students.sectionId, sections.id))
            .where(sectionId ? eq(students.sectionId, sectionId) : undefined);

        return NextResponse.json(data);
    } catch (err: any) {
        console.error('Error fetching students:', err);
        return NextResponse.json({ error: 'Failed to fetch students', details: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { usn, name, batch, year, sectionId } = await request.json();
    const id = Math.random().toString(36).substring(2, 11);

    try {
        const normalizedUsn = usn?.toString().trim().toUpperCase();
        await db.insert(students).values({ 
            id, 
            usn: normalizedUsn, 
            name, 
            batch: batch || null, 
            year: year || null, 
            sectionId 
        });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.delete(students).where(eq(students.id, id));
    return NextResponse.json({ success: true });
}
