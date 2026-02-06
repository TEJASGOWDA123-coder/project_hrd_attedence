export function calculateAttendancePercentage(present: number, late: number, absent: number): number {
    const total = present + late + absent;
    if (total === 0) return 0;

    // RULE: 3 lates = 1 absent
    // Effective Absents = Actual Absents + floor(late / 3)
    // Effective Presents = Total Classes - Effective Absents
    
    const penaltyAbsents = Math.floor(late / 3);
    const effectiveAbsents = absent + penaltyAbsents;
    const effectivePresent = total - effectiveAbsents;

    return Math.round((effectivePresent / total) * 100);
}
