import { db } from '@/lib/db';
import { teachers, sections, timetable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { ClipboardCheck, ArrowRight, Landmark, Users, Clock } from 'lucide-react';

export default async function TeacherAttendanceSelection() {
    const session = await getSession();
    if (!session) return null;

    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) return <div>Teacher profile not found.</div>;

    // Get unique sections assigned to this teacher
    const assignedSections = await db.selectDistinct({
        id: sections.id,
        name: sections.name,
    })
        .from(timetable)
        .where(eq(timetable.teacherId, teacher.id))
        .leftJoin(sections, eq(timetable.sectionId, sections.id));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mark Attendance</h1>
                <p className="text-slate-500 mt-1">Select a class to start recording attendance logs.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {assignedSections.map((section) => (
                    <div key={section.id} className="group relative">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-purple-100 transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                    <Landmark size={24} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section ID</p>
                                    <p className="text-xs font-bold text-slate-900 mt-1 uppercase tracking-tighter">{section.id?.substring(0, 8)}</p>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{section.name || 'Unknown Section'}</h3>
                            <p className="text-sm text-slate-400 font-medium mb-8">Ready for today's roll call session.</p>

                            <Link
                                href={`/teacher/attendance/${section.id}`}
                                className="flex items-center justify-between w-full bg-slate-900 text-white p-5 rounded-2xl hover:bg-purple-600 transition-all group-hover:shadow-xl group-hover:shadow-purple-200"
                            >
                                <span className="flex items-center gap-3 font-bold text-sm">
                                    <ClipboardCheck size={18} />
                                    Mark Now
                                </span>
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                ))}

                {assignedSections.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-200">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                            <Users size={64} strokeWidth={1} />
                            <p className="text-sm font-bold uppercase tracking-widest">No sections assigned specifically to your record.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
