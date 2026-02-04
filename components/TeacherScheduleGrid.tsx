'use client';
import { useState } from 'react';
import { Calendar, Clock, Landmark, BookOpen, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeacherScheduleGrid({ schedule, days }: { schedule: any[], days: string[] }) {
    const [showUpcoming, setShowUpcoming] = useState(false);

    const getFilteredSchedule = () => {
        if (!showUpcoming) return schedule;

        const now = new Date();
        const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday
        const currentDayName = days[currentDayIndex - 1 < 0 ? 6 : currentDayIndex - 1]; // Convert 0-6 (Sun-Sat) to match days array if needed or use straight mapping

        // Map JS getDay() [0=Sun, 1=Mon...] to days array names
        const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = dayMap[now.getDay()];

        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        return schedule.filter(cls => {
            // Keep classes from other days? No, "Show Upcoming" implies immediacy. 
            // Usually "Upcoming" filter on a schedule view implies "Remaining classes for TODAY".
            // If the user wants to see future days, they scroll. 
            // Let's interpret "Show Upcoming Only" as "Hide past classes for today".

            if (cls.day !== todayName) return true; // Keep other days visible, or maybe hide them? 
            // Let's assume the user just wants to filter out what's done TODAY.
            // OR maybe they want to see ONLY future classes across the week?
            // "New schedule at not the end" suggests removing past items.
            
            return cls.endTime > currentTime;
        });
    };

    const filteredSchedule = getFilteredSchedule();

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowUpcoming(!showUpcoming)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all",
                        showUpcoming
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                >
                    <Filter size={14} />
                    {showUpcoming ? 'Showing Upcoming' : 'Show All'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {days.map((day) => {
                    const dayClasses = filteredSchedule.filter(s => s.day === day);
                    if (dayClasses.length === 0) return null;

                    return (
                        <div key={day} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="w-8 h-px bg-indigo-100" />
                                {day}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dayClasses.map((cls) => (
                                    <div key={cls.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Slot</p>
                                                <p className="text-xs font-bold text-slate-900 mt-1">{cls.startTime} - {cls.endTime}</p>
                                            </div>
                                        </div>

                                        <h4 className="text-xl font-black text-slate-900 tracking-tight mb-4">{cls.subject}</h4>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Landmark size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600">{cls.sectionName}</span>
                                            </div>
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            
             {filteredSchedule.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-200 animate-in zoom-in-95">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                        <Calendar size={64} strokeWidth={1} />
                        <p className="text-sm font-bold uppercase tracking-widest">No classes found with current filter.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
