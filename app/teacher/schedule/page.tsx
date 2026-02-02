import { db } from '@/lib/db';
import { teachers, timetable, sections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { Calendar, Clock, Landmark, BookOpen } from 'lucide-react';

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

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Weekly Schedule</h1>
                <p className="text-slate-500 mt-1">Your academic timetable for the current semester.</p>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {days.map((day) => {
                    const dayClasses = schedule.filter(s => s.day === day);
                    if (dayClasses.length === 0) return null;

                    return (
                        <div key={day} className="space-y-4">
                            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="w-8 h-px bg-indigo-100" />
                                {day}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dayClasses.map((cls) => (
                                    <div key={cls.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Slot</p>
                                                <p className="text-xs font-bold text-slate-900 mt-1">{cls.startTime} - {cls.endTime}</p>
                                            </div>
                                        </div>

                                        <h4 className="text-xl font-black text-slate-900 tracking-tight mb-4">{cls.subject}</h4>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Landmark size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600">{cls.sectionName}</span>
                                            </div>
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {schedule.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-200">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                        <Calendar size={64} strokeWidth={1} />
                        <p className="text-sm font-bold uppercase tracking-widest">No classes assigned to you yet.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
