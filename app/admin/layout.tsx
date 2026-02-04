'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    UserSquare2,
    LayoutGrid,
    CalendarDays,
    ClipboardCheck,
    FileText,
    LogOut,
    Search,
    Bell,
    MessageSquare,
    ChevronDown,
    Menu,
    X,
    QrCode,
    Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/admin/students', icon: Users },
    { label: 'Teachers', href: '/admin/teachers', icon: UserSquare2 },
    { label: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck },
    { label: 'Event Attendance', href: '/admin/qr', icon: QrCode },
    { label: 'Reports', href: '/admin/reports', icon: FileText },
    { label: 'Sections', href: '/admin/sections', icon: LayoutGrid },
    { label: 'Timetable', href: '/admin/timetable', icon: CalendarDays },
    { label: 'Admins', href: '/admin/admins', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
            })
            .catch(err => console.error('Session fetch failed', err));
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FC]">
            {/* Mobile Sidebar Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-col">
                        <div>
                            <Image src="/logo.png" alt="logo" width={500} height={500}/>
                        </div>
                        <div className='flex items-center gap-3'>
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <ClipboardCheck size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendly</h2>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Admin Portal</p>
                            </div>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon size={20} className={cn(isActive ? "text-indigo-600" : "text-slate-400")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="hidden md:flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl w-96 max-w-full border border-slate-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                            <Search size={18} className="text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search data, reports, names..."
                                className="bg-transparent border-none outline-none text-sm text-slate-900 font-bold w-full placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="flex items-center gap-1 md:gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <Bell size={20} />
                            </button>
                            <button className="hidden md:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <MessageSquare size={20} />
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-200 hidden md:block" />

                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 leading-none">{user?.name || 'Admin User'}</p>
                                <p className="text-[10px] text-slate-500 font-medium capitalize">{user?.role || 'Super Admin'}</p>
                            </div>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-200 overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-105">
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=4f46e5&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <ChevronDown size={16} className="text-slate-400 hidden sm:block" />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="p-4 md:p-8 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
