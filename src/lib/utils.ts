import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a new Date object representing the current time in Indian Standard Time (IST).
 * Useful when you need to store the current date/time relative to IST.
 */
export function getISTDate(): Date {
  const date = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  // Convert current date to UTC by adding its own offset, then add IST offset
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + istOffset);
}

/**
 * Formats a Date object or date string into an IST formatted string.
 * Uses native Intl.DateTimeFormat for accurate timezone conversion.
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date string in IST
 */
export function formatISTDate(
  date: Date | string | number, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    ...options,
    timeZone: 'Asia/Kolkata'
  }).format(d);
}
