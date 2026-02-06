import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';

import { attendance, sections } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
    CheckCircle2,
    XCircle,
    Clock,
    LayoutGrid,
    ArrowRight,
    Search,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

async function getSummary() {
    const data = await db.select({
        sectionId: sections.id,
        sectionName: sections.name,
        studentCount: sql<number>`(SELECT COUNT(*) FROM students WHERE section_id = ${sections.id})`,
        present: sql<number>`CAST(count(case when ${attendance.status} = 'present' then 1 end) AS INTEGER)`,
        absent: sql<number>`CAST(count(case when ${attendance.status} = 'absent' then 1 end) AS INTEGER)`,
        late: sql<number>`CAST(count(case when ${attendance.status} = 'late' then 1 end) AS INTEGER)`,
    })
        .from(sections)
        .leftJoin(attendance, eq(attendance.sectionId, sections.id))
        .groupBy(sections.id, sections.name);

    return data;
}

export default async function AdminAttendancePage() {
    const summary = await getSummary();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Intelligence</h1>
                    <p className="text-slate-500 mt-1">Consolidated summary of presence across all academic sections.</p>
                </div>
                <div className="flex gap-4">
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 shadow-sm transition-all active:scale-95">
                        <Filter size={20} />
                    </button>
                    <Link 
                        href="/admin/attendance/sessions"
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 font-bold text-sm"
                    >
                        <Clock size={18} />
                        Session History
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {summary.length > 0 ? summary.map((s, i) => {
                    const total = Number(s.present) + Number(s.absent) + Number(s.late);
                    const rate = total > 0 ? (Number(s.present) / total) * 100 : 0;

                    return (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-500">
                                <LayoutGrid size={80} strokeWidth={1} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <div className="text-xl font-black">{s.sectionName?.substring(0, 2) || '??'}</div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Log</p>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter mt-1">{s.sectionName || 'N/A'}</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Present</p>
                                        <p className="text-lg font-black text-emerald-700 mt-1">{s.present}</p>
                                    </div>
                                    <div className="text-center p-3 bg-rose-50 rounded-2xl border border-rose-100/50">
                                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Absent</p>
                                        <p className="text-lg font-black text-rose-700 mt-1">{s.absent}</p>
                                    </div>
                                    <div className="text-center p-3 bg-amber-50 rounded-2xl border border-amber-100/50">
                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Late</p>
                                        <p className="text-lg font-black text-amber-700 mt-1">{s.late}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-8">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Efficiency Rate</span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1">{s.studentCount || 0} Total Students</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">{rate.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        {total > 0 ? (
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    rate > 80 ? "bg-emerald-500" : rate > 50 ? "bg-amber-500" : "bg-rose-500"
                                                )}
                                                style={{ width: `${rate}%` }}
                                            />
                                        ) : (
                                            <div className="h-full bg-slate-200 w-full opacity-20" />
                                        )}
                                    </div>
                                    {total === 0 && (
                                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest text-center mt-2 animate-pulse">
                                            Awaiting initial records
                                        </p>
                                    )}
                                </div>

                                <Link
                                    href={`/admin/reports?sectionId=${s.sectionId}`}
                                    className="flex items-center justify-between w-full bg-slate-900 text-white p-5 rounded-2xl hover:bg-indigo-600 transition-all group-hover:shadow-xl group-hover:shadow-indigo-100"
                                >
                                    <span className="flex items-center gap-3 font-bold text-sm">
                                        <ArrowUpRight size={18} />
                                        View Details
                                    </span>
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-200">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                            <Search size={64} strokeWidth={1} />
                            <p className="text-sm font-bold uppercase tracking-widest">No attendance summaries generated yet.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
