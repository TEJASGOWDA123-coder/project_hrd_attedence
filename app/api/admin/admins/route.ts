import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const admins = await db.query.users.findMany({
            where: eq(users.role, 'admin'),
            columns: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            }
        });
        return NextResponse.json(admins);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const existing = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (existing) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const id = uuidv4();

        await db.insert(users).values({
            id,
            name,
            email,
            passwordHash,
            role: 'admin',
        });

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
