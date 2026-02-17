import { db } from '@/lib/db';
import { teachers, sections, timetable, attendance } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import TeacherAttendanceList from '@/components/TeacherAttendanceList';

export default async function TeacherAttendanceSelection() {
    const session = await getSession();
    if (!session) return null;

    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) return <div>Teacher profile not found.</div>;

    // Get classes assigned to this teacher
    const assignedClasses = await db.select({
        timetableId: timetable.id,
        sectionId: sections.id,
        sectionName: sections.name,
        subject: timetable.subject,
        dayOfWeek: timetable.dayOfWeek,
        date: timetable.date,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
    })
        .from(timetable)
        .where(eq(timetable.teacherId, teacher.id))
        .leftJoin(sections, eq(timetable.sectionId, sections.id));

    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Filter for classes scheduled for today (either by specific date or weekly day)
    const todaysClasses = assignedClasses.filter(cls => {
        if (cls.date) return cls.date === todayStr;
        return cls.dayOfWeek === todayDayName;
    });

    const todayAttendance = await db.select({
        timetableId: attendance.timetableId,
        isDraft: attendance.isDraft,
    })
    .from(attendance)
    .where(and(
        eq(attendance.teacherId, teacher.id),
        eq(attendance.date, todayStr)
    ))
    .groupBy(attendance.timetableId, attendance.isDraft);

    const dataList = todaysClasses.map(cls => {
        const attRecord = todayAttendance.find(a => a.timetableId === cls.timetableId);
        let status: 'completed' | 'pending' | 'draft' = 'pending';
        if (attRecord) {
            status = attRecord.isDraft ? 'draft' : 'completed';
        }

        return {
            timetableId: cls.timetableId,
            sectionId: cls.sectionId as string,
            sectionName: cls.sectionName,
            subject: cls.subject as string,
            time: `${cls.startTime} - ${cls.endTime}`,
            endTime: cls.endTime as string,
            status
        };
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mark Attendance</h1>
                <p className="text-slate-500 mt-1">Select a class to start recording attendance logs.</p>
            </header>

            <TeacherAttendanceList assignedClasses={dataList} />
        </div>
    );
}
