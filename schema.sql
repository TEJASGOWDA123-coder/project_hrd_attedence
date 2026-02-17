-- Project HRD Attendance System - Database Schema (SQLite/Turso)

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `name` TEXT NOT NULL,
    `email` TEXT NOT NULL UNIQUE,
    `role` TEXT NOT NULL CHECK (`role` IN ('admin', 'teacher')),
    `password_hash` TEXT NOT NULL,
    `created_at` TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table
CREATE TABLE IF NOT EXISTS `teachers` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `user_id` TEXT NOT NULL,
    `specialization` TEXT,
    `push_subscription` TEXT,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- Sections table
CREATE TABLE IF NOT EXISTS `sections` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `name` TEXT NOT NULL UNIQUE
);

-- Students table
CREATE TABLE IF NOT EXISTS `students` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `usn` TEXT NOT NULL UNIQUE,
    `name` TEXT NOT NULL,
    `batch` TEXT,
    `year` TEXT,
    `section_id` TEXT,
    `attendance_percentage` INTEGER DEFAULT 0,
    FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL
);

-- Timetable table
CREATE TABLE IF NOT EXISTS `timetable` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `section_id` TEXT NOT NULL,
    `teacher_id` TEXT NOT NULL,
    `subject` TEXT NOT NULL,
    `day_of_week` TEXT NOT NULL,
    `date` TEXT,
    `start_time` TEXT NOT NULL,
    `end_time` TEXT NOT NULL,
    FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
);

-- Attendance table
CREATE TABLE IF NOT EXISTS `attendance` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `student_id` TEXT NOT NULL,
    `section_id` TEXT,
    `teacher_id` TEXT,
    `timetable_id` TEXT,
    `date` TEXT NOT NULL,
    `status` TEXT NOT NULL CHECK (`status` IN ('present', 'absent', 'late')),
    `subject` TEXT,
    `is_draft` INTEGER DEFAULT 0,
    `updated_at` TEXT DEFAULT CURRENT_TIMESTAMP,
    `created_at` TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`timetable_id`) REFERENCES `timetable` (`id`) ON DELETE SET NULL,
    UNIQUE (`student_id`, `date`, `timetable_id`)
);

-- Subject Statistics table
CREATE TABLE IF NOT EXISTS `subject_stats` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `student_id` TEXT NOT NULL,
    `subject` TEXT NOT NULL,
    `present_count` INTEGER DEFAULT 0,
    `late_count` INTEGER DEFAULT 0,
    `absent_count` INTEGER DEFAULT 0,
    `total_sessions` INTEGER DEFAULT 0,
    `percentage` INTEGER DEFAULT 0,
    `updated_at` TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
);

-- QR Codes table
CREATE TABLE IF NOT EXISTS `qr_codes` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `section_id` TEXT,
    `subject` TEXT NOT NULL,
    `teacher_id` TEXT,
    `code` TEXT NOT NULL UNIQUE,
    `rotating_token` TEXT,
    `previous_token` TEXT,
    `token_updated_at` TEXT,
    `is_active` INTEGER DEFAULT 1,
    `latitude` REAL,
    `longitude` REAL,
    `radius` INTEGER DEFAULT 100,
    `created_at` TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
);

-- Session Allowed Students table (for specific USNs allowed per QR session)
CREATE TABLE IF NOT EXISTS `session_allowed_students` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `qr_code_id` TEXT NOT NULL,
    `usn` TEXT NOT NULL,
    FOREIGN KEY (`qr_code_id`) REFERENCES `qr_codes` (`id`) ON DELETE CASCADE
);

-- Sent Notifications table
CREATE TABLE IF NOT EXISTS `sent_notifications` (
    `id` TEXT PRIMARY KEY NOT NULL,
    `timetable_id` TEXT NOT NULL,
    `teacher_id` TEXT NOT NULL,
    `date` TEXT NOT NULL,
    `sent_at` TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`timetable_id`) REFERENCES `timetable` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS `idx_attendance_date` ON `attendance` (`date`);
CREATE INDEX IF NOT EXISTS `idx_attendance_student` ON `attendance` (`student_id`);
CREATE INDEX IF NOT EXISTS `idx_students_section` ON `students` (`section_id`);
CREATE INDEX IF NOT EXISTS `idx_timetable_section` ON `timetable` (`section_id`);
CREATE INDEX IF NOT EXISTS `idx_subject_stats_student` ON `subject_stats` (`student_id`);
