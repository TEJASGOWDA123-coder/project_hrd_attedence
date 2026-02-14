'use client';

import { useState, useEffect } from 'react';
import { 
    History, 
    Search, 
    Filter, 
    Calendar as CalIcon, 
    User, 
    Landmark, 
    ArrowRight,
    Loader2,
    ShieldCheck,
    FileText
} from 'lucide-react';
import { cn, formatLocalTime } from '@/lib/utils';
import Link from 'next/link';

export default function AdminAttendanceSessionsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ sectionId: '', startDate: '', endDate: '' });

    const fetchData = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.sectionId) params.append('sectionId', filter.sectionId);
        if (filter.startDate) params.append('startDate', filter.startDate);
        if (filter.endDate) params.append('endDate', filter.endDate);

        try {
            const [sessionsRes, sectionsRes] = await Promise.all([
                fetch(`/api/admin/attendance/sessions?${params.toString()}`),
                fetch('/api/admin/sections')
            ]);
            
            setSessions(await sessionsRes.json());
            setSections(await sectionsRes.json());
        } catch (err) {
            console.error('Failed to fetch sessions data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <History size={24} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Audit & Oversight</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance Session History</h1>
                    <p className="text-slate-500 mt-1">Review and manage specific attendance sessions recorded by teachers.</p>
                </div>
                <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
                    <button onClick={fetchData} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                        Refresh Ledger
                    </button>
                </div>
            </header>

            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Section</label>
                    <select
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                        value={filter.sectionId}
                        onChange={(e) => setFilter({ ...filter, sectionId: e.target.value })}
                    >
                        <option value="">All Sections</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">From Date</label>
                    <input
                        type="date"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                        value={filter.startDate}
                        onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">To Date</label>
                    <input
                        type="date"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                        value={filter.endDate}
                        onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                    />
                </div>
                <button
                    onClick={fetchData}
                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    <Filter size={18} />
                    Apply Filters
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher / Subject</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Stats</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Scanning Session Records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <ShieldCheck size={48} strokeWidth={1} />
                                            <p className="text-sm font-bold uppercase tracking-widest">No sessions found for the selected criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : sessions.map((s, idx) => (
                                <tr key={`${s.timetableId}-${s.date}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                                                <span className="text-[10px] font-black leading-none uppercase">{new Date(s.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                <span className="text-xl font-black leading-none">{new Date(s.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Landmark size={14} className="text-slate-400" />
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">{s.sectionName}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.date}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400" />
                                                <span className="text-sm font-bold text-slate-900">{s.teacherName}</span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-500">{s.subject}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Present</p>
                                                <p className="text-sm font-black text-slate-900">{s.presentCount}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Absent</p>
                                                <p className="text-sm font-black text-slate-900">{s.absentCount}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Late</p>
                                                <p className="text-sm font-black text-slate-900">{s.lateCount}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {s.isDraft ? (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest">Draft</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">Finalized</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Link
                                            href={`/admin/attendance/sessions/${s.timetableId || 'null'}?date=${s.date}&sectionId=${s.sectionId}&subject=${encodeURIComponent(s.subject)}&teacherId=${s.teacherId}`}
                                            className="inline-flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-700 transition-colors group/link"
                                        >
                                            Review Ledger
                                            <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
