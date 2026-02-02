export function calculateAttendancePercentage(present: number, late: number, absent: number): number {
    const total = present + late + absent;
    if (total === 0) return 0;

    // 3 lates = 1 absent
    // This means effective absent = absent + floor(late / 3)
    // and effective present = present + (late - floor(late / 3))

    const penalty = Math.floor(late / 3);
    const effectivePresent = present + (late - penalty);

    return Math.round((effectivePresent / total) * 100);
}
