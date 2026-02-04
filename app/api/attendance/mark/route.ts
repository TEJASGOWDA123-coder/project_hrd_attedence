import { db } from '@/lib/db';
import { qrCodes, students, attendance, sections, sessionAllowedStudents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { code, usn } = await request.json();

        // 1. Verify Code
        const session = await db.query.qrCodes.findFirst({
            where: and(eq(qrCodes.code, code), eq(qrCodes.isActive, true))
        });

        if (!session) {
            return NextResponse.json({ error: 'Invalid or expired QR code.' }, { status: 400 });
        }

        // 1.5 Check if Whitelist exists
        const whitelistCheck = await db.query.sessionAllowedStudents.findFirst({
            where: eq(sessionAllowedStudents.qrCodeId, session.id)
        });

        if (whitelistCheck) {
            const isAllowed = await db.query.sessionAllowedStudents.findFirst({
                where: and(
                    eq(sessionAllowedStudents.qrCodeId, session.id),
                    eq(sessionAllowedStudents.usn, usn)
                )
            });
            if (!isAllowed) {
                return NextResponse.json({ error: 'You are not in the allowed list for this session.' }, { status: 403 });
            }
        }

        // 2. Find Student
        const student = await db.query.students.findFirst({
            where: eq(students.usn, usn)
        });

        if (!student) {
            return NextResponse.json({ error: 'Student found with this USN.' }, { status: 404 });
        }

        // 3. Mark Attendance
        // Check if already marked for this date/subject? 
        // For simplicity, we just insert. Or upsert to avoid duplicates.
        const today = new Date().toISOString().split('T')[0];
        
        const existing = await db.query.attendance.findFirst({
            where: and(
                eq(attendance.studentId, student.id),
                eq(attendance.date, today),
                eq(attendance.subject, session.subject)
            )
        });

        if (existing) {
             return NextResponse.json({ success: true, message: 'Already marked present.' });
        }

        const id = uuidv4();
        await db.insert(attendance).values({
            id,
            studentId: student.id,
            sectionId: session.sectionId || student.sectionId,
            teacherId: session.teacherId,
            date: today,
            status: 'present',
            subject: session.subject
        });

        return NextResponse.json({ success: true, studentName: student.name });

    } catch (error: any) {
        console.error('Mark Attendance Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
