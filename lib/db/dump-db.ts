import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function run() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const output: any = {};

    try {
        const sec = await client.execute('SELECT * FROM sections');
        output.sections = sec.rows;

        const stuCols = await client.execute('PRAGMA table_info(students)');
        output.studentColumns = stuCols.rows;

        fs.writeFileSync('db_dump.json', JSON.stringify(output, null, 2));
        console.log('Dump complete');
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}

run();
