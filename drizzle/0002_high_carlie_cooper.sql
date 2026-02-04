PRAGMA foreign_keys=OFF;
CREATE TABLE `__new_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`section_id` text NOT NULL,
	`teacher_id` text,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`subject` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `__new_attendance`("id", "student_id", "section_id", "teacher_id", "date", "status", "subject", "created_at") SELECT "id", "student_id", "section_id", "teacher_id", "date", "status", "subject", "created_at" FROM `attendance`;
DROP TABLE `attendance`;
ALTER TABLE `__new_attendance` RENAME TO `attendance`;
PRAGMA foreign_keys=ON;