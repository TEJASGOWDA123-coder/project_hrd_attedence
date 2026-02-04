'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Shield, Mail, Calendar, Loader2 } from 'lucide-react';

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
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

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const res = await fetch('/api/admin/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                alert('Admin added successfully!');
                setShowAddModal(false);
                setFormData({ name: '', email: '', password: '' });
                fetchAdmins();
            } else {
                alert(data.error || 'Failed to add admin');
            }
        } catch (error) {
            console.error('Failed to add admin', error);
            alert('Something went wrong');
        } finally {
            setSubmitLoading(false);
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
                    onClick={() => setShowAddModal(true)}
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
                        <div key={admin.id} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">{admin.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrator</p>
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

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-slate-900 mb-6">New Administrator</h2>
                        <form onSubmit={handleAddAdmin} className="space-y-5">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                <input 
                                    required
                                    className="w-full mt-2 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
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
                                    className="w-full mt-2 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                                <input 
                                    required
                                    type="password"
                                    className="w-full mt-2 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                                >
                                    {submitLoading ? <Loader2 className="animate-spin" /> : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
