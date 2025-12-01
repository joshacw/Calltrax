import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Convert a UTC date to the tenant's local timezone
 */
export function toTenantTime(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(date, timezone);
}

/**
 * Convert a local date in tenant's timezone to UTC for database queries
 */
export function toUTC(localDate: Date, timezone: string): Date {
  return fromZonedTime(localDate, timezone);
}

/**
 * Format a UTC date in the tenant's local timezone
 */
export function formatInTenantTime(
  utcDate: Date | string,
  timezone: string,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Get start of day in tenant's timezone, returned as UTC for queries
 */
export function getStartOfDayUTC(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const startOfDayLocal = startOfDay(zonedDate);
  return fromZonedTime(startOfDayLocal, timezone);
}

/**
 * Get end of day in tenant's timezone, returned as UTC for queries
 */
export function getEndOfDayUTC(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const endOfDayLocal = endOfDay(zonedDate);
  return fromZonedTime(endOfDayLocal, timezone);
}

/**
 * Get date range for a preset in tenant's timezone
 */
export function getDateRangeForTenant(
  preset: string,
  timezone: string,
  customRange?: { from: Date; to: Date }
): { start: Date; end: Date } {
  const now = new Date();
  const nowInTenantTz = toZonedTime(now, timezone);

  let startLocal: Date;
  let endLocal: Date = endOfDay(nowInTenantTz);

  switch (preset) {
    case 'today':
      startLocal = startOfDay(nowInTenantTz);
      break;
    case '7days':
      startLocal = startOfDay(new Date(nowInTenantTz.getTime() - 7 * 24 * 60 * 60 * 1000));
      break;
    case '30days':
      startLocal = startOfDay(new Date(nowInTenantTz.getTime() - 30 * 24 * 60 * 60 * 1000));
      break;
    case '90days':
      startLocal = startOfDay(new Date(nowInTenantTz.getTime() - 90 * 24 * 60 * 60 * 1000));
      break;
    case 'custom':
      if (customRange?.from && customRange?.to) {
        startLocal = startOfDay(toZonedTime(customRange.from, timezone));
        endLocal = endOfDay(toZonedTime(customRange.to, timezone));
      } else {
        startLocal = startOfDay(new Date(nowInTenantTz.getTime() - 30 * 24 * 60 * 60 * 1000));
      }
      break;
    default:
      startLocal = startOfDay(new Date(nowInTenantTz.getTime() - 30 * 24 * 60 * 60 * 1000));
  }

  // Convert back to UTC for database queries
  return {
    start: fromZonedTime(startLocal, timezone),
    end: fromZonedTime(endLocal, timezone)
  };
}

/**
 * Get the local date string for a UTC timestamp in tenant's timezone
 * Used for grouping data by day
 */
export function getLocalDateKey(utcDate: Date | string, timezone: string): string {
  return formatInTimeZone(
    typeof utcDate === 'string' ? parseISO(utcDate) : utcDate,
    timezone,
    'yyyy-MM-dd'
  );
}
