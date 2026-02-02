ALTER TABLE `students` ADD `usn` text NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `batch` text;--> statement-breakpoint
ALTER TABLE `students` ADD `year` text;--> statement-breakpoint
ALTER TABLE `students` ADD `phone` text;--> statement-breakpoint
CREATE UNIQUE INDEX `students_usn_unique` ON `students` (`usn`);