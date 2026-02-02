'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Hash, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RosterPage() {
    const params = useParams();
    const router = useRouter();
    const sectionId = params.sectionId as string;

    const [section, setSection] = useState<any>(null);
    const [roster, setRoster] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [subjectStats, setSubjectStats] = useState<Record<string, any[]>>({});

    useEffect(() => {
        fetchData();
    }, [sectionId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch section details
            const sectionsRes = await fetch('/api/admin/sections');
            const sectionsData = await sectionsRes.json();
            const currentSection = Array.isArray(sectionsData)
                ? sectionsData.find((s: any) => s.id === sectionId)
                : null;
            setSection(currentSection);

            // Fetch roster
            const rosterRes = await fetch(`/api/admin/students?sectionId=${sectionId}`);
            const rosterData = await rosterRes.json();
            setRoster(Array.isArray(rosterData) ? rosterData : []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setRoster([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleStudentExpand = async (studentId: string) => {
        if (expandedStudent === studentId) {
            setExpandedStudent(null);
        } else {
            setExpandedStudent(studentId);
            if (!subjectStats[studentId]) {
                try {
                    const res = await fetch(`/api/admin/students/${studentId}/subject-stats`);
                    const data = await res.json();
                    setSubjectStats(prev => ({ ...prev, [studentId]: data }));
                } catch (err) {
                    console.error('Failed to fetch subject stats:', err);
                }
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex w-full items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/sections')}
                        className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 shrink-0"
                        title="Back to Sections"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                                <LayoutGrid size={24} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight truncate">
                                    {loading ? 'Loading...' : section?.name || 'Student Roster'}
                                </h1>
                                <p className="text-slate-500 mt-1 truncate">Complete student roster for this section.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-0 md:p-8">
                    <div className="border-0 md:border md:border-slate-100 md:rounded-2xl overflow-hidden bg-white md:bg-slate-50/30">
                        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                                    <tr>
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">USN</th>
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Name</th>
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Email</th>
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Attendance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Loading roster...</p>
                                            </td>
                                        </tr>
                                    ) : roster.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <p className="text-sm font-bold text-slate-400">No students enrolled in this section.</p>
                                            </td>
                                        </tr>
                                    ) : roster.map((student: any) => (
                                        <React.Fragment key={student.id}>
                                            <tr className="bg-white hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-6 py-3 text-xs font-black text-indigo-600">{student.usn}</td>
                                                <td className="px-6 py-3 text-xs font-bold text-slate-900">{student.name}</td>
                                                <td className="px-6 py-3 text-xs text-slate-500">{student.email}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className={cn(
                                                                "px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter",
                                                                student.attendancePercentage === null ? "bg-slate-50 text-slate-400" :
                                                                    student.attendancePercentage < 75 ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                                        student.attendancePercentage < 85 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                                            "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                            )}>
                                                                {student.attendancePercentage !== null ? `${student.attendancePercentage}%` : 'N/A'}
                                                            </div>
                                                            {student.attendancePercentage !== null && (
                                                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full transition-all duration-500",
                                                                            student.attendancePercentage < 75 ? "bg-rose-500" : student.attendancePercentage < 85 ? "bg-amber-500" : "bg-emerald-500"
                                                                        )}
                                                                        style={{ width: `${student.attendancePercentage}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => toggleStudentExpand(student.id)}
                                                            className="text-indigo-600 hover:text-indigo-700 text-[9px] font-black uppercase tracking-widest underline underline-offset-2"
                                                        >
                                                            {expandedStudent === student.id ? 'Hide' : 'By Subject'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedStudent === student.id && (
                                                <tr className="bg-indigo-50/30">
                                                    <td colSpan={4} className="px-6 py-4">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject-wise Breakdown</div>
                                                        {subjectStats[student.id] && subjectStats[student.id].length > 0 ? (
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                {subjectStats[student.id].map((stat: any) => (
                                                                    <div key={stat.id} className="bg-white p-3 rounded-xl border border-slate-100">
                                                                        <div className="text-[9px] font-black text-purple-600 uppercase tracking-tight mb-1">{stat.subject}</div>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={cn(
                                                                                "px-2 py-0.5 rounded-full text-[8px] font-black",
                                                                                stat.percentage < 75 ? "bg-rose-50 text-rose-600" :
                                                                                    stat.percentage < 85 ? "bg-amber-50 text-amber-600" :
                                                                                        "bg-emerald-50 text-emerald-600"
                                                                            )}>
                                                                                {stat.percentage}%
                                                                            </div>
                                                                            <div className="text-[8px] text-slate-400">
                                                                                {stat.presentCount}P / {stat.lateCount}L / {stat.absentCount}A
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[9px] text-slate-400 italic">Loading subject data...</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
