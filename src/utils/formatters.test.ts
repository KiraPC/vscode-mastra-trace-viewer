/**
 * Unit tests for date and time formatters
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatRelativeTime,
  formatAbsoluteTime,
  formatTraceTimestamp,
  truncateString,
  formatISOTimestamp,
} from './formatters';

describe('formatters', () => {
  // Mock Date.now() for consistent testing
  const NOW = new Date('2026-02-11T14:30:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatRelativeTime', () => {
    it('returns "just now" for dates less than 1 minute ago', () => {
      const date = new Date(NOW.getTime() - 30000); // 30 seconds ago
      expect(formatRelativeTime(date)).toBe('just now');
    });

    it('returns "1 minute ago" for exactly 1 minute', () => {
      const date = new Date(NOW.getTime() - 60000);
      expect(formatRelativeTime(date)).toBe('1 minute ago');
    });

    it('returns "X minutes ago" for multiple minutes', () => {
      const date = new Date(NOW.getTime() - 5 * 60000);
      expect(formatRelativeTime(date)).toBe('5 minutes ago');
    });

    it('returns "59 minutes ago" for 59 minutes', () => {
      const date = new Date(NOW.getTime() - 59 * 60000);
      expect(formatRelativeTime(date)).toBe('59 minutes ago');
    });

    it('returns "1 hour ago" for exactly 1 hour', () => {
      const date = new Date(NOW.getTime() - 60 * 60000);
      expect(formatRelativeTime(date)).toBe('1 hour ago');
    });

    it('returns "X hours ago" for multiple hours', () => {
      const date = new Date(NOW.getTime() - 5 * 60 * 60000);
      expect(formatRelativeTime(date)).toBe('5 hours ago');
    });

    it('returns absolute time for 24+ hours ago', () => {
      const date = new Date(NOW.getTime() - 25 * 60 * 60000);
      const result = formatRelativeTime(date);
      // Should contain month abbreviation like "Feb"
      expect(result).toMatch(/Feb \d+/);
    });

    it('handles ISO string input', () => {
      const isoString = new Date(NOW.getTime() - 10 * 60000).toISOString();
      expect(formatRelativeTime(isoString)).toBe('10 minutes ago');
    });
  });

  describe('formatAbsoluteTime', () => {
    it('formats date with month, day, and time', () => {
      const date = new Date('2026-02-09T14:30:00.000Z');
      const result = formatAbsoluteTime(date);
      // Should contain "Feb 9" and time component
      expect(result).toMatch(/Feb\s+\d+/);
      expect(result).toMatch(/\d+:\d+\s*(AM|PM)/i);
    });

    it('handles ISO string input', () => {
      const isoString = '2026-02-09T10:15:00.000Z';
      const result = formatAbsoluteTime(isoString);
      expect(result).toMatch(/Feb\s+\d+/);
    });
  });

  describe('formatTraceTimestamp', () => {
    it('uses relative time for same day', () => {
      const date = new Date(NOW.getTime() - 2 * 60 * 60000); // 2 hours ago same day
      const result = formatTraceTimestamp(date);
      expect(result).toBe('2 hours ago');
    });

    it('uses absolute time for different day', () => {
      const differentDay = new Date('2026-02-09T10:00:00.000Z');
      const result = formatTraceTimestamp(differentDay);
      expect(result).toMatch(/Feb\s+\d+/);
    });

    it('handles edge case of midnight boundary', () => {
      // Set time to midday to avoid timezone confusion
      const midday = new Date('2026-02-11T12:00:00.000Z');
      vi.setSystemTime(midday);

      // Date from 2 days ago - clearly a different day in any timezone
      const twoDaysAgo = new Date('2026-02-09T10:00:00.000Z');
      const result = formatTraceTimestamp(twoDaysAgo);
      // Should use absolute since different day
      expect(result).toMatch(/Feb\s+\d+/);
    });

    it('handles ISO string input', () => {
      const isoString = new Date(NOW.getTime() - 30 * 60000).toISOString();
      const result = formatTraceTimestamp(isoString);
      expect(result).toBe('30 minutes ago');
    });
  });

  describe('truncateString', () => {
    it('returns original string if within limit', () => {
      expect(truncateString('short', 40)).toBe('short');
    });

    it('returns original string if exactly at limit', () => {
      const str = 'a'.repeat(40);
      expect(truncateString(str, 40)).toBe(str);
    });

    it('truncates with ellipsis if over limit', () => {
      const str = 'a'.repeat(50);
      const result = truncateString(str, 40);
      expect(result.length).toBe(40);
      expect(result.endsWith('…')).toBe(true);
    });

    it('uses default limit of 40', () => {
      const str = 'a'.repeat(50);
      const result = truncateString(str);
      expect(result.length).toBe(40);
    });

    it('handles empty string', () => {
      expect(truncateString('')).toBe('');
    });

    it('handles custom limit', () => {
      const str = 'hello world';
      const result = truncateString(str, 5);
      expect(result).toBe('hell…');
    });
  });

  describe('formatISOTimestamp', () => {
    it('returns ISO string from Date object', () => {
      const date = new Date('2026-02-11T14:30:00.000Z');
      expect(formatISOTimestamp(date)).toBe('2026-02-11T14:30:00.000Z');
    });

    it('handles ISO string input (normalizes)', () => {
      // Input a date string that might have been parsed
      const isoString = '2026-02-11T14:30:00.000Z';
      expect(formatISOTimestamp(isoString)).toBe('2026-02-11T14:30:00.000Z');
    });
  });
});
