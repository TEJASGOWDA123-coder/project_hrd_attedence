import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['admin', 'teacher'] }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const teachers = sqliteTable('teachers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  specialization: text('specialization'),
});

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  usn: text('usn').unique().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  batch: text('batch'),
  year: text('year'),
  phone: text('phone'),
  sectionId: text('section_id').references(() => sections.id, { onDelete: 'set null' }),
  attendancePercentage: integer('attendance_percentage').default(0),
});

export const sections = sqliteTable('sections', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const timetable = sqliteTable('timetable', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  teacherId: text('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  dayOfWeek: text('day_of_week').notNull(), // 'Monday', 'Tuesday', etc.
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(),   // HH:MM
});

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  teacherId: text('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  status: text('status', { enum: ['present', 'absent', 'late'] }).notNull(),
  subject: text('subject'), // Assigned subject for this record
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const subjectStats = sqliteTable('subject_stats', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  presentCount: integer('present_count').default(0),
  lateCount: integer('late_count').default(0),
  absentCount: integer('absent_count').default(0),
  totalSessions: integer('total_sessions').default(0),
  percentage: integer('percentage').default(0),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
