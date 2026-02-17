import cron from 'node-cron';
import { db } from '@/lib/db';
import { timetable, teachers, users, sentNotifications } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
// @ts-ignore
import webpush from 'web-push';
import { v4 as uuidv4 } from 'uuid';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function initCron() {
    // Only run on server
    if (typeof window !== 'undefined') return;

    console.log('Initializing cron job: Reminders check every minute');

    // Check every minute
    cron.schedule('* * * * *', async () => {
        // Use a more robust IST time calculation
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const nowIST = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
        
        const dateStr = nowIST.toISOString().split('T')[0];
        const currentTimeStr = `${nowIST.getHours().toString().padStart(2, '0')}:${nowIST.getMinutes().toString().padStart(2, '0')}`;
        const dayName = days[nowIST.getDay()];

        console.log(`Cron Tick: ${dateStr} ${currentTimeStr} (${dayName})`);

        // 1. AUTO-FINALIZATION
        try {
            // Use relative paths to be safer with dynamic imports in cron context
            const { attendance, timetable, users, teachers } = await import('./db/schema');
            const { recalculateStudentStats } = await import('./attendance-utils');
            const { sendEmail } = await import('./email');

            // --- 1a. Proactive 5-Minute Reminder ---
            const reminderTime = new Date(nowIST.getTime() + 5 * 60000);
            const reminderTimeStr = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;

            console.log(`Checking for classes ending at ${reminderTimeStr} for reminders...`);
            
            const classesEndingSoon = await db.select()
                .from(timetable)
                .where(and(
                    eq(timetable.dayOfWeek, dayName),
                    eq(timetable.endTime, reminderTimeStr)
                ));

            for (const cls of classesEndingSoon) {
                const drafts = await db.select()
                    .from(attendance)
                    .where(and(
                        eq(attendance.timetableId, cls.id),
                        eq(attendance.date, dateStr),
                        eq(attendance.isDraft, true)
                    ));

                if (drafts.length > 0) {
                    console.log(`Found ${drafts.length} drafts for session ${cls.subject} ending soon. Sending reminder.`);
                    const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, cls.teacherId) });
                    const teacherUser = teacher ? await db.query.users.findFirst({ where: eq(users.id, teacher.userId) }) : null;

                    if (teacherUser && teacherUser.email) {
                        await sendEmail({
                            to: teacherUser.email,
                            subject: 'Reminder: 5 minutes left to submit attendance',
                            text: `Hello ${teacherUser.name}, your ${cls.subject} session is ending in 5 minutes. Please submit your attendance or it will be auto-submitted.`,
                            html: `<p>Hello <b>${teacherUser.name}</b>,</p><p>There is only <b>5 minutes left</b> to submit the attendance for your <b>${cls.subject}</b> session. Please submit it now or it will be <b>auto-submitted</b> when the session ends.</p>`
                        });
                    }
                }
            }

            // --- 1b. Auto-Finalization ---
            console.log(`Checking for classes that ended by ${currentTimeStr} to auto-finalize...`);
            
            const recentlyEndedClasses = await db.select()
                .from(timetable)
                .where(and(
                    eq(timetable.dayOfWeek, dayName),
                    sql`${timetable.endTime} <= ${currentTimeStr}`
                ));

            console.log(`Found ${recentlyEndedClasses.length} sessions that have ended today.`);

            for (const cls of recentlyEndedClasses) {
                const drafts = await db.select()
                    .from(attendance)
                    .where(and(
                        eq(attendance.timetableId, cls.id),
                        eq(attendance.date, dateStr),
                        eq(attendance.isDraft, true)
                    ));

                if (drafts.length > 0) {
                    try {
                        console.log(`Auto-finalizing ${drafts.length} records for session ${cls.subject} (${cls.id})`);
                        
                        await db.update(attendance)
                            .set({ isDraft: false, updatedAt: sql`CURRENT_TIMESTAMP` })
                            .where(and(
                                eq(attendance.timetableId, cls.id),
                                eq(attendance.date, dateStr)
                            ));

                        for (const draft of drafts) {
                            await recalculateStudentStats(draft.studentId, cls.subject);
                        }

                        const teacher = await db.query.teachers.findFirst({ where: eq(teachers.id, cls.teacherId) });
                        const teacherUser = teacher ? await db.query.users.findFirst({ where: eq(users.id, teacher.userId) }) : null;

                        if (teacherUser && teacherUser.email) {
                            await sendEmail({
                                to: teacherUser.email,
                                subject: 'Attendance is submitted',
                                text: `Hello ${teacherUser.name}, your attendance for ${cls.subject} has been auto-submitted successfully.`,
                                html: `<p>Hello <b>${teacherUser.name}</b>,</p><p>Your attendance for <b>${cls.subject}</b> has been <b>auto-submitted successfully</b> as the session has ended.</p>`
                            });
                        }
                    } catch (finalizationErr) {
                        console.error(`Auto-submit failed for session ${cls.id}:`, finalizationErr);
                        // ... fail email logic ...
                    }
                }
            }
        } catch (err) {
            console.error('Error in auto-finalization cron:', err);
        }

        // 2. REMINDERS: (Old logic)
        if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            console.error('VAPID keys not set');
            return;
        }

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        // We look for classes starting between 9 and 11 minutes from now
        const targetMin = new Date(nowIST.getTime() + 9 * 60000);
        const targetMax = new Date(nowIST.getTime() + 11 * 60000);

        const formatTime = (d: Date) => {
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };

        // (Variable reuse from earlier in the function)

        try {
            // Find upcoming classes
            // We'll broaden the search to any class on this day, then filter by time in-memory for precision
            const upcomingClasses = await db.select()
                .from(timetable)
                .where(eq(timetable.dayOfWeek, dayName));

            const filteredClasses = upcomingClasses.filter(cls => {
                // Check if specific date matches if it exists
                if (cls.date && cls.date !== dateStr) return false;

                // Check if start time is within our window
                const [h, m] = cls.startTime.split(':').map(Number);
                const classStartTime = new Date(targetMin);
                classStartTime.setHours(h, m, 0, 0);

                return classStartTime >= targetMin && classStartTime <= targetMax;
            });

            if (filteredClasses.length > 0) {
                for (const cls of filteredClasses) {
                    // Check if already sent
                    const alreadySent = await db.query.sentNotifications.findFirst({
                        where: and(
                            eq(sentNotifications.timetableId, cls.id),
                            eq(sentNotifications.date, dateStr)
                        )
                    });

                    if (alreadySent) continue;

                    const teacher = await db.query.teachers.findFirst({
                        where: eq(teachers.id, cls.teacherId),
                    });

                    if (teacher) {
                        // Push Notification
                        if (teacher.pushSubscription) {
                            try {
                                const subscription = JSON.parse(teacher.pushSubscription);
                                const payload = JSON.stringify({
                                    title: 'Upcoming Class Reminder',
                                    body: `Your ${cls.subject} class starts in 10 minutes (${cls.startTime}).`,
                                });

                                await webpush.sendNotification(subscription, payload);
                                console.log(`Push notification sent for class ${cls.subject} at ${cls.startTime}`);
                            } catch (error) {
                                console.error(`Error sending push notification for class ${cls.id}:`, error);
                            }
                        }

                        // Email Notification
                        const teacherUser = await db.query.users.findFirst({
                            where: eq(users.id, teacher.userId)
                        });

                        if (teacherUser && teacherUser.email) {
                            try {
                                const { sendEmail } = await import('@/lib/email');
                                await sendEmail({
                                    to: teacherUser.email,
                                    subject: `⏰ Reminder: ${cls.subject} starts in 10 minutes`,
                                    text: `Hello ${teacherUser.name}, your ${cls.subject} class is scheduled to start at ${cls.startTime} today.`,
                                    html: `<p>Hello <b>${teacherUser.name}</b>,</p><p>Your <b>${cls.subject}</b> class is scheduled to start at <b>${cls.startTime}</b> today.</p>`
                                });
                                console.log(`Email reminder sent to ${teacherUser.email}`);
                            } catch (error) {
                                console.error(`Error sending email notification for class ${cls.id}:`, error);
                            }
                        }

                        // Log as sent
                        await db.insert(sentNotifications).values({
                            id: uuidv4(),
                            timetableId: cls.id,
                            teacherId: teacher.id,
                            date: dateStr,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
}
