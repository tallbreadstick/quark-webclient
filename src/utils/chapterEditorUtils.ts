import type { Item } from "../types/ChapterEditorTypes";

/**
 * Assign UI serial ids to items (separate counters for lessons and activities)
 * E.g., L1, L2, A1, A2, L3, etc.
 */
export function assignUiSerials(items: Item[]): Item[] {
    let lessonCounter = 1;
    let activityCounter = 1;
    return items.map(it => {
        const uiSerialId = it.itemType === 'LESSON' ? `L${lessonCounter++}` : `A${activityCounter++}`;
        return { ...it, uiSerialId };
    });
}

/**
 * Parse time limit (in seconds) into hours, minutes, and seconds components
 */
export function parseTimeLimitParts(timeLimit?: number | null): { hours: number; minutes: number; seconds: number } {
    const total = timeLimit ? Number(timeLimit) : 0;
    return {
        hours: Math.floor((total || 0) / 3600),
        minutes: Math.floor(((total || 0) % 3600) / 60),
        seconds: (total || 0) % 60
    };
}

/**
 * Convert hours, minutes, and seconds into total seconds
 * Returns undefined if all parts are zero
 */
export function convertToTotalSeconds(hours: number, minutes: number, seconds: number): number | undefined {
    const totalSec = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
    return totalSec > 0 ? totalSec : undefined;
}

/**
 * Format a date object to YYYY-MM-DD string
 */
export function formatDateToInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

/**
 * Format a date object to HH:MM string
 */
export function formatTimeToInput(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Parse ruleset JSON string or object, with fallback to default
 */
export function parseRuleset(ruleset?: string | object | null): Record<string, any> {
    if (!ruleset) return { enabled: true };
    try {
        return typeof ruleset === 'string' ? JSON.parse(ruleset) : ruleset;
    } catch {
        return { enabled: true };
    }
}

/**
 * Validate and clamp percentage value (0-100)
 */
export function validatePercentage(value: number): number {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
}
