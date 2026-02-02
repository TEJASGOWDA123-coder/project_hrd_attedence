import { db } from '@/lib/db';
import { timetable, sections, teachers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    const data = await db.select({
        id: timetable.id,
        subject: timetable.subject,
        day: timetable.dayOfWeek,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        sectionName: sections.name,
        teacherName: users.name,
    })
        .from(timetable)
        .leftJoin(sections, eq(timetable.sectionId, sections.id))
        .leftJoin(teachers, eq(timetable.teacherId, teachers.id))
        .leftJoin(users, eq(teachers.userId, users.id));

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const { sectionId, teacherId, subject, dayOfWeek, startTime, endTime } = await request.json();
    const id = Math.random().toString(36).substring(2, 11);

    try {
        await db.insert(timetable).values({ id, sectionId, teacherId, subject, dayOfWeek, startTime, endTime });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
