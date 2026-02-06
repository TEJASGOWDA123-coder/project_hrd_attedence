'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Loader2, X, GraduationCap, ShieldCheck, Mail, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', specialization: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/teachers');
        const data = await res.json();
        setTeachers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const res = await fetch('/api/admin/teachers', {
            method: editMode ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            setShowModal(false);
            setEditMode(false);
            setFormData({ id: '', name: '', email: '', password: '', specialization: '' });
            fetchData();
        } else {
            const data = await res.json();
            setError(data.error);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Remove access for ${name}? This action cannot be undone.`)) {
            await fetch(`/api/admin/teachers?id=${id}`, { method: 'DELETE' });
            fetchData();
        }
    };

    const handleEdit = (teacher: any) => {
        setFormData({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            password: '', // Keep empty for no change
            specialization: teacher.specialization || ''
        });
        setEditMode(true);
        setShowModal(true);
    };

    const [selectedSpecialization, setSelectedSpecialization] = useState('');

    const specializations = Array.from(new Set(teachers.map(t => t.specialization).filter(Boolean)));

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.email.toLowerCase().includes(search.toLowerCase());
        const matchesSpec = selectedSpecialization ? t.specialization === selectedSpecialization : true;
        return matchesSearch && matchesSpec;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teachers Management</h1>
                    <p className="text-slate-500 mt-1">Direct and organize your academic staff.</p>
                </div>
                <button
                    onClick={() => {
                        setEditMode(false);
                        setFormData({ id: '', name: '', email: '', password: '', specialization: '' });
                        setShowModal(true);
                    }}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 font-bold text-sm"
                >
                    <Plus size={20} /> Add Faculty Member
                </button>
            </header>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 gap-4">
                    <div className="flex-1 flex gap-4 max-w-2xl">
                         <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Filter by name, email or ID..."
                                className="pl-12 pr-4 py-3 w-full bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                         <select
                            className="px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 cursor-pointer appearance-none min-w-[200px]"
                            value={selectedSpecialization}
                            onChange={(e) => setSelectedSpecialization(e.target.value)}
                        >
                            <option value="">All Specializations</option>
                            {specializations.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                        </select>
                    </div>
                   
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        Total Staff: {filteredTeachers.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching staff records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching records found.</p>
                                    </td>
                                </tr>
                            ) : filteredTeachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                <img src={`https://ui-avatars.com/api/?name=${teacher.name}&background=random&color=fff`} alt="" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-tight">{teacher.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                                                    <Mail size={12} />
                                                    <span className="text-xs font-medium">{teacher.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm">
                                        <div className="flex items-center gap-2 py-1 px-3 bg-slate-100 rounded-full w-fit">
                                            <GraduationCap size={14} className="text-indigo-500" />
                                            <span className="text-xs font-bold text-slate-600">{teacher.specialization || 'General'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Active</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(teacher)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            title="Edit Profile"
                                        >
                                            <ShieldAlert size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(teacher.id, teacher.name)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Revoke Access"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="text-center mb-10">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                                        <Plus size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">{editMode ? 'Edit Faculty Record' : 'New Faculty Credentials'}</h2>
                                    <p className="text-slate-400 text-sm font-medium mt-1">
                                        {editMode ? 'Update teacher profile details and access.' : 'Generate access tokens for an educator.'}
                                    </p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-sans">Full Name</label>
                                        <input
                                            required
                                            placeholder="e.g. Dr. Robert Wilson"
                                            className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="wilson@ams.edu"
                                            className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Access Key (Password)</label>
                                    <input 
                                        required={!editMode} 
                                        type="password" 
                                        placeholder={editMode ? "Leave blank to keep current" : "Min. 8 characters"} 
                                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900" 
                                        value={formData.password} 
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                                    />
                                </div>

                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Academic Specialization</label>
                                        <input
                                            placeholder="e.g. Theoretical Physics"
                                            className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                            value={formData.specialization}
                                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-10">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition"
                                    >
                                        Discard
                                    </button>
                                    <button type="submit" disabled={submitting} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : (editMode ? "Update Faculty Profile" : "Save Teacher Profile")}
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
