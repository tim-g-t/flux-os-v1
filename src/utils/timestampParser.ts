/**
 * Universal timestamp parser that handles multiple date formats
 * Supports:
 * - DD/MM/YYYY, HH:MM:SS format (European format from historical data)
 * - ISO 8601 format (from live API)
 * - Standard JS Date formats
 */
export function parseTimestamp(timeStr: string | Date): Date {
  // If already a Date object, return it
  if (timeStr instanceof Date) {
    return timeStr;
  }

  // Handle DD/MM/YYYY, HH:MM:SS format
  if (typeof timeStr === 'string' && timeStr.includes(',')) {
    const [datePart, timePart] = timeStr.split(', ');
    const [day, month, year] = datePart.split('/').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    if (timePart) {
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      date.setHours(hours, minutes, seconds || 0);
    }

    return date;
  }

  // Handle ISO format and other standard formats
  const parsed = new Date(timeStr);

  // Check if the date is valid
  if (isNaN(parsed.getTime())) {
    console.error(`Failed to parse timestamp: ${timeStr}`);
    // Don't use current date - throw error to expose parsing issues
    throw new Error(`Unable to parse timestamp: ${timeStr}`);
  }

  return parsed;
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date | string, format: 'time' | 'full' | 'date' = 'full'): string {
  const parsed = typeof date === 'string' ? parseTimestamp(date) : date;

  switch (format) {
    case 'time':
      return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case 'date':
      return parsed.toLocaleDateString('en-US');
    case 'full':
    default:
      return parsed.toLocaleString('en-US');
  }
}