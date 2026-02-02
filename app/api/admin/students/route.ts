import { db } from '@/lib/db';
import { students, sections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    const data = await db.select({
        id: students.id,
        usn: students.usn,
        name: students.name,
        email: students.email,
        batch: students.batch,
        year: students.year,
        phone: students.phone,
        sectionId: students.sectionId,
        sectionName: sections.name,
    })
        .from(students)
        .leftJoin(sections, eq(students.sectionId, sections.id));

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const { usn, name, email, batch, year, phone, sectionId } = await request.json();
    const id = Math.random().toString(36).substring(2, 11);

    try {
        await db.insert(students).values({ id, usn, name, email, batch, year, phone, sectionId });
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
