import { db } from '@/lib/db';
import { teachers, timetable, sections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import WeeklyCalendar from '@/components/WeeklyCalendar';

export default async function TeacherSchedule() {
    const session = await getSession();
    if (!session) return null;

    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) return <div>Teacher profile not found.</div>;

    const schedule = await db.select({
        id: timetable.id,
        subject: timetable.subject,
        day: timetable.dayOfWeek,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        sectionName: sections.name,
    })
        .from(timetable)
        .where(eq(timetable.teacherId, teacher.id))
        .leftJoin(sections, eq(timetable.sectionId, sections.id))
        .orderBy(timetable.startTime);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Weekly Schedule</h1>
                <p className="text-slate-500 mt-1">Your academic timetable for the current semester.</p>
            </header>

            <WeeklyCalendar schedule={schedule} />
        </div>
    );
}
