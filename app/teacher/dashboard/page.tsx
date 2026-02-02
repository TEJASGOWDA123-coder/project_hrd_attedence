import { db } from '@/lib/db';
import { sections, timetable, teachers, users, attendance, students } from '@/lib/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import {
    ClipboardCheck,
    Users,
    Calendar,
    ArrowRight,
    Clock,
    MapPin,
    TrendingUp,
    CheckCircle2,
    XCircle,
    AlertCircle,
    History,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function TeacherDashboard() {
    const session = await getSession();
    if (!session) return null;

    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) return <div>Teacher profile not found.</div>;

    // Assigned sections and classes (unique combinations)
    const assignedClasses = await db.selectDistinct({
        sectionId: sections.id,
        sectionName: sections.name,
        subject: timetable.subject,
        day: timetable.dayOfWeek,
        startTime: timetable.startTime,
    })
        .from(timetable)
        .where(eq(timetable.teacherId, teacher.id))
        .leftJoin(sections, eq(timetable.sectionId, sections.id))
        .groupBy(sections.id, sections.name, timetable.subject);

    // Attendance Stats for this teacher
    const statsResult = await db.select({
        status: attendance.status,
        count: sql<number>`count(*)`.mapWith(Number),
    })
        .from(attendance)
        .where(eq(attendance.teacherId, teacher.id))
        .groupBy(attendance.status);

    const totalAttendance = statsResult.reduce((acc, curr) => acc + curr.count, 0);
    const presentCount = statsResult.find(s => s.status === 'present')?.count || 0;
    const absentCount = statsResult.find(s => s.status === 'absent')?.count || 0;
    const lateCount = statsResult.find(s => s.status === 'late')?.count || 0;

    const attendanceRate = totalAttendance > 0
        ? ((presentCount / totalAttendance) * 100).toFixed(1)
        : '0.0';

    // Recent Marks (Last 5 Entries)
    const recentMarks = await db.select({
        id: attendance.id,
        status: attendance.status,
        date: attendance.date,
        studentName: students.name,
        sectionName: sections.name,
    })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .leftJoin(sections, eq(attendance.sectionId, sections.id))
        .where(eq(attendance.teacherId, teacher.id))
        .orderBy(desc(attendance.createdAt))
        .limit(5);

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Console</h1>
                    <p className="text-slate-500 mt-1">Ready to manage your academic sessions, <span className="text-indigo-600 font-bold">{session.user.name}</span>?</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Profile Status</p>
                        <p className="text-sm font-bold text-emerald-500 flex items-center gap-1 justify-end mt-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Academic Lead
                        </p>
                    </div>
                </div>
            </header>

            {/* Attendance Analytics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">My Attendance Rate</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-slate-900">{attendanceRate}%</h4>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-100/50">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Present Total</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-emerald-700">{presentCount}</h4>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 shadow-sm transition-all hover:shadow-xl hover:shadow-rose-100/50">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Absent Total</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-rose-700">{absentCount}</h4>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                            <XCircle size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 shadow-sm transition-all hover:shadow-xl hover:shadow-amber-100/50">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Late Total</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-3xl font-black text-amber-700">{lateCount}</h4>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Personal Schedule Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Calendar size={120} strokeWidth={1} />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                Session Schedule
                            </h3>

                            <div className="space-y-4">
                                {assignedClasses.length > 0 ? assignedClasses.map((cls, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="bg-white p-2 rounded-xl text-slate-900 font-black text-xs min-w-[50px] text-center">
                                            {cls.startTime}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white leading-tight">{cls.subject}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{cls.sectionName}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No classes assigned</p>
                                        <p className="text-[10px] text-slate-500 mt-1 italic">Consult admin for timetable updates.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Link href="/teacher/reports" className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-white/10 rounded-2xl text-xs font-black text-white hover:bg-indigo-600 transition-all group">
                            Analytics Hub <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Main Content: Recent Activity & Class Control */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <History size={20} />
                                </div>
                                Recent Roll-Call Marks
                            </h3>
                            <Link href="/teacher/reports" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 tracking-tight">Full Archive</Link>
                        </div>

                        <div className="space-y-4">
                            {recentMarks.length > 0 ? recentMarks.map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                            log.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                                                log.status === 'absent' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                        )}>
                                            <Activity size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{log.studentName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{log.sectionName} • {log.date}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                        log.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                            log.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                    )}>{log.status}</span>
                                </div>
                            )) : (
                                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No recent marks found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <Users size={20} />
                                </div>
                                Active Class Roster
                            </h3>
                            <Link href="/teacher/attendance" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 tracking-tight">Record New Session</Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {assignedClasses.map((cls, i) => (
                                <Link
                                    key={i}
                                    href={`/teacher/attendance/${cls.sectionId}?subject=${encodeURIComponent(cls.subject || '')}`}
                                    className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all group relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">{cls.subject}</p>
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-lg font-black tracking-tight">{cls.sectionName}</h4>
                                            <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <MapPin size={40} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
