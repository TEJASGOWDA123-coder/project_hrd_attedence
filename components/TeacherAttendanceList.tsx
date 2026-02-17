'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ArrowRight, Landmark, Users, CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassData {
    timetableId: string;
    sectionId: string;
    sectionName: string | null;
    subject: string | null;
    time?: string;
    endTime?: string;
    status: 'completed' | 'pending' | 'draft';
}

export default function TeacherAttendanceList({ assignedClasses }: { assignedClasses: ClassData[] }) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'draft'>('all');

    const filteredClasses = assignedClasses.filter(cls => {
        const matchesSearch = 
            (cls.subject?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            (cls.sectionName?.toLowerCase().includes(search.toLowerCase()) ?? false);
        
        const matchesStatus = filterStatus === 'all' 
            ? true 
            : cls.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                 <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Class or Subject..."
                        className="pl-12 pr-4 py-3 w-full bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
                    {(['all', 'pending', 'draft', 'completed'] as const).map((tab) => (
                         <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            className={cn(
                                "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                filterStatus === tab 
                                    ? "bg-white text-indigo-600 shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab === 'all' ? 'Show All' : tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredClasses.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-200">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                            <Search size={64} strokeWidth={1} />
                            <p className="text-sm font-bold uppercase tracking-widest">No classes match your filters.</p>
                        </div>
                    </div>
                ) : filteredClasses.map((cls, idx) => {
                    const isCompleted = cls.status === 'completed';
                    const isDraft = cls.status === 'draft';

                    return (
                        <div key={`${cls.sectionId}-${cls.subject}-${idx}`} className="group relative animate-in fade-in zoom-in-95 duration-500">
                            <div className={cn(
                                "bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border shadow-sm transition-all",
                                isCompleted 
                                    ? "border-emerald-200 bg-emerald-50/30 opacity-80" 
                                    : isDraft
                                        ? "border-amber-200 bg-amber-50/20"
                                        : "border-slate-200 hover:shadow-2xl hover:shadow-purple-100 hover:-translate-y-1"
                            )}>
                                <div className="flex justify-between items-start mb-8">
                                    <div className={cn(
                                        "p-4 rounded-2xl transition-colors duration-300",
                                        isCompleted ? "bg-emerald-100 text-emerald-600" : 
                                        isDraft ? "bg-amber-100 text-amber-600" :
                                        "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                                    )}>
                                        {isCompleted ? <CheckCircle2 size={24} /> : <Landmark size={24} />}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section ID</p>
                                        <p className="text-xs font-bold text-slate-900 mt-1 uppercase tracking-tighter">{cls.sectionId?.substring(0, 8)}</p>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{cls.subject || 'No Subject'} • {cls.time}</p>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{cls.sectionName || 'Unknown Section'}</h3>
                                </div>
                                <p className="text-sm text-slate-400 font-medium mb-8">
                                    {isCompleted ? "Attendance already recorded for today." : 
                                     isDraft ? "Attendance is in draft - click to finalize." :
                                     "Ready for today's roll call session."}
                                </p>

                                <Link
                                    href={`/teacher/attendance/${cls.sectionId}?subject=${encodeURIComponent(cls.subject || '')}&timetableId=${cls.timetableId}&endTime=${cls.endTime || ''}`}
                                    className={cn(
                                        "flex items-center justify-between w-full p-5 rounded-2xl transition-all",
                                        isCompleted
                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                            : isDraft
                                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                                : "bg-slate-900 text-white hover:bg-purple-600 group-hover:shadow-xl group-hover:shadow-purple-200"
                                    )}
                                >
                                    <span className="flex items-center gap-3 font-bold text-sm">
                                        {isCompleted ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                Session Recorded - Edit Now
                                            </>
                                        ) : isDraft ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                Attendance in Draft - Finalize
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                Start Attendance Session
                                            </>
                                        )}
                                    </span>
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
