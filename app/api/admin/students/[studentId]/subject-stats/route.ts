import { db } from '@/lib/db';
import { subjectStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    const { studentId } = await params;

    const stats = await db.select()
        .from(subjectStats)
        .where(eq(subjectStats.studentId, studentId));

    return NextResponse.json(stats);
}
