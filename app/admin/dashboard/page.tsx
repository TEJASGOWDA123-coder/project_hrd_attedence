import { db } from '@/lib/db';
import { teachers, students, sections, attendance } from '@/lib/db/schema';
import { count, sql, desc, eq, and, gte } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import {
    Users,
    UserSquare2,
    LayoutGrid,
    TrendingUp,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    FileText,
    Activity,
    ShieldCheck,
    AlertTriangle,
    ArrowRight,
    History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

async function getStats() {
    const [teacherCount] = await db.select({ value: count() }).from(teachers);
    const [studentCount] = await db.select({ value: count() }).from(students);
    const [sectionCount] = await db.select({ value: count() }).from(sections);

    // Total attendance counts
    const attendStats = await db.select({
        status: attendance.status,
        count: sql<number>`count(*)`.mapWith(Number),
    }).from(attendance).groupBy(attendance.status);

    const total = attendStats.reduce((acc, curr) => acc + curr.count, 0);
    const present = attendStats.find(s => s.status === 'present')?.count || 0;
    const absent = attendStats.find(s => s.status === 'absent')?.count || 0;
    const late = attendStats.find(s => s.status === 'late')?.count || 0;

    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
    const consistency = total > 0 ? (((present + late) / total) * 100).toFixed(1) : '0.0';

    // Recent Activity (Last 5 Logs)
    const recentLogs = await db.select({
        id: attendance.id,
        status: attendance.status,
        createdAt: attendance.createdAt,
        studentName: students.name,
        sectionName: sections.name,
    })
        .from(attendance)
        .leftJoin(students, eq(attendance.studentId, students.id))
        .leftJoin(sections, eq(attendance.sectionId, sections.id))
        .orderBy(desc(attendance.createdAt))
        .limit(5);

    // Trend Data (Last 7 Recorded Days)
    const dailyTrends = await db.select({
        date: attendance.date,
        total: count(),
        present: sql<number>`count(case when ${attendance.status} = 'present' then 1 end)`.mapWith(Number),
    })
        .from(attendance)
        .groupBy(attendance.date)
        .orderBy(desc(attendance.date))
        .limit(7);

    // Peek Load Day
    const peekDayRaw = await db.select({
        day: sql<string>`strftime('%w', ${attendance.date})`,
        count: count(),
    })
        .from(attendance)
        .groupBy(sql`strftime('%w', ${attendance.date})`)
        .orderBy(desc(count()))
        .limit(1);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peekDayName = peekDayRaw[0] ? days[parseInt(peekDayRaw[0].day)] : 'N/A';

    return {
        teachers: teacherCount.value,
        students: studentCount.value,
        sections: sectionCount.value,
        attendance: rate + '%',
        consistency: consistency + '%',
        present,
        absent,
        late,
        recentLogs,
        dailyTrends: dailyTrends.reverse(),
        peekDayName,
        peakLoadCount: Math.max(0, ...dailyTrends.map(t => t.total))
    };
}

export default async function AdminDashboard() {
    const session = await getSession();
    const stats = await getStats();

    const statsCards = [
        { label: 'Total Students', value: stats.students.toLocaleString(), trend: 'Live Data', icon: Users, color: 'indigo' },
        { label: 'Total Teachers', value: stats.teachers.toLocaleString(), trend: 'Active', icon: UserSquare2, color: 'blue' },
        { label: 'Avg Attendance', value: stats.attendance, trend: 'Past Month', icon: CheckCircle2, color: 'emerald' },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {session?.user?.name || 'Admin'}</h1>
                    <p className="text-slate-500 mt-1">Institutional metrics and administrative control center.</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                        <ShieldCheck size={14} /> System Secure
                    </div>
                </div>
            </header>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-100/30 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "p-4 rounded-2xl",
                                    card.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                                        card.color === 'blue' ? "bg-blue-50 text-blue-600" :
                                            "bg-emerald-50 text-emerald-600"
                                )}>
                                    <Icon size={24} />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{card.trend}</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                                <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Attendance Intelligence Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <TrendingUp size={200} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Real-time Summary</p>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-bold text-slate-300">Total Present Marks</p>
                                    <p className="text-3xl font-black mt-1 text-emerald-400">{stats.present}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absentees</p>
                                        <p className="text-xl font-black text-rose-400">{stats.absent}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lates</p>
                                        <p className="text-xl font-black text-amber-400">{stats.late}</p>
                                    </div>
                                </div>
                                <Link href="/admin/reports" className="flex items-center justify-between w-full bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all group">
                                    <span className="text-xs font-bold">Deep Audit</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between group cursor-pointer hover:bg-indigo-700 transition">
                        <div>
                            <AlertTriangle size={32} className="mb-4 text-indigo-300" />
                            <h4 className="text-xl font-black leading-tight">Institutional Performance Audit</h4>
                        </div>
                        <p className="text-xs font-bold text-indigo-200 mt-4 flex items-center gap-2">
                            Check performance <ArrowRight size={14} />
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Institutional Trends</h3>
                            <p className="text-sm text-slate-400 font-medium mt-1">Attendance velocity over the last 7 active reporting days.</p>
                        </div>
                    </div>

                    <div className="h-64 relative bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex items-end justify-center p-8 gap-4 overflow-hidden">
                        {stats.dailyTrends.length > 0 ? stats.dailyTrends.map((t, i) => {
                            const height = (t.present / (t.total || 1)) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="w-full relative flex items-end justify-center group">
                                        <div
                                            className="w-full max-w-[40px] bg-indigo-500 rounded-t-xl transition-all duration-1000 group-hover:bg-indigo-600 shadow-lg shadow-indigo-100"
                                            style={{ height: `${Math.max(10, height)}%` }}
                                        />
                                        <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {height.toFixed(0)}%
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.date.split('-').slice(1).join('/')}</span>
                                </div>
                            );
                        }) : (
                            <div className="self-center text-center">
                                <Activity size={48} className="mx-auto text-slate-300 mb-4 animate-pulse" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accumulating institutional data logs...</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-10">
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Peak Load</p>
                            <p className="text-lg font-black text-indigo-900 mt-1">{stats.peakLoadCount} Logs</p>
                        </div>
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Consistency</p>
                            <p className="text-lg font-black text-emerald-900 mt-1">{stats.consistency}</p>
                        </div>
                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Core Peak</p>
                            <p className="text-lg font-black text-amber-900 mt-1">{stats.peekDayName}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 text-white rounded-xl">
                                <History size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">System Logs</h3>
                        </div>
                        <Link href="/admin/reports" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 font-sans">View Full Archive</Link>
                    </div>
                    <div className="space-y-6">
                        {stats.recentLogs.length > 0 ? stats.recentLogs.map((log, i) => {
                            return (
                                <div key={i} className="flex gap-4 group">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110",
                                        log.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                                            log.status === 'absent' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                    )}>
                                        <Activity size={20} />
                                    </div>
                                    <div className="flex-1 border-b border-slate-50 pb-4 last:border-none">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-black text-slate-900">{log.studentName}</p>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{log.createdAt?.split(' ')[1] || 'Today'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                                {log.sectionName} • marked as <span className={cn(
                                                    "font-bold",
                                                    log.status === 'present' ? 'text-emerald-500' :
                                                        log.status === 'absent' ? 'text-rose-500' : 'text-amber-500'
                                                )}>{log.status}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-10">
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No activity reported yet</p>
                                <p className="text-[10px] text-slate-200 mt-1 italic">Real-time logs will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 flex flex-col justify-center text-center group">
                    <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <LayoutGrid size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Rapid Section Access</h3>
                    <p className="text-slate-400 text-sm font-medium mt-2 max-w-sm mx-auto mb-10 leading-relaxed">Directly manage any class section roster, their respective attendance performance metrics, and detailed audit trails.</p>
                    <Link href="/admin/sections" className="inline-flex items-center justify-center px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1">
                        Manage Institutions
                    </Link>
                </div>
            </div>
        </div>
    );
}
