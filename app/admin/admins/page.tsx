'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Shield, Mail, Calendar, Loader2, Pencil, Trash2, Filter } from 'lucide-react';

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/admins');
            const data = await res.json();
            setAdmins(data);
        } catch (error) {
            console.error('Failed to fetch admins', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleOpenAdd = () => {
        setModalMode('add');
        setSelectedAdminId(null);
        setFormData({ name: '', email: '', password: '' });
        setShowModal(true);
    };

    const handleOpenEdit = (admin: any) => {
        setModalMode('edit');
        setSelectedAdminId(admin.id);
        setFormData({ name: admin.name, email: admin.email, password: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const method = modalMode === 'add' ? 'POST' : 'PATCH';
            const body = modalMode === 'add' 
                ? formData 
                : { id: selectedAdminId, ...formData };

            const res = await fetch('/api/admin/admins', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                alert(`Admin ${modalMode === 'add' ? 'added' : 'updated'} successfully!`);
                setShowModal(false);
                setFormData({ name: '', email: '', password: '' });
                fetchAdmins();
            } else {
                alert(data.error || `Failed to ${modalMode} admin`);
            }
        } catch (error) {
            console.error(`Failed to ${modalMode} admin`, error);
            alert('Something went wrong');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteAdmin = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} as an administrator?`)) return;

        try {
            const res = await fetch(`/api/admin/admins?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                alert('Admin removed successfully');
                fetchAdmins();
            } else {
                alert(data.error || 'Failed to remove admin');
            }
        } catch (error) {
            console.error('Failed to remove admin', error);
            alert('Something went wrong');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Admin Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage users with administrative privileges.</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <UserPlus size={20} />
                    Add Administrator
                </button>
            </header>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {admins.map((admin) => (
                        <div key={admin.id} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col gap-4 group hover:border-indigo-200 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 capitalize">{admin.name}</h3>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Administrator</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleOpenEdit(admin)}
                                        className="p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all"
                                        title="Edit Admin"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                        className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                                        title="Remove Admin"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="truncate">{admin.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Calendar size={14} />
                                    <span>Joined {new Date(admin.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Admin Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
                        <h2 className="text-2xl font-black text-slate-900 mb-6">{modalMode === 'add' ? 'New Administrator' : 'Edit Administrator'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                <input 
                                    required
                                    className="w-full mt-2 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                <input 
                                    required
                                    type="email"
                                    className="w-full mt-2 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Password {modalMode === 'edit' && '(Leave blank to keep current)'}</label>
                                <input 
                                    required={modalMode === 'add'}
                                    type="password"
                                    className="w-full mt-2 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                                >
                                    {submitLoading ? <Loader2 className="animate-spin" /> : (modalMode === 'add' ? 'Create Admin' : 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
