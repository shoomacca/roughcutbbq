import { describe, expect, it } from 'vitest';
import { calculateCook } from '@/lib/calculator';
import { parseCalculatorParams } from '@/lib/calculatorSchema';
import { addHours } from '@/lib/timeUtils';

const base = { method: 'smoker', categoryId: 'pork', cutId: 'pork_shoulder' } as const;

describe('calculator input validation', () => {
  it.each([1000, -2, NaN, 0, Infinity, 30.01])('rejects kg=%s', (kg) => {
    expect(() => calculateCook({ ...base, weightKg: kg })).toThrow();
  });
  it('accepts the bounds', () => {
    expect(() => calculateCook({ ...base, weightKg: 0.1 })).not.toThrow();
    expect(() => calculateCook({ ...base, weightKg: 30 })).not.toThrow();
  });
  it('rejects unknown cut and unsupported method', () => {
    expect(() => calculateCook({ ...base, cutId: 'nope', weightKg: 2 })).toThrow();
    expect(() => calculateCook({ ...base, method: 'dehydrator', weightKg: 2 })).toThrow();
  });
  it('URL parser rejects bad kg and accepts good input', () => {
    const q = (s: string) => new URLSearchParams(s);
    expect(parseCalculatorParams(q('method=smoker&cat=pork&cut=pork_shoulder&kg=1000'))).toBeNull();
    expect(parseCalculatorParams(q('method=smoker&cat=pork&cut=pork_shoulder&kg=abc'))).toBeNull();
    expect(parseCalculatorParams(q('method=smoker&cat=pork&cut=pork_shoulder&kg='))).toBeNull();
    expect(parseCalculatorParams(q('method=smoker&cat=pork&cut=pork_shoulder&kg=3'))?.weightKg).toBe(3);
  });
});

describe('addHours day marker', () => {
  it('has no marker on the same day', () => {
    expect(addHours('09:00', 2)).toBe('11:00 AM');
  });
  it('marks +1 day when crossing midnight', () => {
    expect(addHours('20:00', 6)).toBe('2:00 AM (+1 day)');
  });
  it('a 30 h cook started at 20:00 finishes two calendar days on', () => {
    expect(addHours('20:00', 30)).toBe('2:00 AM (+2 days)');
  });
});

describe('stall milestone', () => {
  const hasStall = (kg: number) =>
    calculateCook({ ...base, weightKg: kg }).milestones.some((m) => m.label.startsWith('Expect the stall'));
  it('is skipped on cooks under 4 h and kept on long ones', () => {
    expect(calculateCook({ ...base, weightKg: 0.1 }).cookTimeHours).toBeLessThan(4);
    expect(hasStall(0.1)).toBe(false);
    expect(hasStall(6)).toBe(true);
  });
});
