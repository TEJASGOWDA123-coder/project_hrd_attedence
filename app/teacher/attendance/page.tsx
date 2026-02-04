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

    // Get unique section+subject combinations assigned to this teacher
    const assignedClasses = await db.selectDistinct({
        sectionId: sections.id,
        sectionName: sections.name,
        subject: timetable.subject,
    })
        .from(timetable)
        .where(eq(timetable.teacherId, teacher.id))
        .leftJoin(sections, eq(timetable.sectionId, sections.id));

    // Check for today's attendance
    // Use timezone offset to ensure correct 'local' date for the server/db
    // For simplicity, we'll use the server's local date or assume usage pattern. 
    // Ideally, pass client timezone or standardise on UTC. 
    // Here we use simple YYYY-MM-DD based on server time.
    const today = new Date();
    // Adjust to local time string 'YYYY-MM-DD'
    const todayStr = today.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD

    const todayAttendance = await db.select({
        sectionId: attendance.sectionId,
        subject: attendance.subject,
    })
    .from(attendance)
    .where(and(
        eq(attendance.teacherId, teacher.id),
        eq(attendance.date, todayStr)
    ));

    const getStatus = (cls: any): 'completed' | 'pending' => {
        const isCompleted = todayAttendance.some(
            a => a.sectionId === cls.sectionId && a.subject === cls.subject
        );
        return isCompleted ? 'completed' : 'pending';
    };

    const dataList = assignedClasses
        .filter(cls => cls.sectionId !== null && cls.subject !== null)
        .map(cls => ({
            sectionId: cls.sectionId as string,
            sectionName: cls.sectionName,
            subject: cls.subject as string,
            status: getStatus(cls)
        }));

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
