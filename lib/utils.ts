import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatLocalTime(utcString: string | null | undefined): string {
    if (!utcString) return 'N/A';

    // SQLite CURRENT_TIMESTAMP is "YYYY-MM-DD HH:MM:SS"
    // We append 'Z' to treat it as UTC
    const date = new Date(utcString.replace(' ', 'T') + 'Z');

    if (isNaN(date.getTime())) return utcString; // Fallback if parsing fails

    return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).toLowerCase();
}
