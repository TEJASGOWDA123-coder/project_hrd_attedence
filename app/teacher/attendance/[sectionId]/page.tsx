import { db } from '@/lib/db';
import { students, sections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import AttendanceForm from '@/components/AttendanceForm'; // I'll create this client component

export default async function AttendancePage({
    params,
    searchParams
}: {
    params: Promise<{ sectionId: string }>,
    searchParams: Promise<{ subject?: string }>
}) {
    const { sectionId } = await params;
    const { subject } = await searchParams;

    const section = await db.query.sections.findFirst({
        where: eq(sections.id, sectionId),
    });

    if (!section) return <div>Section not found.</div>;

    const sectionStudents = await db.select()
        .from(students)
        .where(eq(students.sectionId, sectionId));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-black text-slate-900 tracking-tight">Attendance: {section.name}</h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">
                        Topic: <span className="text-indigo-600 underline underline-offset-4">{subject || 'General Session'}</span>
                    </p>
                </div>
            </div>

            <AttendanceForm students={sectionStudents} sectionId={sectionId} subject={subject || 'General'} />
        </div>
    );
}
