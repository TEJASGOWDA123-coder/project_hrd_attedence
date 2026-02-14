import { db } from './lib/db';
import { students, attendance } from './lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function migrate() {
    const USNS = [
        "U19KU24M0131", "U19KU24M0132", "U19KU24M0133", "U19KU24M0134", "U19KU24M0135", "U19KU24M0136", "U19KU24M0137", "U19KU24M0138", "U19KU24M0139", "U19KU24M0140",
        "U19KU24M0141", "U19KU24M0142", "U19KU24M0143", "U19KU24M0144", "U19KU24M0145", "U19KU24M0146", "U19KU24M0147", "U19KU24M0148", "U19KU24M0149", "U19KU24M0150",
        "U19KU24M0151", "U19KU24M0152", "U19KU24M0153", "U19KU24M0154", "U19KU24M0155", "U19KU24M0157", "U19KU24M0158", "U19KU24M0160", "U19KU24M0161", "U19KU24M0162",
        "U19KU24M0163", "U19KU24M0164", "U19KU24M0165", "U19KU24M0166", "U19KU24M0167", "U19KU24M0168", "U19KU24M0170", "U19KU24M0171", "U19KU24M0172", "U19KU24M0173",
        "U19KU24M0174", "U19KU24M0175", "U19KU24M0176", "U19KU24M0177", "U19KU24M0178", "U19KU24M0179", "U19KU24M0180", "U19KU24M0181", "U19KU24M0182", "U19KU24M0183",
        "U19KU24M0184", "U19KU24M0185", "U19KU24M0186", "U19KU24M0187", "U19KU24M0188", "U19KU24M0189", "U19KU24M0190", "U19KU24M0191", "U19KU24M0192", "U19KU24M0193",
        "U19KU24M0194", "U19KU24M0195"
    ];

    const targetSectionId = 'olwofv78i'; // BBA C 2024 2027

    console.log(`Starting migration for ${USNS.length} students to section ${targetSectionId}...`);

    // 1. Get student IDs for these USNs
    const studentRecords = await db.select({ id: students.id }).from(students).where(inArray(students.usn, USNS));
    const studentIds = studentRecords.map(s => s.id);

    if (studentIds.length === 0) {
        console.error("No students found for the provided USNs.");
        return;
    }

    console.log(`Found ${studentIds.length} student IDs. Updating student records...`);

    // 2. Update students table
    const studentUpdateResult = await db.update(students)
        .set({ sectionId: targetSectionId })
        .where(inArray(students.id, studentIds));
    
    console.log("Students updated.");

    // 3. Update attendance table
    console.log("Updating attendance records for these students...");
    const attendanceUpdateResult = await db.update(attendance)
        .set({ sectionId: targetSectionId })
        .where(inArray(attendance.studentId, studentIds));
    
    console.log("Attendance records updated.");

    console.log("Migration complete.");
}

migrate().catch(console.error);
