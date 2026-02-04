'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, Save, User, Mail, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AttendanceForm({
    students,
    sectionId,
    subject
}: {
    students: any[],
    sectionId: string,
    subject: string
}) {
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>(
        students.reduce((acc, s) => ({ ...acc, [s.id]: 'present' }), {})
    );
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/teacher/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionId,
                    records: attendance,
                    subject // Include the subject in the payload
                }),
            });

            if (res.ok) {
                router.push('/teacher/dashboard');
            } else {
                alert('Verification failed. Please try again.');
            }
        } catch (err) {
            alert('System connectivity issue.');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Total Roster: {students.length}
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
                                                        <Mail size={12} className="shrink-0" />
                                                        <span className="text-[10px] md:text-xs font-medium truncate">{student.email}</span>
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

            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                <div className="flex items-center gap-4 text-slate-400">
                    <ShieldAlert size={20} />
                    <p className="text-xs font-bold uppercase tracking-widest">Always verify student ID before finalizing</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-100 hover:bg-purple-700 hover:shadow-purple-200 transition-all flex items-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Securing Data...
                        </>
                    ) : (
                        <>
                            Submit Final Record
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
