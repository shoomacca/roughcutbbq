import { describe, expect, it } from 'vitest';
import { glideDuration, nearestPoint, nextPoint, releaseVelocity, wheelPixels } from '@/lib/dragScrollMath';

describe('dragScrollMath', () => {
  it('releaseVelocity uses only recent samples and dies after a pause', () => {
    const s: Array<[number, number]> = [[0, 500], [100, 400], [116, 380], [132, 360]];
    expect(releaseVelocity(s, 132)).toBeCloseTo(-1.25, 2); // last 100ms: 400 -> 360 over 32ms
    expect(releaseVelocity(s, 300)).toBe(0); // held still before release
    expect(releaseVelocity([[0, 1]], 0)).toBe(0);
  });

  it('nearestPoint and nextPoint pick snap targets', () => {
    const pts = [0, 288, 576, 864];
    expect(nearestPoint(pts, 400)).toBe(288);
    expect(nearestPoint(pts, 450)).toBe(576);
    expect(nextPoint(pts, 288, 1)).toBe(576);
    expect(nextPoint(pts, 288, -1)).toBe(0);
    expect(nextPoint(pts, 864, 1)).toBe(864); // edge
    expect(nextPoint(pts, 0, -1)).toBe(0);
  });

  it('glideDuration stays within bounds', () => {
    expect(glideDuration(0, 2)).toBe(0);
    expect(glideDuration(300, 2)).toBe(450);
    expect(glideDuration(5000, 0.1)).toBe(900);
    expect(glideDuration(10, 5)).toBe(220);
  });

  it('wheelPixels normalises line and page deltas', () => {
    expect(wheelPixels(3, 1, 800)).toBe(48);
    expect(wheelPixels(1, 2, 800)).toBe(800);
    expect(wheelPixels(120, 0, 800)).toBe(120);
  });
});
