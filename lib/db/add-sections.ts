import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const sections = ['MCA A', 'MCA B'];

    console.log('Ensuring essential sections exist...');

    for (const name of sections) {
        const id = Math.random().toString(36).substring(2, 11);
        try {
            await client.execute({
                sql: "INSERT INTO sections (id, name) VALUES (?, ?)",
                args: [id, name]
            });
            console.log(`  Added section: ${name}`);
        } catch (e: any) {
            if (e.message.includes('UNIQUE constraint failed')) {
                console.log(`  Section "${name}" already exists.`);
            } else {
                console.error(`  Error adding "${name}":`, e.message);
            }
        }
    }

    client.close();
}

run();
