import cron from 'node-cron';
import { db } from '@/lib/db';
import { timetable, teachers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
// @ts-ignore
import webpush from 'web-push';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function initCron() {
    // Only run on server
    if (typeof window !== 'undefined') return;

    // Check every minute
    cron.schedule('* * * * *', async () => {
        // console.log('Running cron job: Checking for upcoming classes...');

        if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            console.error('VAPID keys not set');
            return;
        }

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        const now = new Date();
        const tenMinutesLater = new Date(now.getTime() + 10 * 60000); // 10 minutes from now

        const dayName = days[tenMinutesLater.getDay()];
        // Format time as HH:MM
        const hours = tenMinutesLater.getHours().toString().padStart(2, '0');
        const minutes = tenMinutesLater.getMinutes().toString().padStart(2, '0');
        const targetTime = `${hours}:${minutes}`;

        // Format date as YYYY-MM-DD
        const year = tenMinutesLater.getFullYear();
        const month = (tenMinutesLater.getMonth() + 1).toString().padStart(2, '0');
        const day = tenMinutesLater.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // console.log(`Checking for classes on ${dayName} at ${targetTime}`);

        try {
             // Find classes starting at targetTime on dayName
             // Must match dayOfWeek AND (date IS NULL OR date = dateStr)
             // Actually, if date IS NOT NULL, dayOfWeek should match automatically if data is correct, 
             // but we must check date to avoid triggering "next week's" specific date.
             
            const upcomingClasses = await db.select({
                subject: timetable.subject,
                startTime: timetable.startTime,
                teacherId: timetable.teacherId,
                date: timetable.date,
            })
            .from(timetable)
            .where(and(
                eq(timetable.startTime, targetTime),
                eq(timetable.dayOfWeek, dayName) // Optimization: narrow down by day first
            ));

            // In-memory filter for date logic (because OR condition with IS NULL in simple Drizzle query can be verbose, 
            // and we already filtered significantly by time and day).
            const filteredClasses = upcomingClasses.filter(cls => {
                if (cls.date) {
                    return cls.date === dateStr;
                }
                return true; // Recurring class (date is null)
            });

            if (filteredClasses.length > 0) {
                console.log(`Found ${filteredClasses.length} upcoming classes at ${targetTime}.`);

                for (const cls of filteredClasses) {
                    const teacher = await db.query.teachers.findFirst({
                         where: eq(teachers.id, cls.teacherId),
                    });

                    if (teacher && teacher.pushSubscription) {
                        try {
                            const subscription = JSON.parse(teacher.pushSubscription);
                            const payload = JSON.stringify({
                                title: 'Upcoming Class Reminder',
                                body: `You have a class (${cls.subject}) starting in 10 minutes at ${cls.startTime}.`,
                            });

                            await webpush.sendNotification(subscription, payload);
                            console.log(`Notification sent to teacher ${cls.teacherId}`);
                        } catch (error) {
                            console.error(`Error sending notification to teacher ${cls.teacherId}:`, error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
}
