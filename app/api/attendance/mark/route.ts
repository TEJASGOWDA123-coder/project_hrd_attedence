import { db } from '@/lib/db';
import { qrCodes, students, attendance, sections, sessionAllowedStudents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { code, token, usn: rawUsn, lat, lng } = await request.json();
        const usn = rawUsn?.toString().trim().toUpperCase();

        function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
            const R = 6371e3; // meters
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180;
            const Δλ = (lon2 - lon1) * Math.PI / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return R * c; // in meters
        }

        // 1. Verify Code, Activity, and Token (Allow current or previous)
        const session = await db.query.qrCodes.findFirst({
            where: and(
                eq(qrCodes.code, code), 
                eq(qrCodes.isActive, true)
            )
        });

        if (!session || (session.rotatingToken !== token && session.previousToken !== token)) {
            return NextResponse.json({ error: 'Invalid or expired QR code.' }, { status: 400 });
        }

        // 1.2 Geolocation Check (if enabled for this session)
        if (session.latitude && session.longitude) {
            if (!lat || !lng) {
                return NextResponse.json({ error: 'Location access is required for this session. Please enable GPS and try again.' }, { status: 403 });
            }

            const distance = getDistance(session.latitude, session.longitude, lat, lng);
            const radius = session.radius || 100;

            if (distance > radius) {
                return NextResponse.json({ error: `You are too far from the classroom (${Math.round(distance)}m). Attendance denied.` }, { status: 403 });
            }
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
            return NextResponse.json({ error: 'No student found with this USN.' }, { status: 404 });
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
