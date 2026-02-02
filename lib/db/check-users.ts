import { db } from './index';
import { users } from './schema';

async function checkUsers() {
    const allUsers = await db.select().from(users);
    allUsers.forEach(u => {
        console.log(`Email: [${u.email}] Role: [${u.role}]`);
    });
}

checkUsers().catch(console.error);
