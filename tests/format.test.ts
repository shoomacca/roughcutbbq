import { describe, expect, it } from 'vitest';
import { formatCookTime } from '@/lib/calculator';

// formatCookTime behaviour.
describe('formatCookTime', () => {
  it('formats minutes only under an hour', () => {
    expect(formatCookTime(0.5)).toBe('30 min');
    expect(formatCookTime(0)).toBe('0 min');
  });
  it('formats whole hours with singular/plural', () => {
    expect(formatCookTime(1)).toBe('1 hr');
    expect(formatCookTime(2)).toBe('2 hrs');
  });
  it('formats hours and minutes', () => {
    expect(formatCookTime(1.5)).toBe('1 hr 30 min');
    expect(formatCookTime(11.55)).toBe('11 hrs 33 min');
  });
  it('rounds total minutes first so minutes never read 60', () => {
    expect(formatCookTime(1.995)).toBe('2 hrs');
    expect(formatCookTime(0.999)).toBe('1 hr');
  });
});
