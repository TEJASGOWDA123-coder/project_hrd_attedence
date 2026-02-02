'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calendar, ChevronRight, X, Loader2, BookOpen, User, Clock, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TimetablePage() {
    const [timetable, setTimetable] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        sectionId: '',
        teacherId: '',
        subject: '',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00'
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const [tRes, secRes, teaRes] = await Promise.all([
            fetch('/api/admin/timetable'),
            fetch('/api/admin/sections'),
            fetch('/api/admin/teachers'),
        ]);
        const [tData, secData, teaData] = await Promise.all([tRes.json(), secRes.json(), teaRes.json()]);
        setTimetable(tData);
        setSections(secData);
        setTeachers(teaData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await fetch('/api/admin/timetable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            setShowModal(false);
            setFormData({ sectionId: '', teacherId: '', subject: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00' });
            fetchData();
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Timetable</h1>
                    <p className="text-slate-500 mt-1">Schedule management and class assignments.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 font-bold text-sm"
                >
                    <Plus size={20} /> Create Schedule
                </button>
            </header>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section & Subject</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Assignment</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synchronizing schedules...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : timetable.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No entries scheduled yet.</td>
                                </tr>
                            ) : timetable.map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100 uppercase">
                                                {entry.sectionName?.substring(0, 2) || '??'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-tight">{entry.subject}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Landmark size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{entry.sectionName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                <img src={`https://ui-avatars.com/api/?name=${entry.teacherName}&background=4f46e5&color=fff&size=24`} alt="" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{entry.teacherName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-emerald-500" />
                                                <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter">{entry.day}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-500 tracking-widest">{entry.startTime} — {entry.endTime}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><ChevronRight size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Schedule</h2>
                                    <p className="text-slate-400 text-sm font-medium mt-1">Define mandatory subject hours and teacher links.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Educational Subject</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <BookOpen size={18} />
                                        </div>
                                        <input
                                            required
                                            placeholder="e.g. Advanced Calculus"
                                            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Section</label>
                                    <select
                                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                                        value={formData.sectionId}
                                        onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                                    >
                                        <option value="">Select Class...</option>
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Assigned Teacher</label>
                                    <select
                                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                                        value={formData.teacherId}
                                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                    >
                                        <option value="">Select Staff...</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Academic Day</label>
                                    <select
                                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                                        value={formData.dayOfWeek}
                                        onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                    >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Time Slot (Start - End)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            className="flex-1 px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                        <input
                                            type="time"
                                            className="flex-1 px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-2 flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : "Finalize Schedule Entry"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
