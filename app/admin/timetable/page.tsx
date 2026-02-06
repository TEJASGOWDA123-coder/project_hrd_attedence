'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Trash2, Loader2, X, ChevronRight, LayoutGrid, Clock, Users, Edit2, Landmark, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TimetablePage() {
    const [timetable, setTimetable] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [schedType, setSchedType] = useState<'weekly' | 'date'>('weekly');
    const [formData, setFormData] = useState({
        subject: '',
        sectionId: '',
        teacherId: '',
        dayOfWeek: 'Monday',
        date: '',
        startTime: '',
        endTime: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [showTodayOnly, setShowTodayOnly] = useState(false);
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterSection, setFilterSection] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, secRes, teaRes] = await Promise.all([
                fetch('/api/admin/timetable'),
                fetch('/api/admin/sections'),
                fetch('/api/admin/teachers'),
            ]);
            const [tData, secData, teaData] = await Promise.all([tRes.json(), secRes.json(), teaRes.json()]);
            setTimetable(tData || []);
            setSections(secData || []);
            setTeachers(teaData || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const payload = {
            ...formData,
            // If schedType is 'date', we might want to supply date and ignore dayOfWeek (or derive it)
            // If schedType is 'weekly', date should be empty
            date: schedType === 'date' ? formData.date : null,
            dayOfWeek: schedType === 'date' ? new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' }) : formData.dayOfWeek
        };

        const res = await fetch('/api/admin/timetable', {
            method: editMode ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editMode ? { id: selectedId, ...payload } : payload),
        });
        if (res.ok) {
            setShowModal(false);
            setEditMode(false);
            setSelectedId(null);
            setFormData({
                subject: '',
                sectionId: '',
                teacherId: '',
                dayOfWeek: 'Monday',
                date: '',
                startTime: '',
                endTime: '',
            });
            fetchData();
        } else {
            console.error('Failed to submit data');
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string, subject: string) => {
        if (confirm(`Remove ${subject} from the schedule?`)) {
            const res = await fetch(`/api/admin/timetable?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        }
    };

    const handleEdit = (entry: any) => {
        setSelectedId(entry.id);
        setFormData({
            subject: entry.subject,
            sectionId: entry.sectionId,
            teacherId: entry.teacherId,
            dayOfWeek: entry.day || 'Monday',
            date: entry.date || '',
            startTime: entry.startTime,
            endTime: entry.endTime,
        });
        setSchedType(entry.date ? 'date' : 'weekly');
        setEditMode(true);
        setShowModal(true);
    };

    const getFilteredTimetable = () => {
        let filtered = timetable;

        // Apply Today Only filter
        if (showTodayOnly) {
            const now = new Date();
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayName = days[now.getDay()];
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            filtered = filtered.filter(entry => entry.day === todayName && entry.endTime > currentTime);
        }

        // Apply Teacher Filter
        if (filterTeacher) {
            filtered = filtered.filter(entry => entry.teacherId === filterTeacher);
        }

        // Apply Section Filter
        if (filterSection) {
            filtered = filtered.filter(entry => entry.sectionId === filterSection);
        }

        return filtered;
    };

    const filteredTimetable = getFilteredTimetable();

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Academic Timetable</h1>
                    <p className="text-slate-500 mt-1 text-sm">Schedule management and class assignments.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <select
                        className="px-3 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-600 cursor-pointer"
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <select
                        className="px-3 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-600 cursor-pointer"
                        value={filterTeacher}
                        onChange={(e) => setFilterTeacher(e.target.value)}
                    >
                        <option value="">All Teachers</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                     <button
                        onClick={() => setShowTodayOnly(!showTodayOnly)}
                        className={cn(
                            "px-4 py-3 rounded-2xl flex items-center justify-center gap-2 border transition-all font-bold text-sm",
                            showTodayOnly 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        <Calendar size={18} />
                        {showTodayOnly ? 'Active Today' : 'Show All'}
                    </button>
                    <button
                    onClick={() => {
                        setEditMode(false);
                        setSelectedId(null);
                        setFormData({ subject: '', sectionId: '', teacherId: '', dayOfWeek: 'Monday', date: '', startTime: '', endTime: '' });
                        setSchedType('weekly');
                        setShowModal(true);
                    }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 font-bold text-sm"
                >
                    <Plus size={20} /> Create
                </button>
                </div>
            </header>

            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                {/* Desktop Table View (Hidden on mobile) */}
                <div className="hidden lg:block">
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
                            ) : filteredTimetable.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                                         {showTodayOnly ? "No active classes for today." : "No entries scheduled yet."}
                                    </td>
                                </tr>
                            ) : filteredTimetable.map((entry) => (
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
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                <img src={`https://ui-avatars.com/api/?name=${entry.teacherName}&background=4f46e5&color=fff&size=32`} alt="" />
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
                                        <div className="flex justify-end gap-3 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm border border-indigo-100"
                                                title="Edit Schedule"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id, entry.subject)}
                                                className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm border border-rose-100"
                                                title="Delete Schedule"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile / Tablet Card View */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">Loading Schedule...</p>
                        </div>
                    ) : timetable.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic text-sm font-medium">No entries scheduled yet.</div>
                    ) : timetable.map((entry) => (
                        <div key={entry.id} className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100 uppercase shrink-0">
                                        {entry.sectionName?.substring(0, 2) || '??'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">{entry.subject}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{entry.sectionName}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(entry)}
                                        className="p-2 text-indigo-600 bg-indigo-50 rounded-xl active:bg-indigo-100 transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry.id, entry.subject)}
                                        className="p-2 text-rose-500 bg-rose-50 rounded-xl active:bg-rose-100 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <Calendar size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{entry.day}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <Clock size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 tracking-tighter truncate">{entry.startTime} — {entry.endTime}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 border-t border-slate-50 pt-3">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                                    <img src={`https://ui-avatars.com/api/?name=${entry.teacherName}&background=4f46e5&color=fff&size=24`} alt="" />
                                </div>
                                <span className="text-xs font-bold text-slate-600 truncate">{entry.teacherName} (Assigned Staff)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-[60] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 md:p-10">
                            <div className="flex justify-between items-start mb-6 md:mb-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{editMode ? 'Edit Schedule' : 'Create Schedule'}</h2>
                                    <p className="text-slate-400 text-sm font-medium mt-1">{editMode ? 'Update existing timetable entry.' : 'Define mandatory subject hours and teacher links.'}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Educational Subject</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <BookOpen size={18} />
                                        </div>
                                        <input
                                            required
                                            placeholder="e.g. Advanced Calculus"
                                            className="w-full pl-11 pr-4 py-3.5 md:py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Section</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3.5 md:py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
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
                                        required
                                        className="w-full px-5 py-3.5 md:py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                                        value={formData.teacherId}
                                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                    >
                                        <option value="">Select Staff...</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Schedule Type</label>
                                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setSchedType('weekly')}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                schedType === 'weekly' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Weekly Recurring
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSchedType('date')}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                schedType === 'date' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Specific Date
                                        </button>
                                    </div>
                                </div>

                                {schedType === 'weekly' ? (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">recurrence Day</label>
                                        <select
                                            required
                                            className="w-full px-5 py-3.5 md:py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer"
                                            value={formData.dayOfWeek}
                                            onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">One-time Date</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-5 py-3.5 md:py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Time Slot (Start - End)</label>
                                    <div className="flex gap-2">
                                        <input
                                            required
                                            type="time"
                                            className="flex-1 px-4 md:px-5 py-3.5 md:py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                        <input
                                            required
                                            type="time"
                                            className="flex-1 px-4 md:px-5 py-3.5 md:py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="order-2 sm:order-1 flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="order-1 sm:order-2 flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : (editMode ? "Update Schedule" : "Finalize Schedule Entry")}
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
