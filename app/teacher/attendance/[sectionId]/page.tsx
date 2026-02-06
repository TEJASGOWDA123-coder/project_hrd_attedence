import { db } from '@/lib/db';
import { sections, students, attendance } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import AttendanceForm from '@/components/AttendanceForm';
import { Clock } from 'lucide-react';

export default async function AttendancePage({
    params,
    searchParams
}: {
    params: Promise<{ sectionId: string }>,
    searchParams: Promise<{ subject?: string, timetableId?: string, endTime?: string }>
}) {
    const { sectionId } = await params;
    const { subject, timetableId, endTime } = await searchParams;

    const date = new Date().toISOString().split('T')[0];
    const existingRecords = await db.query.attendance.findMany({
        where: and(
            eq(attendance.date, date),
            timetableId ? eq(attendance.timetableId, timetableId) : eq(attendance.subject, subject || 'General')
        )
    });

    const initialAttendance = existingRecords.reduce((acc, rec) => ({
        ...acc,
        [rec.studentId]: rec.status
    }), {});

    const section = await db.query.sections.findFirst({
        where: eq(sections.id, sectionId),
    });

    if (!section) return <div className="p-8 text-center font-bold text-rose-500">Section not found.</div>;

    const sectionStudents = await db.select()
        .from(students)
        .where(eq(students.sectionId, sectionId));

    return (
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 text-indigo-600 mb-4">
                        <div className="p-2.5 bg-indigo-50 rounded-xl ring-1 ring-indigo-100">
                            <Clock size={20} className="animate-pulse" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Session in Progress</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
                        Section {section.name}
                    </h1>
                </div>
                <div className="bg-white px-8 py-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Subject</p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{subject || 'General'}</p>
                    </div>
                </div>
            </div>

            <AttendanceForm 
                students={sectionStudents} 
                sectionId={sectionId} 
                subject={subject || 'General'} 
                timetableId={timetableId}
                sectionName={section.name}
                endTime={endTime}
                initialAttendance={initialAttendance}
            />
        </div>
    );
}
