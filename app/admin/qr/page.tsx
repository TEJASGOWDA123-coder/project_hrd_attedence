'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Users, Download, StopCircle, RefreshCw, Copy, Link as LinkIcon } from 'lucide-react';
import { cn, formatLocalTime } from '@/lib/utils';

import * as XLSX from 'xlsx';

export default function QRAttendancePage() {
    const [subject, setSubject] = useState('');
    const [sessionCode, setSessionCode] = useState('');
    const [activeSession, setActiveSession] = useState(false);
    const [attendedStudents, setAttendedStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [rotatingToken, setRotatingToken] = useState('');
    const [allowedStudents, setAllowedStudents] = useState<string[]>([]);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [useLocation, setUseLocation] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Extract USNs (looks for 'USN' or 'usn' column, or fallback)
            const usns = data.map((row: any) => {
                const key = Object.keys(row).find(k => k.toLowerCase() === 'usn');
                return key ? row[key] : Object.values(row)[0];
            }).filter(Boolean).map(String);

            setAllowedStudents(usns);
            console.log('Loaded USNs from Excel:', usns);
            alert(`Loaded ${usns.length} students from Excel`);
        };
        reader.readAsBinaryString(file);
    };

    // Polling for updates AND Initial Fetch for active session
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchStatus = async (code?: string) => {
            try {
                const url = code ? `/api/admin/qr/status?code=${code}` : `/api/admin/qr/status`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.students) {
                    setAttendedStudents(data.students);
                }

                if (data.isActive) {
                    if (data.rotatingToken) {
                        setRotatingToken(data.rotatingToken);
                    }
                    if (!activeSession) {
                        setSessionCode(data.code);
                        setSubject(data.subject);
                        setActiveSession(true);
                    }
                } else if (activeSession) {
                    setActiveSession(false);
                    alert('This session has been deactivated.');
                }
            } catch (e) {
                console.error('Polling error', e);
            }
        };

        // If no active session in state, try to fetch the global active one
        if (!activeSession) {
            fetchStatus();
        }

        if (activeSession && sessionCode) {
            fetchStatus(sessionCode); // Initial call
            interval = setInterval(() => fetchStatus(sessionCode), 5000); // Poll every 5s
        }

        return () => clearInterval(interval);
    }, [activeSession, sessionCode]);

    const toggleLocation = () => {
        if (!useLocation) {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setUseLocation(true);
                }, (err) => {
                    alert("Location access denied. QR code will not have proximity lock.");
                    setUseLocation(false);
                });
            } else {
                alert("Geolocation not supported by your browser.");
            }
        } else {
            setUseLocation(false);
            setLocation(null);
        }
    };

    const handleCreate = async () => {
        if (!subject) return alert('Please enter an Event Name');
        if (allowedStudents.length === 0) return alert('Please upload an Excel list first');

        setLoading(true);
        try {
            const payload = {
                sectionId: null,
                subject,
                allowedStudents: allowedStudents,
                latitude: location?.lat,
                longitude: location?.lng,
                radius: 100
            };

            const res = await fetch('/api/admin/qr/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setSessionCode(data.code);
                setActiveSession(true);
                setAttendedStudents([]);
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        if (confirm('Stop this session? Students will no longer be able to mark attendance.')) {
            try {
                await fetch('/api/admin/qr/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: sessionCode })
                });
                setActiveSession(false);
            } catch (e) {
                console.error(e);
                alert('Failed to stop session on server');
            }
        }
    };

    const exportToCSV = () => {
        const headers = ['USN', 'Name', 'Time'];
        const rows = attendedStudents.map(s => [s.usn, s.name, formatLocalTime(s.timestamp)]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_${subject}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const attendanceUrl = typeof window !== 'undefined' ? `${window.location.origin}/attendance/mark?code=${sessionCode}&token=${rotatingToken}` : '';

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <header>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Event Attendance</h1>
                <p className="text-slate-500 mt-1 text-sm">Real-time attendance via Excel-based whitelist.</p>
            </header>

            {!activeSession ? (
                <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-200 max-w-xl mx-auto">
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Upload Student List (Excel)</label>
                            <div className="mt-2 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="text-slate-400" />
                                    <p className="font-bold text-sm text-slate-600">
                                        {allowedStudents.length > 0 ? `${allowedStudents.length} Students Loaded` : 'Click to Upload Excel'}
                                    </p>
                                    <p className="text-xs text-slate-400">.xlsx or .xls files with 'USN' column</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Event Name</label>
                            <input
                                className="w-full mt-2 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                placeholder="e.g. Workshop Check-in"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 rounded-2xl border border-slate-200">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Security</p>
                                <p className="text-xs font-bold text-slate-600">{useLocation ? "✓ GPS Lock Active (100m)" : "No proximity restriction"}</p>
                            </div>
                            <button 
                                onClick={toggleLocation}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    useLocation ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                )}
                            >
                                {useLocation ? "Locked" : "Lock GPS"}
                            </button>
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Generate QR Code'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* QR Display */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-200 text-center space-y-8 flex flex-col items-center justify-center min-h-[500px]">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">{subject}</h2>
                            <p className="text-slate-500 font-medium">Scan to mark attendance</p>
                        </div>

                        <div className="p-4 bg-white border-4 border-slate-900 rounded-3xl shadow-2xl">
                            <QRCodeSVG value={attendanceUrl} size={256} className="w-64 h-64" />
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-sm">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 break-all select-all">
                                <LinkIcon size={14} className="shrink-0" />
                                {attendanceUrl}
                            </div>
                            <button onClick={handleStop} className="w-full py-3 bg-rose-50 text-rose-600 font-bold rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
                                <StopCircle size={18} /> Stop Session
                            </button>
                        </div>
                    </div>

                    {/* Live List */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col h-[600px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                                    <Users size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">Live Attendance</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{attendedStudents.length} Present</p>
                                </div>
                            </div>
                            <button onClick={exportToCSV} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Export CSV">
                                <Download size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {attendedStudents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                    <RefreshCw size={48} className="animate-spin-slow opacity-20" />
                                    <p className="mt-4 font-bold text-sm">Waiting for scans...</p>
                                </div>
                            ) : (
                                attendedStudents.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                                {s.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{s.usn}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                {formatLocalTime(s.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
