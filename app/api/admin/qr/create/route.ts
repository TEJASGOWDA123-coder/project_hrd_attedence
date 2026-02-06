import { db } from '@/lib/db';
import { qrCodes, sessionAllowedStudents } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const { sectionId, subject, teacherId, allowedStudents, latitude, longitude, radius } = await request.json();
        const code = uuidv4();
        const id = uuidv4();
        const tokenUpdatedAt = new Date().toISOString();
        const rotatingToken = Math.random().toString(36).substring(2, 10);

        await db.insert(qrCodes).values({
            id,
            sectionId: sectionId || null,
            subject,
            teacherId: teacherId || null,
            code,
            rotatingToken,
            previousToken: null,
            tokenUpdatedAt,
            isActive: true, // Drizzle will convert to 1 for SQLite
            latitude: latitude || null,
            longitude: longitude || null,
            radius: radius || 100,
            createdAt: tokenUpdatedAt,
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
        console.error('QR Session Creation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
