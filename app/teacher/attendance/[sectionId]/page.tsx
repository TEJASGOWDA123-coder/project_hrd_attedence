import { db } from '@/lib/db';
import { students, sections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import AttendanceForm from '@/components/AttendanceForm'; // I'll create this client component

export default async function AttendancePage({ params }: { params: Promise<{ sectionId: string }> }) {
    const { sectionId } = await params;

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
                    <h1 className="text-3xl font-bold text-purple-900">Attendance: {section.name}</h1>
                    <p className="text-purple-600">Mark attendance for {new Date().toLocaleDateString()}.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
                <AttendanceForm students={sectionStudents} sectionId={sectionId} />
            </div>
        </div>
    );
}
