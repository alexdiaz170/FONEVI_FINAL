import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, cn } from './utils';

describe('formatCurrency', () => {
  it('should format a number as COP currency', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1.000.000');
    expect(result.startsWith('$')).toBe(true);
  });

  it('should return $0 for null', () => {
    expect(formatCurrency(null)).toBe('$0');
  });

  it('should return $0 for undefined', () => {
    expect(formatCurrency(undefined)).toBe('$0');
  });

  it('should return $0 for NaN', () => {
    expect(formatCurrency(NaN)).toBe('$0');
  });

  it('should format zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result.startsWith('$')).toBe(true);
  });

  it('should format small amounts', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1.500');
    expect(result.startsWith('$')).toBe(true);
  });
});

describe('formatDate', () => {
  it('should format a Date object as DD/MM/YYYY', () => {
    const date = new Date(Date.UTC(2026, 5, 19));
    expect(formatDate(date)).toBe('19/06/2026');
  });

  it('should format an ISO string', () => {
    expect(formatDate('2026-06-19T00:00:00.000Z')).toBe('19/06/2026');
  });

  it('should return em dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('should return em dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('should return em dash for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });

  it('should handle undefined and null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });
});
