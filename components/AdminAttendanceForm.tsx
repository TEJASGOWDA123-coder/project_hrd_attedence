'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, Save, User, Mail, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminAttendanceForm({
    students,
    sectionId,
    subject,
    timetableId,
    date,
    initialAttendance,
    teacherId
}: {
    students: any[],
    sectionId: string,
    subject: string,
    timetableId: string,
    date: string,
    initialAttendance: Record<string, 'present' | 'absent' | 'late'>,
    teacherId: string
}) {
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>(initialAttendance);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/attendance/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sectionId,
                    timetableId,
                    date,
                    records: attendance,
                    subject,
                    teacherId
                }),
            });

            if (res.ok) {
                router.push('/admin/attendance/sessions');
            } else {
                const data = await res.json();
                alert(data.error || 'Correction failed. Please try again.');
            }
        } catch (err) {
            alert('Operation failed due to network issues.');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.usn && student.usn.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-rose-100/30 border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Session Ledger Overwrite</h3>
                            <p className="text-rose-500 text-xs font-bold uppercase tracking-widest mt-1">
                                High-Priority Adjustment Mode
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-rose-50 rounded-xl border border-rose-100 shadow-sm text-[10px] font-black text-rose-600 uppercase tracking-widest">
                            {students.length} Students in Roster
                        </div>
                    </div>
                
                    <div className="relative max-w-md">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input
                            type="text" 
                            placeholder="Find student by name or ID..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Administrative Toggle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map((student) => {
                                const currentStatus = attendance[student.id];
                                return (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                    <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random&color=fff`} alt="" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-tight">{student.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                                                        <span className="text-xs font-black uppercase tracking-tighter">{student.usn}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex justify-center gap-4">
                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'present')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2 w-20 active:scale-95",
                                                        currentStatus === 'present'
                                                            ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-100"
                                                            : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                                    )}
                                                >
                                                    <Check size={22} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase tracking-tight">Present</span>
                                                </button>

                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'late')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2 w-20 active:scale-95",
                                                        currentStatus === 'late'
                                                            ? "bg-amber-50 border-amber-500 text-amber-600 shadow-lg shadow-amber-100"
                                                            : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                                    )}
                                                >
                                                    <Clock size={22} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase tracking-tight">Late</span>
                                                </button>

                                                <button
                                                    onClick={() => handleStatusChange(student.id, 'absent')}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2 w-20 active:scale-95",
                                                        currentStatus === 'absent'
                                                            ? "bg-rose-50 border-rose-500 text-rose-600 shadow-lg shadow-rose-100"
                                                            : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                                    )}
                                                >
                                                    <X size={22} strokeWidth={3} />
                                                    <span className="text-[9px] font-black uppercase tracking-tight">Absent</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                <div className="flex items-center gap-4 text-slate-400">
                    <ShieldAlert size={24} className="text-rose-500" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest leading-none text-slate-900 border-b border-rose-200 pb-1 mb-1 italic">Authorized Override Only</p>
                        <p className="text-[10px] font-bold uppercase tracking-tight">Changes will be logged in the system audit trail.</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-rose-100 hover:bg-rose-700 hover:shadow-rose-200 transition-all flex items-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Committing Changes...
                        </>
                    ) : (
                        <>
                            Commit Administrative Overrides
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
