import { db } from '@/lib/db';
import { students, sections } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { students: studentData } = await request.json();

        if (!Array.isArray(studentData) || studentData.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty student list' }, { status: 400 });
        }

        const allSections = await db.select().from(sections);
        const sectionMap = new Map(allSections.map(s => [s.name.toLowerCase(), s.id]));

        const toInsert = studentData
            .filter((s: any) => s.usn && s.name) // Basic validation
            .map((s: any) => ({
                id: uuidv4(),
                usn: s.usn.toString().trim().toUpperCase(),
                name: s.name.trim(),
                batch: s.batch ? s.batch.toString().trim() : null,
                year: s.year ? s.year.toString().trim() : null,
                sectionId: sectionMap.get(s.sectionName?.toLowerCase().trim()) || null,
            }));

        if (toInsert.length === 0) {
            return NextResponse.json({ error: 'No valid student data found in the uploaded list.' }, { status: 400 });
        }

        await db.insert(students).values(toInsert);

        return NextResponse.json({
            success: true,
            count: toInsert.length,
            message: `Successfully enrolled ${toInsert.length} students.`
        });

    } catch (err: any) {
        console.error('Bulk Enrollment Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { ids, sectionId, batch, year } = await request.json();

        if (ids && Array.isArray(ids) && ids.length > 0) {
            await db.delete(students).where(inArray(students.id, ids));
            return NextResponse.json({ success: true, message: `Deleted ${ids.length} students.` });
        }

        if (sectionId || batch || year) {
            const conditions = [];
            if (sectionId) conditions.push(eq(students.sectionId, sectionId));
            if (batch) conditions.push(eq(students.batch, batch));
            if (year) conditions.push(eq(students.year, year));

            await db.delete(students).where(and(...conditions));
            return NextResponse.json({ success: true, message: 'Students deleted based on filters.' });
        }

        return NextResponse.json({ error: 'No deletion criteria provided' }, { status: 400 });
    } catch (err: any) {
        console.error('Bulk Delete Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
