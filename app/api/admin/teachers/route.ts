import { db } from '@/lib/db';
import { teachers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
    const data = await db.select({
        id: teachers.id,
        name: users.name,
        email: users.email,
        specialization: teachers.specialization,
        userId: users.id,
    })
        .from(teachers)
        .leftJoin(users, eq(teachers.userId, users.id));

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const { name, email, password, specialization } = await request.json();
    const userId = Math.random().toString(36).substring(2, 11);
    const teacherId = Math.random().toString(36).substring(2, 11);
    const passwordHash = await bcrypt.hash(password, 10);

    try {
        await db.insert(users).values({
            id: userId,
            name,
            email,
            role: 'teacher',
            passwordHash,
        });

        await db.insert(teachers).values({
            id: teacherId,
            userId,
            specialization,
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.id, id),
    });

    if (teacher) {
        await db.delete(users).where(eq(users.id, teacher.userId));
        // teachers table handles cascade or we delete it manually
        await db.delete(teachers).where(eq(teachers.id, id));
    }

    return NextResponse.json({ success: true });
}
export async function PATCH(request: Request) {
    const { id, name, email, password, specialization } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        const teacher = await db.query.teachers.findFirst({
            where: eq(teachers.id, id),
        });

        if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

        const updateData: any = { name, email };
        if (password && password.length > 0) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        await db.update(users)
            .set(updateData)
            .where(eq(users.id, teacher.userId));

        await db.update(teachers)
            .set({ specialization })
            .where(eq(teachers.id, id));

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
