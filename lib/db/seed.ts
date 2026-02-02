import { db } from './index';
import { users, teachers, students, sections } from './schema';
import bcrypt from 'bcryptjs';
// Simple uuid-like string generator
const id = () => Math.random().toString(36).substring(2, 11);

async function seed() {
    console.log('Seeding database...');

    // Create Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminId = id();
    await db.insert(users).values({
        id: adminId,
        name: 'Main Admin',
        email: 'admin@example.com',
        role: 'admin',
        passwordHash: adminPassword,
    });

    // Create Sections
    const sectionA = id();
    const sectionB = id();
    await db.insert(sections).values([
        { id: sectionA, name: 'Grade 10-A' },
        { id: sectionB, name: 'Grade 10-B' },
    ]);

    // Create Teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacherUserId = id();
    const teacherId = id();
    await db.insert(users).values({
        id: teacherUserId,
        name: 'John Doe',
        email: 'teacher@example.com',
        role: 'teacher',
        passwordHash: teacherPassword,
    });
    await db.insert(teachers).values({
        id: teacherId,
        userId: teacherUserId,
        specialization: 'Mathematics',
    });

    // Create Students
    await db.insert(students).values([
        { id: id(), usn: 'STU001', name: 'Alice Smith', email: 'alice@example.com', sectionId: sectionA, batch: '2024-2026', year: '1', phone: '1234567890' },
        { id: id(), usn: 'STU002', name: 'Bob Johnson', email: 'bob@example.com', sectionId: sectionA, batch: '2024-2026', year: '1', phone: '1234567891' },
        { id: id(), usn: 'STU003', name: 'Charlie Brown', email: 'charlie@example.com', sectionId: sectionB, batch: '2024-2026', year: '1', phone: '1234567892' },
    ]);

    console.log('Seed completed!');
}

seed().catch(console.error);
