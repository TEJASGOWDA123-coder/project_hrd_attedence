'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, LayoutGrid, X, Loader2, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SectionsPage() {
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchSections = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/sections');
        const data = await res.json();
        setSections(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSections();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await fetch('/api/admin/sections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (res.ok) {
            setShowModal(false);
            setName('');
            fetchSections();
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string, sectionName: string) => {
        if (confirm(`Permanentely delete ${sectionName}? This will affect all associated data.`)) {
            await fetch(`/api/admin/sections?id=${id}`, { method: 'DELETE' });
            fetchSections();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sections & Classes</h1>
                    <p className="text-slate-500 mt-1">Organize your institution's academic structure.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 font-bold text-sm"
                >
                    <Plus size={20} /> New Section
                </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4 bg-white rounded-[2rem] border border-slate-200">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading structural data...</p>
                    </div>
                ) : sections.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-200">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No sections defined yet.</p>
                    </div>
                ) : sections.map((section) => (
                    <div key={section.id} className="group relative">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm transition-all group-hover:shadow-2xl group-hover:shadow-indigo-100/50 group-hover:border-indigo-100 group-hover:-translate-y-1">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <LayoutGrid size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{section.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                                            <Hash size={12} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{section.id}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(section.id, section.name)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Delete Section"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="mt-8 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                                    <span className="text-xs font-bold text-emerald-500 mt-1">Operational</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Roster</span>
                                    <span className="text-xs font-bold text-slate-600 mt-1 block">{section.studentCount || 0} Registered Students</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                    <LayoutGrid size={32} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Section</h2>
                            <p className="text-slate-400 text-sm font-medium mt-1 mb-8">Define a new academic group or class.</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="text-left space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Section Identifier</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. MCA C 2024-2026"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : "Finalize Section"}
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

