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

export async function PATCH(request: Request) {
    try {
        const { id, name, email, password } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password && password.trim() !== '') {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        await db.update(users)
            .set(updateData)
            .where(eq(users.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
        }

        // Optional: Check if it's the last admin
        const adminCount = await db.query.users.findMany({
            where: eq(users.role, 'admin'),
        });

        if (adminCount.length <= 1) {
            return NextResponse.json({ error: 'Cannot delete the last administrator' }, { status: 400 });
        }

        await db.delete(users).where(eq(users.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
