/**
 * Date and time formatting utilities for trace display
 */

/**
 * Format a date as relative time (e.g., "5 minutes ago")
 * Uses absolute format for dates older than today
 * @param date Date to format (Date object or ISO string)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  // Use absolute for older dates
  return formatAbsoluteTime(d);
}

/**
 * Format a date as absolute time (e.g., "Feb 9, 2:30 PM")
 * @param date Date to format (Date object or ISO string)
 * @returns Formatted absolute time string
 */
export function formatAbsoluteTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return d.toLocaleString('en-US', options);
}

/**
 * Format a timestamp for trace display
 * Uses relative time if same day, absolute otherwise
 * @param date Date to format (Date object or ISO string)
 * @returns Formatted timestamp string
 */
export function formatTraceTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Check if same day
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    return formatRelativeTime(d);
  }

  return formatAbsoluteTime(d);
}

/**
 * Truncate a string to max length with ellipsis
 * @param str String to truncate
 * @param maxLength Maximum length (default: 40)
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, maxLength = 40): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 1) + '…';
}

/**
 * Format a date as ISO string for tooltip display
 * @param date Date to format (Date object or ISO string)
 * @returns ISO 8601 formatted string
 */
export function formatISOTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}
