import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { login } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    const { email, password } = await request.json();

    console.log(`Login attempt for: ${email}`);
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        console.log('User not found in DB');
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await login({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
    });

    return NextResponse.json({ success: true, role: user.role });
}
