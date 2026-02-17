'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, Save, User, Mail, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AttendanceForm({
    students,
    sectionId,
    subject,
    timetableId,
    sectionName,
    endTime,
    initialAttendance
}: {
    students: any[],
    sectionId: string,
    subject: string,
    timetableId?: string,
    sectionName: string,
    endTime?: string,
    initialAttendance?: Record<string, 'present' | 'absent' | 'late'>
}) {
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>(() => {
        if (initialAttendance && Object.keys(initialAttendance).length > 0) return initialAttendance;
        return students.reduce((acc, s) => ({ ...acc, [s.id]: 'present' }), {});
    });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async (isDraft: boolean = false) => {
        setLoading(true);
        try {
            const res = await fetch('/api/teacher/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionId,
                    timetableId,
                    records: attendance,
                    subject,
                    isDraft,
                }),
            });

            if (res.ok) {
                if (isDraft) {
                    // silent success for auto-submit
                    if (!isDraft) router.push('/teacher/attendance');
                } else {
                    router.push('/teacher/attendance');
                }
            } else {
                const data = await res.json();
                if (!isDraft) alert(data.error || 'Verification failed. Please try again.');
            }
        } catch (err) {
            if (!isDraft) alert('System connectivity issue.');
        } finally {
            setLoading(false);
        }
    };

    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isEndingSoon, setIsEndingSoon] = useState(false);

    // Live Countdown Timer Logic
    useEffect(() => {
        if (!endTime) return;

        const [endH, endM] = endTime.split(':').map(Number);
        
        const updateTimer = () => {
            const now = new Date();
            const target = new Date();
            target.setHours(endH, endM, 0, 0);

            const diff = target.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeLeft('00:00');
                setIsEndingSoon(true);
                return;
            }

            const minutes = Math.floor(diff / 1000 / 60);
            const seconds = Math.floor((diff / 1000) % 60);
            
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            
            // Highlight when less than 5 minutes left
            if (minutes < 5) {
                setIsEndingSoon(true);
            } else {
                setIsEndingSoon(false);
            }

            // Client-side auto-submit fail-safe (exact end time)
            if (minutes === 0 && seconds === 0) {
                 handleSubmit(false);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    // Cleanup redundant effect but keep consistency with requested features
    useEffect(() => {
        if (!endTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const [endH, endM] = endTime.split(':').map(Number);
            const endTimeDate = new Date();
            endTimeDate.setHours(endH, endM, 0, 0);

            const diffMinutes = (endTimeDate.getTime() - now.getTime()) / 1000 / 60;

            // Auto-submit 5 minutes before ending (now shifted to cron, kept for UI reactivity)
            if (diffMinutes > 0 && diffMinutes <= 0.1) { // Wait for exact end to avoid race with cron
                // handleSubmit(false); // Let cron handle it for consistency
            }
        }, 60000);

        return () => clearInterval(timer);
    }, [endTime, attendance]);

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.usn && student.usn.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-purple-100/50 border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Attendance Session</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                Topic: <span className="text-indigo-600">{subject}</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Total Roster: {students.length}
                            </div>
                            {timeLeft && (
                                <div className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right duration-500",
                                    isEndingSoon 
                                        ? "bg-rose-50 border-rose-100 text-rose-600 shadow-lg shadow-rose-100" 
                                        : "bg-indigo-50 border-indigo-100 text-indigo-600"
                                )}>
                                    <Clock size={12} className={cn(isEndingSoon && "animate-spin")} />
                                    Time Left: {timeLeft}
                                </div>
                            )}
                        </div>
                    </div>
                
                    <div className="relative max-w-md">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input
                            type="text" 
                            placeholder="Find student by name or ID..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-4 md:px-10 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                                <th className="px-4 md:px-10 py-4 md:py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Live Status Toggle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-10 py-8 text-center text-slate-400 font-bold text-sm">No students found matching your search.</td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => {

                                const currentStatus = attendance[student.id];
                                return (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 md:px-10 py-4 md:py-6">
                                            <div className="flex items-center gap-3 md:gap-5">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100 shrink-0">
                                                    <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random&color=fff`} alt="" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs md:text-sm font-black text-slate-900 leading-tight truncate">{student.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-tighter">{student.usn}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-10 py-4 md:py-6">
                                            <div className="flex justify-center gap-2 md:gap-4">
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'present')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-2xl transition-all border-2 w-16 md:w-20 active:scale-95 shrink-0",
                                                        currentStatus === 'present'
                                                            ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-100"
                                                            : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                                    )}
                                                >
                                                    <Check className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" strokeWidth={3} />
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tight">Present</span>
                                                </button>

                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'late')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-2xl transition-all border-2 w-16 md:w-20 active:scale-95 shrink-0",
                                                        currentStatus === 'late'
                                                            ? "bg-amber-50 border-amber-500 text-amber-600 shadow-lg shadow-amber-100"
                                                            : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                                    )}
                                                >
                                                    <Clock className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" strokeWidth={3} />
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tight">Late</span>
                                                </button>

                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'absent')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-2xl transition-all border-2 w-16 md:w-20 active:scale-95 shrink-0",
                                                        currentStatus === 'absent'
                                                            ? "bg-rose-50 border-rose-500 text-rose-600 shadow-lg shadow-rose-100"
                                                            : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                                    )}
                                                >
                                                    <X className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" strokeWidth={3} />
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tight">Absent</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} />
                        Save Progress
                    </button>
                    <div className="flex items-center gap-4 text-slate-400 ml-4 hidden lg:flex">
                        <ShieldAlert size={20} className={cn(isEndingSoon ? "text-rose-500" : "text-slate-400")} />
                        <p className={cn(
                            "text-xs font-bold uppercase tracking-widest leading-none",
                            isEndingSoon ? "text-rose-600" : "text-slate-400"
                        )}>
                            {isEndingSoon 
                                ? "Submitting soon... check for reminder email" 
                                : `Auto-finalizes ${endTime ? `at ${endTime}` : 'at session end'}`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    className="w-full md:w-auto bg-purple-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-100 hover:bg-purple-700 hover:shadow-purple-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Processing...
                        </>
                    ) : (
                        <>
                            Finalize Session
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
