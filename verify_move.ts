import { db } from './lib/db';
import { sections, students, attendance } from './lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function verify() {
    const USNS = [
        "U19KU24M0131", "U19KU24M0132", "U19KU24M0133", "U19KU24M0134", "U19KU24M0135", "U19KU24M0136", "U19KU24M0137", "U19KU24M0138", "U19KU24M0139", "U19KU24M0140",
        "U19KU24M0141", "U19KU24M0142", "U19KU24M0143", "U19KU24M0144", "U19KU24M0145", "U19KU24M0146", "U19KU24M0147", "U19KU24M0148", "U19KU24M0149", "U19KU24M0150",
        "U19KU24M0151", "U19KU24M0152", "U19KU24M0153", "U19KU24M0154", "U19KU24M0155", "U19KU24M0157", "U19KU24M0158", "U19KU24M0160", "U19KU24M0161", "U19KU24M0162",
        "U19KU24M0163", "U19KU24M0164", "U19KU24M0165", "U19KU24M0166", "U19KU24M0167", "U19KU24M0168", "U19KU24M0170", "U19KU24M0171", "U19KU24M0172", "U19KU24M0173",
        "U19KU24M0174", "U19KU24M0175", "U19KU24M0176", "U19KU24M0177", "U19KU24M0178", "U19KU24M0179", "U19KU24M0180", "U19KU24M0181", "U19KU24M0182", "U19KU24M0183",
        "U19KU24M0184", "U19KU24M0185", "U19KU24M0186", "U19KU24M0187", "U19KU24M0188", "U19KU24M0189", "U19KU24M0190", "U19KU24M0191", "U19KU24M0192", "U19KU24M0193",
        "U19KU24M0194", "U19KU24M0195"
    ];

    console.log("Checking sections...");
    const sectionList = await db.select().from(sections);
    console.log("Sections found:", sectionList);

    const bcaC = sectionList.find(s => s.name === 'BCA C' || s.id === 'yc916nls1');
    const bbaC = sectionList.find(s => s.name === 'BBA C' || s.id === 'olwofv78i');

    console.log("BCA C:", bcaC);
    console.log("BBA C:", bbaC);

    if (!bcaC || !bbaC) {
        console.error("Missing sections! BCA C or BBA C not found.");
        return;
    }

    console.log(`Checking students in ${bcaC.name} (${bcaC.id})...`);
    const studentsInBcaC = await db.select().from(students).where(eq(students.sectionId, bcaC.id));
    console.log(`Total students in ${bcaC.name}: ${studentsInBcaC.length}`);

    const existingUsns = studentsInBcaC.map(s => s.usn);
    const found = USNS.filter(u => existingUsns.includes(u));
    const notFound = USNS.filter(u => !existingUsns.includes(u));

    console.log(`USNs from list found in ${bcaC.name}: ${found.length}`);
    if (notFound.length > 0) {
        console.log(`USNs from list NOT found in ${bcaC.name}:`, notFound);
    }

    console.log(`Checking students in ${bbaC.name} (${bbaC.id})...`);
    const studentsInBbaC = await db.select().from(students).where(eq(students.sectionId, bbaC.id));
    console.log(`Total students in ${bbaC.name}: ${studentsInBbaC.length}`);
}

verify().catch(console.error);
