import { db } from './index';
import { users, teachers, students, sections, timetable, attendance } from './schema';
import { sql } from 'drizzle-orm';

async function reset() {
    console.log('Clearing database...');
    await db.delete(attendance);
    await db.delete(timetable);
    await db.delete(students);
    await db.delete(teachers);
    await db.delete(sections);
    await db.delete(users);
    console.log('Database cleared!');
}

reset().catch(console.error);
