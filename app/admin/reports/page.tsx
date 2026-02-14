'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Search, Loader2, Calendar as CalIcon, Landmark, User, ShieldCheck, Archive } from 'lucide-react';
import { cn, formatLocalTime } from '@/lib/utils';
import JSZip from 'jszip';

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ 
        sectionId: '', 
        startDate: '', 
        endDate: '', 
        startTime: '', 
        endTime: '', 
        subject: '',
        search: '',
        status: 'all',
        minAttendance: '',
        maxAttendance: '',
        batch: '',
        year: '',
        defaulterOnly: false,
        teacherId: '',
        lateCountMin: '',
        filterInfo: ''
    });

    const fetchSections = async () => {
        const res = await fetch('/api/admin/sections');
        const data = await res.json();
        setSections(data);
    };

    const fetchTeachers = async () => {
        const res = await fetch('/api/admin/teachers');
        const data = await res.json();
        setTeachers(data);
    };

    const fetchReports = async () => {
        setLoading(true);
        // Build query params, excluding empty values
        const params = new URLSearchParams();
        if (filter.sectionId) params.append('sectionId', filter.sectionId);
        if (filter.startDate) params.append('startDate', filter.startDate);
        if (filter.endDate) params.append('endDate', filter.endDate);
        if (filter.startTime) params.append('startTime', filter.startTime);
        if (filter.endTime) params.append('endTime', filter.endTime);
        if (filter.subject) params.append('subject', filter.subject);
        if (filter.search) params.append('search', filter.search);
        if (filter.status && filter.status !== 'all') params.append('status', filter.status);
        if (filter.minAttendance) params.append('minAttendance', filter.minAttendance);
        if (filter.maxAttendance) params.append('maxAttendance', filter.maxAttendance);
        if (filter.batch) params.append('batch', filter.batch);
        if (filter.year) params.append('year', filter.year);
        if (filter.defaulterOnly) params.append('defaulterOnly', 'true');
        if (filter.teacherId) params.append('teacherId', filter.teacherId);
        if (filter.lateCountMin) params.append('lateCountMin', filter.lateCountMin);
        params.append('timezoneOffset', new Date().getTimezoneOffset().toString());

        const res = await fetch(`/api/admin/reports?${params.toString()}`);
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchSections();
        fetchTeachers();
    }, []);

    const handleDownload = (type: 'flat' | 'pivot' = 'flat') => {
        if (reports.length === 0) return;

        let csvContent = "";
        let filename = `attendance_report_${type}_${filter.startDate || 'start'}_to_${filter.endDate || 'end'}.csv`;

        // Optional filter information header
        const reportHeader = filter.filterInfo ? `Report Memo: ${filter.filterInfo}\n\n` : "";

        if (type === 'flat') {
            const headers = ["Student Name", "USN", "Section", "Subject", "Batch", "Year", "Date", "Status", "Overall Attendance %"];
            csvContent = reportHeader + [
                headers.join(","),
                ...reports.map(r => [
                    `"${r.studentName}"`,
                    `"${r.usn || 'N/A'}"`,
                    `"${r.sectionName}"`,
                    `"${r.subject || 'N/A'}"`,
                    `"${r.batch || 'N/A'}"`,
                    `"${r.year || 'N/A'}"`,
                    `"${r.date} ${formatLocalTime(r.createdAt)}"`,
                    `"${r.status}"`,
                    `"${r.attendancePercentage ?? '0'}%"`
                ].join(","))
            ].join("\n");
        } else {
            // Pivot table: Rows (Student + Subject), Columns (Dates)
            const uniqueDates = Array.from(new Set(reports.map(r => r.date))).sort();
            const studentSubjects = new Map<string, any>();

            reports.forEach(r => {
                const key = `${r.usn || r.studentName}_${r.subject || 'N/A'}`;
                if (!studentSubjects.has(key)) {
                    studentSubjects.set(key, {
                        name: r.studentName,
                        usn: r.usn,
                        subject: r.subject || 'N/A',
                        section: r.sectionName,
                        batch: r.batch || 'N/A',
                        year: r.year || 'N/A',
                        percentage: r.attendancePercentage,
                        dates: {}
                    });
                }
                studentSubjects.get(key).dates[r.date] = r.status;
            });

            const headers = ["Student Name", "USN", "Section", "Subject", "Batch", "Year", ...uniqueDates, "Overall %"];
            csvContent = reportHeader + [
                headers.join(","),
                ...Array.from(studentSubjects.values()).map(s => {
                    const row = [
                        `"${s.name}"`,
                        `"${s.usn || 'N/A'}"`,
                        `"${s.section}"`,
                        `"${s.subject}"`,
                        `"${s.batch}"`,
                        `"${s.year}"`,
                        ...uniqueDates.map(d => `"${s.dates[d] || '-'}"`),
                        `"${s.percentage ?? '0'}%"`
                    ];
                    return row.join(",");
                })
            ].join("\n");
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleZipExport = async () => {
        if (reports.length === 0) return;

        const zip = new JSZip();
        const sectionsMap = new Map<string, any[]>();

        // Group by section
        reports.forEach(r => {
            const sectionName = r.sectionName || 'Unassigned';
            if (!sectionsMap.has(sectionName)) {
                sectionsMap.set(sectionName, []);
            }
            sectionsMap.get(sectionName)!.push(r);
        });

        // Generate pivot CSV for each section
        sectionsMap.forEach((sectionReports, sectionName) => {
            const uniqueDates = Array.from(new Set(sectionReports.map(r => r.date))).sort();
            const studentSubjects = new Map<string, any>();

            sectionReports.forEach(r => {
                const key = `${r.usn || r.studentName}_${r.subject || 'N/A'}`;
                if (!studentSubjects.has(key)) {
                    studentSubjects.set(key, {
                        name: r.studentName,
                        usn: r.usn,
                        subject: r.subject || 'N/A',
                        batch: r.batch || 'N/A',
                        year: r.year || 'N/A',
                        percentage: r.attendancePercentage,
                        dates: {}
                    });
                }
                studentSubjects.get(key).dates[r.date] = r.status;
            });

            const reportHeader = filter.filterInfo ? `Report Memo: ${filter.filterInfo}\nSection: ${sectionName}\n\n` : `Section: ${sectionName}\n\n`;
            const headers = ["Student Name", "USN", "Subject", "Batch", "Year", ...uniqueDates, "Overall %"];
            const csvContent = reportHeader + [
                headers.join(","),
                ...Array.from(studentSubjects.values()).map(s => {
                    const row = [
                        `"${s.name}"`,
                        `"${s.usn || 'N/A'}"`,
                        `"${s.subject}"`,
                        `"${s.batch}"`,
                        `"${s.year}"`,
                        ...uniqueDates.map(d => `"${s.dates[d] || '-'}"`),
                        `"${s.percentage ?? '0'}%"`
                    ];
                    return row.join(",");
                })
            ].join("\n");

            zip.file(`${sectionName.replace(/[^a-z0-9]/gi, '_')}_attendance.csv`, csvContent);
        });

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `attendance_sectional_reports_${new Date().toISOString().split('T')[0]}.zip`;
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
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={() => handleZipExport()}
                        disabled={reports.length === 0}
                        className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-100 transition-all active:scale-95 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Archive size={18} /> ZIP Sectional
                    </button>
                    <button
                        onClick={() => handleDownload('flat')}
                        disabled={reports.length === 0}
                        className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} /> Flat Export
                    </button>
                    <button
                        onClick={() => handleDownload('pivot')}
                        disabled={reports.length === 0}
                        className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileText size={18} /> Pivot Export
                    </button>
                </div>
            </header>


            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full items-end">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Section</label>
                        <select
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                            value={filter.sectionId}
                            onChange={(e) => setFilter({ ...filter, sectionId: e.target.value })}
                        >
                            <option value="">All Sections</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Subject Teacher</label>
                        <select
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                            value={filter.teacherId}
                            onChange={(e) => setFilter({ ...filter, teacherId: e.target.value })}
                        >
                            <option value="">All Teachers</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.startDate}
                            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.endDate}
                            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Search Student / USN</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="e.g., John Doe or 1MS21..."
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full items-end">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                        <select
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        >
                            <option value="all">All Status</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Min %</label>
                        <input
                            type="number"
                            placeholder="0"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.minAttendance}
                            onChange={(e) => setFilter({ ...filter, minAttendance: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Max %</label>
                        <input
                            type="number"
                            placeholder="100"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.maxAttendance}
                            onChange={(e) => setFilter({ ...filter, maxAttendance: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Batch</label>
                        <input
                            type="text"
                            placeholder="2021"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.batch}
                            onChange={(e) => setFilter({ ...filter, batch: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Year</label>
                        <input
                            type="text"
                            placeholder="3rd"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.year}
                            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Late Freq {'>'}=</label>
                        <input
                            type="number"
                            placeholder="3"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.lateCountMin}
                            onChange={(e) => setFilter({ ...filter, lateCountMin: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center h-[50px]">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={filter.defaulterOnly}
                                    onChange={(e) => setFilter({ ...filter, defaulterOnly: e.target.checked })}
                                />
                                <div className={cn(
                                    "w-10 h-6 rounded-full transition-colors border",
                                    filter.defaulterOnly ? "bg-rose-500 border-rose-600" : "bg-slate-100 border-slate-200"
                                )}></div>
                                <div className={cn(
                                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                    filter.defaulterOnly ? "translate-x-4" : ""
                                )}></div>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase group-hover:text-rose-600 transition-colors">Defaulters (students with critical attendance issues)</span>
                                            </label>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full items-end pt-4 border-t border-slate-100">
                    <div className="md:w-1/3 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Subject</label>
                        <input
                            type="text"
                            placeholder="e.g., Mathematics"
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.subject}
                            onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
                        />
                    </div>
                    <div className="md:w-1/3 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Filter Information / Remarks</label>
                        <input
                            type="text"
                            placeholder="Add memo to report header..."
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                            value={filter.filterInfo}
                            onChange={(e) => setFilter({ ...filter, filterInfo: e.target.value })}
                        />
                    </div>
                    <div className="md:w-1/4 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Time Range</label>
                        <div className="flex gap-2">
                            <input
                                type="time"
                                className="w-full px-3 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                                value={filter.startTime}
                                onChange={(e) => setFilter({ ...filter, startTime: e.target.value })}
                            />
                            <input
                                type="time"
                                className="w-full px-3 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                                value={filter.endTime}
                                onChange={(e) => setFilter({ ...filter, endTime: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex-1"></div>
                    <button
                        onClick={fetchReports}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group h-[50px] min-w-[200px]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Filter size={18} className="group-hover:rotate-12 transition-transform" />}
                        Generate Intelligence
                    </button>
                </div>
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
