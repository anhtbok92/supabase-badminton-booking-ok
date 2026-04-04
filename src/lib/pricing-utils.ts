import { getDay } from 'date-fns';
import type { Club } from '@/lib/types';

/**
 * Calculates the price for a single 30-minute time slot based on club pricing.
 */
export function getPriceForSlot(time: string, date: Date, pricing?: Club['pricing']): number {
    if (!pricing) return 0;
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const relevantTiers = isWeekend ? pricing.weekend : pricing.weekday;

    if (!relevantTiers) return 0;

    const [h, m] = time.split(':').map(Number);
    const slotValue = h * 60 + m;

    for (const tier of relevantTiers) {
        if (!tier.timeRange || tier.timeRange.length < 2) continue;

        const [sh, sm] = tier.timeRange[0].split(':').map(Number);
        const startValue = sh * 60 + sm;

        const [eh, em] = tier.timeRange[1].split(':').map(Number);
        let endValue = eh * 60 + em;

        if (eh === 24 || (eh === 0 && endValue <= startValue)) {
            endValue = 1440;
        }

        if (slotValue >= startValue && slotValue < endValue) {
            return tier.price;
        }
    }
    return 0;
}

/**
 * Calculates total price for a range of time slots.
 */
export function calculateRangePrice(startTime: string, endTime: string, dayOfWeek: number, pricing?: Club['pricing']): number {
    if (!pricing) return 0;
    
    // We'll use an arbitrary date that matches the dayOfWeek to reuse getPriceForSlot
    // dayOfWeek 1 = Mon, ... 0 = Sun
    // Current date might be different day of week, so we adjust
    const tempDate = new Date();
    const currentDay = getDay(tempDate);
    tempDate.setDate(tempDate.getDate() + (dayOfWeek - currentDay + 7) % 7);
    
    // Generate all 30-min slots in range
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    
    let total = 0;
    let currH = sh;
    let currM = sm;
    
    while (currH < eh || (currH === eh && currM < em)) {
        const timeStr = `${String(currH).padStart(2, '0')}:${String(currM).padStart(2, '0')}`;
        total += getPriceForSlot(timeStr, tempDate, pricing);
        
        currM += 30;
        if (currM >= 60) {
            currH += 1;
            currM = 0;
        }
    }
    
    return total;
}

/**
 * Formats a number as VND currency.
 */
export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}

/**
 * Adds minutes to a 'HH:mm' time string.
 */
export function addMinutesToTime(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minutes, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
