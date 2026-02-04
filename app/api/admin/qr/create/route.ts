import { db } from '@/lib/db';
import { qrCodes, sessionAllowedStudents } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { sectionId, subject, teacherId, allowedStudents } = await request.json();
        const code = uuidv4();
        const id = uuidv4();

        await db.insert(qrCodes).values({
            id,
            sectionId: sectionId || null,
            subject,
            teacherId: teacherId || null,
            code,
            isActive: true,
        });

        if (allowedStudents && allowedStudents.length > 0) {
            const studentValues = allowedStudents.map((usn: string) => ({
                id: uuidv4(),
                qrCodeId: id,
                usn: usn.trim().toUpperCase(),
            }));
            await db.insert(sessionAllowedStudents).values(studentValues);
        }

        return NextResponse.json({ success: true, code });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
