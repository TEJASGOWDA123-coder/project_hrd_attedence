'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

function AttendanceForm() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    
    const [usn, setUsn] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [studentName, setStudentName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usn || !code || !token) return;

        setStatus('loading');
        try {
            let lat = null;
            let lng = null;

            // Try to get location
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch (err) {
                console.warn("Location not provided. Verification might fail if session is locked.");
            }

            const res = await fetch('/api/attendance/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, token, usn, lat, lng })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('success');
                setStudentName(data.studentName || 'Student');
                setMessage(data.message || 'Attendance marked successfully!');
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to mark attendance.');
            }
        } catch (e) {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
    };

    if (!code || !token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
                    <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h1 className="text-xl font-black text-slate-900">Invalid Link</h1>
                    <p className="text-slate-500 mt-2 text-sm">No QR code session detected.</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-[#FAF9FF] flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 text-center max-w-sm w-full border border-indigo-50 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-lg shadow-emerald-200">
                        <CheckCircle2 size={40} strokeWidth={3} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">You're Checked In!</h1>
                    <p className="text-slate-500 mt-2 font-medium">Welcome, <span className="text-indigo-600 font-bold">{studentName}</span>.</p>
                    <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session Validated</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9FF] flex flex-col items-center justify-center p-6">
             <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                
                <div className="text-center mb-8">
                     {/* Placeholder for Logo if needed */}
                     <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl mb-4">
                        <CheckCircle2 size={24} />
                     </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mark Attendance</h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Enter your Student ID (USN) to check in.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Student USN</label>
                        <input 
                            required
                            placeholder="e.g. 1HR23CS001"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all placeholder:text-slate-300"
                            value={usn}
                            onChange={(e) => setUsn(e.target.value.toUpperCase())}
                        />
                    </div>

                    {status === 'error' && (
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-2 border border-rose-100">
                            <XCircle size={18} />
                            {message}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={status === 'loading'}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? <Loader2 className="animate-spin" /> : 'Check In Now'}
                    </button>
                </form>
             </div>
             <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest opacity-60">Attendly Secure Check-in</p>
        </div>
    );
}

export default function MarkAttendancePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AttendanceForm />
        </Suspense>
    );
}
