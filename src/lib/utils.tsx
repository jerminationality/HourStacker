
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse, format as formatDateFns } from 'date-fns';
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHours(hours: number, format: 'decimal' | 'hhmm' | 'both', isHeader: boolean): string | React.ReactNode {
  const sizeClass = isHeader ? 'text-xl' : 'text-3xl';
  const smallSizeClass = isHeader ? 'text-lg' : 'text-2xl';

  if (format === 'decimal') {
    if (isHeader) {
        return (
          <div className={sizeClass}>
            {hours.toFixed(2)}
            <span className="ml-1.5 text-base font-normal text-muted-foreground"> Total Hours</span>
          </div>
        );
    }
    return (
        <span className={sizeClass}>{hours.toFixed(2)}</span>
    );
  }
  
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  // HH:MM format
  const hhmmFormat = `${h}:${m.toString().padStart(2, '0')}`;

  if (format === 'hhmm') {
    return <span className={sizeClass}>{hhmmFormat}</span>;
  }
  
  // 'both' - decimal bold, HH:MM regular weight in parentheses
  return (
    <>
      <span className={sizeClass}>{hours.toFixed(2)}</span>
      <span className={`${sizeClass} font-normal text-muted-foreground`}> ({hhmmFormat})</span>
    </>
  );
}

export const HeaderContext = React.createContext(false);

export function roundToQuarterHour(hours: number): number {
  // Always round UP to the next 1/4 hour increment
  return Math.ceil(hours / 0.25) * 0.25;
}

export function maybeRoundHours(hours: number, round: boolean): number {
  return round ? roundToQuarterHour(hours) : hours;
}

export function formatHoursForExport(hours: number, indent: number = 0, singleLine: boolean = false): string {
    const spaces = ' '.repeat(indent);
    const decimalSuffix = singleLine ? 'hours' : 'Total Hours';
    const decimalPart = `${hours.toFixed(2)} ${decimalSuffix}`;

    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    let descriptiveFormat = '';
    if (h > 0) {
        descriptiveFormat += `${h} ${h > 1 ? 'hours' : 'hour'}`;
        if (m > 0) {
          descriptiveFormat += `, ${m} ${m === 1 ? 'minute' : 'minutes'}`;
        }
    } else {
        descriptiveFormat = `${m} ${m === 1 ? 'minute' : 'minutes'}`;
    }
    
    if (singleLine) {
        return `${spaces}${decimalPart} (${descriptiveFormat})`;
    }
    
    return `${spaces}${decimalPart}\n${spaces}(${descriptiveFormat})`;
}


export function formatTime(timeString: string, format: '12h' | '24h'): string {
    try {
        const date = parse(timeString, 'HH:mm', new Date());
        if (format === '12h') {
            return formatDateFns(date, 'h:mm a');
        }
        return timeString; // Already in HH:mm
    } catch (e) {
        return timeString; // Fallback for invalid time string
    }
}

// Parse a time string like 'H:mm' or 'HH:mm' to minutes since midnight. Invalid => MAX_SAFE_INTEGER.
export function minutesFromTime(timeString: string): number {
  if (!timeString || typeof timeString !== 'string') return Number.MAX_SAFE_INTEGER;
  // Accept either H:mm or HH:mm (00-23 hours)
  const m = timeString.match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h * 60 + min;
}

// Determine if a shift crosses midnight based purely on its start/end HH:mm strings.
export function isOvernight(startTime: string, endTime: string): boolean {
  // Consider overnight only if end is strictly earlier than start (crosses midnight)
  // This avoids false positives when start and end are identical (00:00 == 00:00, etc.)
  return endTime < startTime;
}

// Produce a human-readable time range; adds (+1) to indicate next-day end for overnight shifts.
export function formatShiftRange(startTime: string, endTime: string, format: '12h' | '24h') {
  const overnight = isOvernight(startTime, endTime);
  const start = formatTime(startTime, format);
  const end = formatTime(endTime, format);
  return overnight ? `${start} – ${end} (+1)` : `${start} – ${end}`;
}
