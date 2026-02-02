import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function run() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('Applying migrations to Turso...');

    try {
        // We add columns one by one. 
        // If they already exist, we catch the error.
        const statements = [
            "ALTER TABLE `students` ADD `usn` text", // Make it nullable first to avoid "truncate" warnings
            "ALTER TABLE `students` ADD `batch` text",
            "ALTER TABLE `students` ADD `year` text",
            "ALTER TABLE `students` ADD `phone` text",
            "ALTER TABLE `students` ADD `attendance_percentage` integer DEFAULT 0",
            "CREATE UNIQUE INDEX IF NOT EXISTS `students_usn_unique` ON `students` (`usn`)"
        ];

        for (const statement of statements) {
            try {
                console.log(`Executing: ${statement}`);
                await client.execute(statement);
            } catch (e: any) {
                if (e.message.includes('duplicate column name') || e.message.includes('already exists')) {
                    console.log('  Column already exists, skipping.');
                } else {
                    throw e;
                }
            }
        }

        console.log('Schema updated successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.close();
    }
}

run();
