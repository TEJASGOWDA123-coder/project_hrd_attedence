import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
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
  pushSubscription: text('push_subscription'), // JSON string of the subscription
});

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  usn: text('usn').unique().notNull(),
  name: text('name').notNull(),
  batch: text('batch'),
  year: text('year'),
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
  date: text('date'), // Optional: Specific YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(),   // HH:MM
});

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').references(() => sections.id, { onDelete: 'cascade' }),
  teacherId: text('teacher_id').references(() => teachers.id, { onDelete: 'cascade' }),
  timetableId: text('timetable_id').references(() => timetable.id, { onDelete: 'set null' }),
  date: text('date').notNull(), // YYYY-MM-DD
  status: text('status', { enum: ['present', 'absent', 'late'] }).notNull(),
  subject: text('subject'), // Assigned subject for this record
  isDraft: integer('is_draft', { mode: 'boolean' }).default(false),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
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

export const qrCodes = sqliteTable('qr_codes', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').references(() => sections.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  teacherId: text('teacher_id').references(() => teachers.id), // Optional, tracking who created it
  code: text('code').notNull().unique(), // The random token
  rotatingToken: text('rotating_token'), // Time-based token
  previousToken: text('previous_token'), // Buffer token for grace period
  tokenUpdatedAt: text('token_updated_at'), // When the token was last changed
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  latitude: real('latitude'),
  longitude: real('longitude'),
  radius: integer('radius').default(100), // Default 100 meters
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const sessionAllowedStudents = sqliteTable('session_allowed_students', {
  id: text('id').primaryKey(),
  qrCodeId: text('qr_code_id').notNull().references(() => qrCodes.id, { onDelete: 'cascade' }),
  usn: text('usn').notNull(),
});

export const sentNotifications = sqliteTable('sent_notifications', {
  id: text('id').primaryKey(),
  timetableId: text('timetable_id').notNull().references(() => timetable.id, { onDelete: 'cascade' }),
  teacherId: text('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  sentAt: text('sent_at').default(sql`CURRENT_TIMESTAMP`),
});
