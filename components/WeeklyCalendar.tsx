'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WeeklyCalendar({ schedule }: { schedule: any[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const getWeekDays = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay() + 1); // Start on Monday
        const days = [];
        for (let i = 0; i < 6; i++) { // Monday to Saturday
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(currentDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const prevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const nextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                        Week of {weekDays[0].getDate()} - {weekDays[weekDays.length - 1].getDate()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevWeek} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400 hover:text-indigo-600">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-100 transition-colors">
                        Today
                    </button>
                    <button onClick={nextWeek} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400 hover:text-indigo-600">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Mobile Day Selector (Visible only on small screens) */}
            <div className="md:hidden flex overflow-x-auto p-4 gap-2 no-scrollbar scroll-smooth">
                {weekDays.map((day) => {
                    const isSelected = selectedDate.toDateString() === day.toDateString();
                    const isToday = new Date().toDateString() === day.toDateString();
                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[4rem] py-3 rounded-2xl border transition-all",
                                isSelected 
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200" 
                                    : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                            )}
                        >
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-indigo-200" : "text-slate-400")}>
                                {dayNames[day.getDay()].substring(0, 3)}
                            </span>
                            <span className="text-lg font-black mt-1">{day.getDate()}</span>
                            {isToday && <div className="w-1 h-1 bg-current rounded-full mt-1" />}
                        </button>
                    );
                })}
            </div>

            {/* Mobile View Content (Single Day) */}
            <div className="md:hidden p-4 min-h-[300px]">
                {(() => {
                    const day = selectedDate; // Use state for mobile selection
                    const dayName = dayNames[day.getDay()];
                    const dateStr = day.toLocaleDateString('en-CA');
                    
                    const dayClasses = schedule.filter(s => {
                        if (s.date) return s.date === dateStr;
                        return s.day === dayName;
                    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

                    if (dayClasses.length === 0) {
                        return (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                <BookOpen size={48} strokeWidth={1} />
                                <p className="text-sm font-bold uppercase tracking-widest mt-4">No classes scheduled.</p>
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-3">
                            {dayClasses.map((cls, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500" />
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{cls.subject}</p>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">{cls.sectionName}</h3>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-xl">
                                             <Clock size={16} className="text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                                        {cls.startTime} - {cls.endTime}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* Desktop View (Grid) - Hidden on Mobile */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                {weekDays.map((day) => {
                    const dayName = dayNames[day.getDay()];
                    const dateStr = day.toLocaleDateString('en-CA'); // YYYY-MM-DD format
                    const isToday = new Date().toDateString() === day.toDateString();

                    const dayClasses = schedule.filter(s => {
                        if (s.date) {
                            return s.date === dateStr;
                        }
                        return s.day === dayName;
                    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

                    return (
                        <div key={day.toISOString()} className={cn("min-h-[400px] flex flex-col group", isToday ? "bg-indigo-50/30" : "")}>
                            <div className={cn("p-4 border-b border-slate-50 text-center sticky top-0 bg-white/95 backdrop-blur-sm z-10", isToday ? "bg-indigo-50/50" : "")}>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isToday ? "text-indigo-600" : "text-slate-400")}>{dayName}</p>
                                <div className={cn("w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm", isToday ? "bg-indigo-600 text-white shadow-lg shadow-indigo-300" : "text-slate-900")}>
                                    {day.getDate()}
                                </div>
                            </div>
                            
                            <div className="p-2 space-y-2 flex-1 relative">
                                {dayClasses.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">
                                        
                                    </div>
                                ) : (
                                    dayClasses.map((cls, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group/card relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl" />
                                            <div className="pl-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{cls.subject}</p>
                                                <p className="text-xs font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{cls.sectionName}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded-lg">
                                                    <Clock size={10} />
                                                    {cls.startTime} - {cls.endTime}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
