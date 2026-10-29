import { describe, expect, it } from 'vitest';
import { relativeTime } from './time';

describe('relativeTime', () => {
  const now = new Date('2026-01-15T12:00:00Z');
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

  it('formats recent times compactly', () => {
    expect(relativeTime(ago(5), now)).toBe('just now');
    expect(relativeTime(ago(5 * 60), now)).toBe('5m ago');
    expect(relativeTime(ago(3 * 3600), now)).toBe('3h ago');
    expect(relativeTime(ago(2 * 86400), now)).toBe('2d ago');
  });

  it('treats small clock skew into the future as just now', () => {
    expect(relativeTime(ago(-3), now)).toBe('just now');
  });

  it('shows a date after a week', () => {
    expect(relativeTime(ago(30 * 86400), now)).toMatch(/2025/);
  });
});
