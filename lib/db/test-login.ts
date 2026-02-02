import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function testLogin() {
    const email = 'admin@example.com';
    const password = 'admin123';

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password match for ${email}: ${isMatch}`);
}

testLogin().catch(console.error);
