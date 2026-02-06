import { db } from '@/lib/db';
import { qrCodes, attendance, students } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        let session;
        if (code) {
            session = await db.query.qrCodes.findFirst({
                where: eq(qrCodes.code, code)
            });
        } else {
            // Find the latest active session for this date
            // Note: In a multi-admin system you might want to filter by teacherId
            session = await db.query.qrCodes.findFirst({
                where: eq(qrCodes.isActive, true),
                orderBy: (qrCodes, { desc }) => [desc(qrCodes.createdAt)]
            });
        }

        if (!session) return NextResponse.json({ isActive: false, students: [] });

        // Token Rotation Logic (every 30 seconds)
        const now = new Date();
        const lastUpdate = session.tokenUpdatedAt ? new Date(session.tokenUpdatedAt) : new Date(0);
        const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

        let currentToken = session.rotatingToken;
        if (diffSeconds > 30 && session.isActive) {
            const nextToken = Math.random().toString(36).substring(2, 10);
            await db.update(qrCodes)
                .set({ 
                    previousToken: currentToken,
                    rotatingToken: nextToken, 
                    tokenUpdatedAt: now.toISOString() 
                })
                .where(eq(qrCodes.id, session.id));
            currentToken = nextToken;
        }

        const today = new Date().toISOString().split('T')[0];

        // Fetch attendance for this session's context (Date + Subject + Section)
        // Note: We are fetching everyone marked present for THIS subject on THIS date.
        // This assumes the QR code is for today.
        
        const presentStudents = await db.select({
            usn: students.usn,
            name: students.name,
            timestamp: attendance.createdAt,
        })
        .from(attendance)
        .innerJoin(students, eq(attendance.studentId, students.id))
        .where(and(
            eq(attendance.date, today),
            eq(attendance.subject, session.subject),
            eq(attendance.status, 'present')
        ));

        return NextResponse.json({ 
            isActive: session.isActive,
            code: session.code,
            rotatingToken: currentToken,
            subject: session.subject,
            students: presentStudents 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
