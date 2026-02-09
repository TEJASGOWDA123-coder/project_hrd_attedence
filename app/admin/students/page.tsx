'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Users, Mail, GraduationCap, X, Loader2, Landmark, FileUp, Download, AlertCircle, CheckCircle2, IdCard, Hash, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function StudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [formData, setFormData] = useState({ usn: '', name: '', batch: '', year: '', sectionId: '' });
    const [submitting, setSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Bulk States
    const [bulkData, setBulkData] = useState<any[]>([]);
    const [bulkErrors, setBulkErrors] = useState<string[]>([]);
    const [bulkPhase, setBulkPhase] = useState<'upload' | 'preview' | 'success'>('upload');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sRes, secRes] = await Promise.all([
                fetch('/api/admin/students'),
                fetch('/api/admin/sections'),
            ]);

            if (!sRes.ok || !secRes.ok) {
                const sErr = !sRes.ok ? await sRes.text() : null;
                const secErr = !secRes.ok ? await secRes.text() : null;
                console.error('Fetch error:', { sStatus: sRes.status, sErr, secStatus: secRes.status, secErr });
                throw new Error('Failed to fetch data from server');
            }

            const [sData, secData] = await Promise.all([sRes.json(), secRes.json()]);
            setStudents(Array.isArray(sData) ? sData : []);
            setSections(Array.isArray(secData) ? secData : []);
        } catch (err: any) {
            console.error('Data sync failed:', err);
            alert('Could not synchronize student records. Please check your connection or database status.');
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
        const res = await fetch('/api/admin/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            setShowModal(false);
            setFormData({ usn: '', name: '', batch: '', year: '', sectionId: '' });
            fetchData();
        } else {
            const err = await res.json();
            alert(err.error || 'Enrollment failed');
        }
        setSubmitting(false);
    };

    const handleBulkSubmit = async () => {
        if (bulkErrors.length > 0) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/students/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students: bulkData }),
            });
            if (res.ok) {
                setBulkPhase('success');
                fetchData();
            } else {
                const error = await res.json();
                alert(error.error || 'Bulk enrollment failed');
            }
        } catch (err) {
            alert('An error occurred during bulk enrollment');
        }
        setSubmitting(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to array of arrays for precise row-by-row control
            const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            parseXLSX(rows);
        };
        reader.readAsBinaryString(file);
    };

    const parseXLSX = (rows: any[][]) => {
        if (rows.length < 2) {
            setBulkErrors(['Excel file is empty or missing data rows.']);
            return;
        }

        const rawHeaders = rows[0].map(h => String(h || '').trim().toLowerCase());
        
        // Match headers with aliases
        const findIdx = (terms: string[]) => rawHeaders.findIndex(h => terms.some(t => h === t || h.includes(t)));
        const usnIdx = findIdx(['usn', 'id', 'roll', 'reg', 'number']);
        const nameIdx = findIdx(['name', 'student', 'full name', 'candidate']);
        const sectionIdx = findIdx(['section', 'class', 'academic', 'dept', 'branch', 'sec']);
        const batchIdx = findIdx(['batch', 'period', 'session', 'duration']);
        const yearIdx = findIdx(['year', 'sem', 'level']);

        if (usnIdx === -1 || nameIdx === -1 || sectionIdx === -1) {
            const missing = [];
            if (usnIdx === -1) missing.push('USN');
            if (nameIdx === -1) missing.push('Name');
            if (sectionIdx === -1) missing.push('Section');
            setBulkErrors([`Could not find columns for: ${missing.join(', ')}. Please ensure your Excel headers are clear.`]);
            return;
        }

        const parsed: any[] = [];
        const errors: string[] = [];
        const availableSections = sections.map(s => s.name);

        // Data Stitching Buffer
        let bufferedName = '';
        let bufferedBatch = '';
        let bufferedYear = '';

        rows.slice(1).forEach((cols, i) => {
            // Clean the data
            const val = (idx: number) => idx !== -1 ? String(cols[idx] || '').trim() : '';
            
            const usn = val(usnIdx);
            const name = val(nameIdx);
            const sectionValue = val(sectionIdx);
            const batch = val(batchIdx);
            const year = val(yearIdx);

            // Skip entirely empty rows
            if (!usn && !name && !sectionValue) return;

            // Scenario: Partial row (Name only) - save to buffer for next row
            if (name && !usn && !sectionValue) {
                bufferedName = name;
                bufferedBatch = batch;
                bufferedYear = year;
                return;
            }

            // Scenario: Data present - try to merge with buffer if USN is here
            const finalName = name || bufferedName;
            const finalBatch = batch || bufferedBatch;
            const finalYear = year || bufferedYear;

            // Clear buffer after attempt
            bufferedName = '';
            bufferedBatch = '';
            bufferedYear = '';

            if (!usn || !sectionValue || !finalName) {
                errors.push(`Row ${i + 2}: Missing critical fields (Name, USN, or Section).`);
                return;
            }

            // Advanced Fuzzy Matching for Sections
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const searchNorm = normalize(sectionValue);

            let matchedSection = sections.find(s => 
                normalize(s.name) === searchNorm || 
                s.name.toLowerCase().includes(sectionValue.toLowerCase())
            );

            if (!matchedSection) {
                // Prefix match if unique
                const matches = sections.filter(s => normalize(s.name).startsWith(searchNorm));
                if (matches.length === 1) matchedSection = matches[0];
            }

            if (!matchedSection) {
                errors.push(`Row ${i + 2}: Section "${sectionValue}" not found. Available: ${availableSections.slice(0, 5).join(', ')}...`);
            } else {
                parsed.push({
                    usn: usn.toUpperCase(),
                    name: finalName,
                    batch: finalBatch,
                    sectionName: matchedSection.name,
                    year: finalYear
                });
            }
        });

        console.log('Processed XLSX Data:', parsed);
        setBulkData(parsed);
        setBulkErrors(errors);
        setBulkPhase('preview');
    };

    const downloadSample = () => {
        const data = [
            ["USN", "Name", "Section", "Batch", "Year"],
            ["1NH22MC001", "Venkatesh K", "MCA A 2024 2026", "2024-2026", "1"],
            ["1NH22MC002", "Tejas Gowda", "MCA A 2024 2026", "2024-2026", "1"],
            ["", "GANDAVARAPU CHANDRA", "", "", ""], // Example of a split row
            ["1NH22MC003", "", "MCA A 2024 2026", "2024-2026", "1"] // Example of a split row complement
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, "student_enrollment_template.xlsx");
    };

    const handleDelete = async (id: string, name?: string) => {
        if (confirm(name ? `Unenroll ${name}? All attendance data for this student will be archived.` : `Delete ${selectedIds.length} selected students?`)) {
            const res = await fetch(id === 'bulk' ? '/api/admin/students/bulk' : `/api/admin/students?id=${id}`, { 
                method: 'DELETE',
                headers: id === 'bulk' ? { 'Content-Type': 'application/json' } : {},
                body: id === 'bulk' ? JSON.stringify({ ids: selectedIds }) : null
            });
            if (res.ok) {
                setSelectedIds([]);
                fetchData();
            }
        }
    };

    const handleBulkDeleteByFilter = async () => {
        if (!selectedSection && !confirm('No section selected. This will delete students based on active filters. Proceed?')) return;
        if (confirm(`Delete ALL students matching active filters?`)) {
            const res = await fetch('/api/admin/students/bulk', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectionId: selectedSection })
            });
            if (res.ok) fetchData();
        }
    };

    const [selectedSection, setSelectedSection] = useState('');

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.usn.toLowerCase().includes(search.toLowerCase());
        const matchesSection = selectedSection ? s.sectionId === selectedSection : true;
        return matchesSearch && matchesSection;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Roster</h1>
                    <p className="text-slate-500 mt-1">Enrollment and academic tracking portal.</p>
                </div>
                <div className="flex gap-4">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => handleDelete('bulk')}
                            className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-rose-100 border border-rose-200 shadow-sm transition-all active:scale-95 font-bold text-sm animate-in zoom-in-95"
                        >
                            <Trash2 size={20} /> Delete Selected ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setBulkPhase('upload');
                            setBulkErrors([]);
                            setBulkData([]);
                            setShowBulkModal(true);
                        }}
                        className="bg-white text-slate-600 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-50 border border-slate-200 shadow-sm transition-all active:scale-95 font-bold text-sm"
                    >
                        <FileUp size={20} /> Bulk Enrollment
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 font-bold text-sm"
                    >
                        <Plus size={20} /> New Enrollment
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 gap-4">
                    <div className="flex-1 flex gap-4 max-w-2xl">
                         <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or USN..."
                                className="pl-12 pr-4 py-3 w-full bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 cursor-pointer appearance-none min-w-[200px]"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="">All Sections</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
                        </select>
                    </div>
                   
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm whitespace-nowrap">
                        Active Students: {filteredStudents.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-8 py-5 text-left">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds(filteredStudents.map(s => s.id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acedemic Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Accessing records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-1 – text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest py-20">No matching enrollments found.</p>
                                    </td>
                                </tr>
                            ) : filteredStudents.map((student) => (
                                <tr key={student.id} className={cn("hover:bg-slate-50/50 transition-colors group", selectedIds.includes(student.id) && "bg-indigo-50/30")}>
                                    <td className="px-8 py-5">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                            checked={selectedIds.includes(student.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds([...selectedIds, student.id]);
                                                } else {
                                                    setSelectedIds(selectedIds.filter(id => id !== student.id));
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full border-2 border-indigo-100 p-0.5 group-hover:border-indigo-600 transition-colors overflow-hidden">
                                                <img src={`https://ui-avatars.com/api/?name=${student.name}&background=f1f5f9&color=6366f1`} alt="" className="rounded-full" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-tight">{student.name}</p>
                                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter mt-0.5">{student.usn}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 py-1 px-3 bg-indigo-50 rounded-lg w-fit text-indigo-700 border border-indigo-100">
                                                <Landmark size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-tight">{student.sectionName || 'Pending'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="text-[10px] font-black uppercase tracking-widest">{student.batch || 'No Batch'}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Year {student.year || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleDelete(student.id, student.name)}
                                            className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                                            title="Unenroll Student"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Individual Enrollment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Enrollment</h2>
                                    <p className="text-slate-400 text-sm font-medium mt-1">Register a new student to the institution.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Student USN</label>
                                        <div className="relative">
                                            <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input required placeholder="1NH22MC000" className="w-full pl-12 pr-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900" value={formData.usn} onChange={(e) => setFormData({ ...formData, usn: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                        <input required placeholder="Charlie Morningstar" className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Batch</label>
                                        <input placeholder="2024-2026" className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Year</label>
                                        <input placeholder="1" className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Section</label>
                                    <select className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900 cursor-pointer appearance-none" value={formData.sectionId} onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}>
                                        <option value="">Select...</option>
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition">Discard</button>
                                    <button type="submit" disabled={submitting} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : "Finalize Enrollment"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Enrollment Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bulk Enrollment Flow</h2>
                                    <p className="text-slate-400 text-sm font-medium mt-1">Institutional scale enrollment via CSV data processing.</p>
                                </div>
                                <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            {bulkPhase === 'upload' && (
                                <div className="space-y-8">
                                    <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-center hover:border-indigo-100 transition-colors group relative">
                                        <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-50">
                                            <FileUp size={40} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900">Push CSV Source</h4>
                                        <p className="text-slate-400 text-sm mt-1 font-medium">Click or drag your enrollment data sheet here.</p>
                                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                                            {['USN', 'Name', 'Batch', 'Section', 'Year'].map(field => (
                                                <span key={field} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">{field}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-8 rounded-3xl flex items-center justify-between border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-indigo-600">
                                                <Download size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">Standard Data Structure</p>
                                                <p className="text-xs text-slate-400 font-medium">Download the optimized template for zero-error import.</p>
                                            </div>
                                        </div>
                                        <button onClick={downloadSample} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                            Get Source Template
                                        </button>
                                    </div>
                                </div>
                            )}

                            {bulkPhase === 'preview' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900">Log Preview</h4>
                                                <p className="text-xs text-slate-400 font-medium">Analyzing {bulkData.length} entry points...</p>
                                            </div>
                                        </div>
                                        {bulkErrors.length > 0 && (
                                            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight border border-rose-100 animate-pulse">
                                                <AlertCircle size={16} /> {bulkErrors.length} Conflict(s)
                                            </div>
                                        )}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-[2rem] shadow-inner bg-slate-50/50">
                                        <table className="w-full text-xs border-collapse">
                                            <thead className="bg-white sticky top-0 border-b border-slate-100 z-10">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">USN</th>
                                                    <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">Student</th>
                                                    <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">Academic</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {bulkData.slice(0, 50).map((row, i) => (
                                                    <tr key={i} className="bg-white hover:bg-indigo-50/30 transition-colors">
                                                        <td className="px-6 py-3 font-black text-slate-900">{row.usn}</td>
                                                        <td className="px-6 py-3 font-bold text-slate-700">{row.name}</td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-black text-indigo-600 uppercase tracking-tighter">{row.sectionName}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">{row.batch}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {bulkErrors.length > 0 && (
                                        <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-xs font-medium text-rose-600 space-y-2">
                                            <p className="font-black uppercase tracking-widest mb-3 flex items-center gap-2"><AlertCircle size={16} /> Critical Issues Detected:</p>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                                {bulkErrors.slice(0, 8).map((err, i) => (
                                                    <p key={i}>• {err}</p>
                                                ))}
                                            </div>
                                            {bulkErrors.length > 8 && <p className="mt-2 font-bold italic underline">And {bulkErrors.length - 8} more issues that require fixing.</p>}
                                        </div>
                                    )}

                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => setBulkPhase('upload')} className="flex-1 py-4 text-slate-400 font-bold text-sm hover:bg-slate-50 rounded-2xl transition">Back to Upload</button>
                                        <button disabled={bulkErrors.length > 0 || submitting} onClick={handleBulkSubmit} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                                            {submitting ? <Loader2 className="animate-spin" size={20} /> : "Authorize System Entry"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {bulkPhase === 'success' && (
                                <div className="text-center py-16 space-y-8 animate-in zoom-in-95 duration-700">
                                    <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-50 border border-emerald-100">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Authorization Successful</h3>
                                        <p className="text-slate-400 text-sm mt-3 font-medium max-w-sm mx-auto">The institutional roster has been updated with the processed student data packets.</p>
                                    </div>
                                    <button onClick={() => setShowBulkModal(false)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200">
                                        Return to Secure Roster
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
