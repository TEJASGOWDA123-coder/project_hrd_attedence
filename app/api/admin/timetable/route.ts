import { db } from '@/lib/db';
import { timetable, sections, teachers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    const data = await db.select({
        id: timetable.id,
        subject: timetable.subject,
        day: timetable.dayOfWeek,
        date: timetable.date,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        sectionName: sections.name,
        teacherName: users.name,
        sectionId: timetable.sectionId,
        teacherId: timetable.teacherId,
    })
        .from(timetable)
        .leftJoin(sections, eq(timetable.sectionId, sections.id))
        .leftJoin(teachers, eq(timetable.teacherId, teachers.id))
        .leftJoin(users, eq(teachers.userId, users.id));

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const { sectionId, teacherId, subject, dayOfWeek, date, startTime, endTime } = await request.json();
    const id = Math.random().toString(36).substring(2, 11);

    try {
        await db.insert(timetable).values({ id, sectionId, teacherId, subject, dayOfWeek, date, startTime, endTime });

        // Get teacher email and send notification
        const teacher = await db.query.teachers.findFirst({
            where: eq(teachers.id, teacherId)
        });

        if (teacher) {
            const teacherUser = await db.query.users.findFirst({
                where: eq(users.id, teacher.userId)
            });

            if (teacherUser && teacherUser.email) {
                const { sendEmail } = await import('@/lib/email');
                await sendEmail({
                    to: teacherUser.email,
                    subject: `📅 New Class Schedule: ${subject}`,
                    text: `Hello ${teacherUser.name}, you have been assigned a new class schedule for ${subject} on ${dayOfWeek} at ${startTime}.`,
                    html: `<h3>New Schedule Assigned</h3>
                           <p>Hello <b>${teacherUser.name}</b>,</p>
                           <p>You have been assigned a new class schedule:</p>
                           <ul>
                             <li><b>Subject:</b> ${subject}</li>
                             <li><b>Day:</b> ${dayOfWeek}</li>
                             <li><b>Time:</b> ${startTime} - ${endTime}</li>
                           </ul>`
                }).catch(err => console.error('Failed to send initial schedule email:', err));
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await db.delete(timetable).where(eq(timetable.id, id));
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const { id, sectionId, teacherId, subject, dayOfWeek, date, startTime, endTime } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await db.update(timetable)
            .set({ sectionId, teacherId, subject, dayOfWeek, date, startTime, endTime })
            .where(eq(timetable.id, id));

        // Get teacher email and send notification
        const teacher = await db.query.teachers.findFirst({
            where: eq(teachers.id, teacherId)
        });

        if (teacher) {
            const teacherUser = await db.query.users.findFirst({
                where: eq(users.id, teacher.userId)
            });

            if (teacherUser && teacherUser.email) {
                const { sendEmail } = await import('@/lib/email');
                await sendEmail({
                    to: teacherUser.email,
                    subject: `📅 Schedule Updated: ${subject}`,
                    text: `Hello ${teacherUser.name}, your class schedule for ${subject} on ${dayOfWeek} at ${startTime} has been updated.`,
                    html: `<h3>Schedule Updated</h3>
                           <p>Hello <b>${teacherUser.name}</b>,</p>
                           <p>Your class schedule has been updated:</p>
                           <ul>
                             <li><b>Subject:</b> ${subject}</li>
                             <li><b>Day:</b> ${dayOfWeek}</li>
                             <li><b>Time:</b> ${startTime} - ${endTime}</li>
                           </ul>`
                }).catch(err => console.error('Failed to send update schedule email:', err));
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
