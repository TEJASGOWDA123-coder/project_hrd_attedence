import { db } from '@/lib/db';
import { sections, students } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await db.select({
            id: sections.id,
            name: sections.name,
            studentCount: sql<number>`count(${students.id})`.mapWith(Number),
        })
            .from(sections)
            .leftJoin(students, eq(sections.id, students.sectionId))
            .groupBy(sections.id, sections.name);

        console.log('Sections fetched successfully:', data.length, 'sections');
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('Error fetching sections:', err);
        console.error('Error stack:', err.stack);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            name: err.name
        });
        return NextResponse.json({ error: 'Failed to fetch sections', details: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { name } = await request.json();
    const id = Math.random().toString(36).substring(2, 11);

    try {
        await db.insert(sections).values({ id, name });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await db.delete(sections).where(eq(sections.id, id));
    return NextResponse.json({ success: true });
}
