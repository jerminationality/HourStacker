import { parse } from 'date-fns';
import type { Shift } from '@/lib/types';

const DATE_ONLY_FORMAT = 'yyyy-MM-dd';

// Build start and end Date objects from a base date (date only) and HH:mm times.
// If end time is less than or equal to start time, we treat it as crossing midnight (next day).
export function buildDateRange(baseDate: Date, startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some(n => Number.isNaN(n))) {
    throw new Error('Invalid time format');
  }
  const start = new Date(baseDate);
  start.setHours(sh ?? 0, sm ?? 0, 0, 0);
  const end = new Date(baseDate);
  end.setHours(eh ?? 0, em ?? 0, 0, 0);
  if (end <= start) {
    // Overnight shift – add one day to end
    end.setDate(end.getDate() + 1);
  }
  return { start, end };
}

export function buildDateRangeFromShift(shift: Shift) {
  const date = parse(shift.date, DATE_ONLY_FORMAT, new Date());
  return buildDateRange(date, shift.startTime, shift.endTime);
}

export function shiftsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date, allowTouchingEdges = true) {
  if (allowTouchingEdges) {
    // Allow edges that touch exactly (aEnd == bStart or bEnd == aStart)
    return aStart < bEnd && aEnd > bStart;
  }
  return aStart <= bEnd && aEnd >= bStart;
}
