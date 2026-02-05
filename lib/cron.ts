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
        if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            console.error('VAPID keys not set');
            return;
        }

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        // Get current time in IST (India Standard Time)
        // Since the server might be in a different timezone, we force IST.
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

        // We look for classes starting between 9 and 11 minutes from now
        // This gives us a 2-minute window to catch it, but we'll use sent_notifications to avoid double sends.
        const targetMin = new Date(nowIST.getTime() + 9 * 60000);
        const targetMax = new Date(nowIST.getTime() + 11 * 60000);

        const formatTime = (d: Date) => {
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };

        const dayName = days[targetMin.getDay()];
        const dateStr = targetMin.toISOString().split('T')[0];

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
