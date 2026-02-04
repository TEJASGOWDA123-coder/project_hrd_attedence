import { db } from '@/lib/db';
import { qrCodes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();
        if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

        await db.update(qrCodes)
            .set({ isActive: false })
            .where(eq(qrCodes.code, code));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
