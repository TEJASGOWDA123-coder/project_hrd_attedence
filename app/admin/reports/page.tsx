'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Search, Loader2, Calendar as CalIcon, Landmark, User, ShieldCheck } from 'lucide-react';
import { cn, formatLocalTime } from '@/lib/utils';

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ sectionId: '', startDate: '', endDate: '', subject: '' });

    const fetchSections = async () => {
        const res = await fetch('/api/admin/sections');
        const data = await res.json();
        setSections(data);
    };

    const fetchReports = async () => {
        setLoading(true);
        // Build query params, excluding empty values
        const params = new URLSearchParams();
        if (filter.sectionId) params.append('sectionId', filter.sectionId);
        if (filter.startDate) params.append('startDate', filter.startDate);
        if (filter.endDate) params.append('endDate', filter.endDate);
        if (filter.subject) params.append('subject', filter.subject);

        const res = await fetch(`/api/admin/reports?${params.toString()}`);
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchSections();
    }, []);

    const handleDownload = () => {
        if (reports.length === 0) return;

        const headers = ["Student Name", "Section", "Subject", "Date", "Status", "Overall Attendance %"];
        const csvContent = [
            headers.join(","),
            ...reports.map(r => [
                `"${r.studentName}"`,
                `"${r.sectionName}"`,
                `"${r.subject || 'N/A'}"`,
                `"${r.date} ${formatLocalTime(r.createdAt)}"`,
                `"${r.status}"`,
                `"${r.attendancePercentage ?? '0'}%"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_report_${filter.startDate || 'start'}_to_${filter.endDate || 'end'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit & Reports</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-slate-500">Detailed attendance logs and academic analysis.</p>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">3 Late = 1 Absent</span>
                    </div>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={reports.length === 0}
                    className="w-full md:w-auto bg-white text-slate-900 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 border border-slate-200 shadow-sm transition-all active:scale-95 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} /> Export Intelligence
                </button>
            </header>


            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row flex-wrap gap-4 md:gap-8 items-end">
                <div className="w-full md:flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Section</label>
                    <div className="relative">
                        <select
                            className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                            value={filter.sectionId}
                            onChange={(e) => setFilter({ ...filter, sectionId: e.target.value })}
                        >
                            <option value="">Consolidated (All)</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="w-full md:flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                        value={filter.startDate}
                        onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                    />
                </div>
                <div className="w-full md:flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                    <input
                        type="date"
                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                        value={filter.endDate}
                        onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                    />
                </div>
                <div className="w-full md:flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Subject Filter</label>
                    <input
                        type="text"
                        placeholder="e.g., Mathematics"
                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                        value={filter.subject}
                        onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
                    />
                </div>
                <button
                    onClick={fetchReports}
                    className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group h-[58px]"
                >
                    <Filter size={18} className="group-hover:rotate-12 transition-transform" />
                    Generate Report
                </button>
            </div>

            {/* Admin Intelligence Summary */}
            {!loading && reports.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-in zoom-in-95 duration-500">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Trail Size</p>
                        <p className="text-2xl font-black text-slate-900">{reports.length}</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 border-l-4 border-l-emerald-500">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Present Count</p>
                        <p className="text-2xl font-black text-emerald-700">{reports.filter(r => r.status === 'present').length}</p>
                    </div>
                    <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 border-l-4 border-l-rose-500">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Absentee Count</p>
                        <p className="text-2xl font-black text-rose-700">{reports.filter(r => r.status === 'absent').length}</p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 border-l-4 border-l-amber-500">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Late Arrivals</p>
                        <p className="text-2xl font-black text-amber-700">{reports.filter(r => r.status === 'late').length}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Profile</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Performance</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Compiling Attendance Data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <ShieldCheck size={48} strokeWidth={1} />
                                            <p className="text-sm font-bold uppercase tracking-widest">No matching logs found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : reports.map((report) => (
                                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:border-indigo-300 transition-colors overflow-hidden">
                                                <img src={`https://ui-avatars.com/api/?name=${report.studentName}&background=f1f5f9&color=6366f1`} alt="" />
                                            </div>
                                            <p className="text-sm font-black text-slate-900">{report.studentName}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 py-1 px-3 bg-indigo-50 rounded-lg w-fit border border-indigo-100 text-indigo-700">
                                            <Landmark size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">{report.sectionName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 py-1 px-3 bg-purple-50 rounded-lg w-fit border border-purple-100 text-purple-700">
                                            <span className="text-[10px] font-black uppercase tracking-tight">{report.subject || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter",
                                                (report.attendancePercentage ?? 0) < 75 ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                    (report.attendancePercentage ?? 0) < 85 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                        "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                            )}>
                                                {report.attendancePercentage ?? 0}%
                                            </div>
                                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all duration-500",
                                                        (report.attendancePercentage ?? 0) < 75 ? "bg-rose-500" : (report.attendancePercentage ?? 0) < 85 ? "bg-amber-500" : "bg-emerald-500"
                                                    )}
                                                    style={{ width: `${report.attendancePercentage ?? 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <CalIcon size={14} />
                                            <span className="text-xs font-medium">{report.date} • {formatLocalTime(report.createdAt)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            report.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                report.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                        )}>
                                            {report.status}
                                        </span>
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
