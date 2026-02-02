import { db } from '@/lib/db';
import { students, sections } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { students: studentData } = await request.json();

        if (!Array.isArray(studentData) || studentData.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty student list' }, { status: 400 });
        }

        // 1. Get all sections to match names to IDs
        const allSections = await db.select().from(sections);
        const sectionMap = new Map(allSections.map(s => [s.name.toLowerCase(), s.id]));

        // 2. Prepare data for insertion
        const toInsert = studentData.map((s: any) => ({
            id: Math.random().toString(36).substring(2, 11),
            usn: s.usn,
            name: s.name,
            email: s.email,
            batch: s.batch,
            year: s.year,
            phone: s.phone,
            sectionId: sectionMap.get(s.sectionName?.toLowerCase()) || null,
        }));

        // 3. Perform bulk insert in a transaction
        await db.transaction(async (tx) => {
            // We use a loop for individual inserts if the DB driver doesn't support batch well, 
            // but Drizzle's .insert().values([]) is efficient on SQLite/LibSQL.
            await tx.insert(students).values(toInsert);
        });

        return NextResponse.json({
            success: true,
            count: toInsert.length,
            message: `Successfully enrolled ${toInsert.length} students.`
        });

    } catch (err: any) {
        console.error('Bulk Enrollment Error:', err);
        if (err.message?.includes('UNIQUE constraint failed: students.email')) {
            return NextResponse.json({ error: 'One or more emails already exist in the system.' }, { status: 400 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
