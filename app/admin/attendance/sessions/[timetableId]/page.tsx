import { db } from '@/lib/db';
import { sections, students, attendance, timetable, teachers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import AdminAttendanceForm from '@/components/AdminAttendanceForm';
import { ShieldAlert, Calendar as CalIcon, Landmark, User as UserIcon } from 'lucide-react';

export default async function AdminAttendanceEditPage({
    params,
    searchParams
}: {
    params: Promise<{ timetableId: string }>,
    searchParams: Promise<{ date: string }>
}) {
    const { timetableId } = await params;
    const { date } = await searchParams;

    if (!date) return <div className="p-8 text-rose-500 font-bold">Error: Date parameter is required.</div>;

    // Fetch session details
    const sessionInfo = await db.select({
        subject: timetable.subject,
        sectionId: timetable.sectionId,
        sectionName: sections.name,
        teacherName: users.name,
        teacherId: teachers.id
    })
    .from(timetable)
    .where(eq(timetable.id, timetableId))
    .leftJoin(sections, eq(timetable.sectionId, sections.id))
    .leftJoin(teachers, eq(timetable.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .then(res => res[0]);

    if (!sessionInfo) return <div className="p-8 text-rose-500 font-bold">Error: Session not found.</div>;

    // Fetch existing records for this session
    const existingRecords = await db.query.attendance.findMany({
        where: and(
            eq(attendance.timetableId, timetableId),
            eq(attendance.date, date)
        )
    });

    const initialAttendanceMap = existingRecords.reduce((acc, rec) => ({
        ...acc,
        [rec.studentId]: rec.status
    }), {});

    // Fetch all students for this section
    const sectionStudents = await db.select()
        .from(students)
        .where(eq(students.sectionId, sessionInfo.sectionId as string));

    return (
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-20 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-rose-600">
                        <div className="p-2.5 bg-rose-50 rounded-xl ring-1 ring-rose-100">
                            <ShieldAlert size={20} className="animate-pulse" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Administrative Override</span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                            {sessionInfo.sectionName}
                        </h1>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">{sessionInfo.subject}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                            <CalIcon size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Session Date</span>
                        </div>
                        <p className="text-sm font-black text-slate-900">{date}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                            <UserIcon size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Original Teacher</span>
                        </div>
                        <p className="text-sm font-black text-slate-900">{sessionInfo.teacherName}</p>
                    </div>
                </div>
            </div>

            <AdminAttendanceForm 
                students={sectionStudents} 
                sectionId={sessionInfo.sectionId as string} 
                subject={sessionInfo.subject as string} 
                timetableId={timetableId}
                date={date}
                initialAttendance={initialAttendanceMap}
                teacherId={sessionInfo.teacherId as string}
            />
        </div>
    );
}
