/* Pure helpers for useDragScroll (unit-tested in tests/drag-scroll-math.test.ts). */

/** How far a release velocity carries the strip, in ms of travel. 2 px/ms -> ~650px. */
export const MOMENTUM_MS = 325;

/**
 * Release velocity in px/ms from recent pointer samples [timeMs, clientX].
 * Only the last `windowMs` count, so a drag that stopped before release has ~0 velocity.
 */
export function releaseVelocity(samples: Array<[number, number]>, now: number, windowMs = 100): number {
  const recent = samples.filter(([t]) => now - t <= windowMs);
  if (recent.length < 2) return 0;
  const [t0, x0] = recent[0];
  const [t1, x1] = recent[recent.length - 1];
  const dt = t1 - t0;
  if (dt <= 0) return 0;
  // A pause between the last move and the release kills the fling.
  if (now - t1 > 60) return 0;
  return (x1 - x0) / dt;
}

/** The point in `points` nearest `target`. */
export function nearestPoint(points: number[], target: number): number {
  let best = target;
  let bestDist = Infinity;
  for (const p of points) {
    const d = Math.abs(p - target);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

/**
 * The first point strictly past `from` in direction `dir` (+1 = right, -1 = left).
 * Falls back to the last point in that direction (the edge).
 */
export function nextPoint(points: number[], from: number, dir: 1 | -1, epsilon = 2): number {
  const sorted = [...points].sort((a, b) => a - b);
  if (dir > 0) return sorted.find((p) => p > from + epsilon) ?? sorted[sorted.length - 1] ?? from;
  for (let i = sorted.length - 1; i >= 0; i--) if (sorted[i] < from - epsilon) return sorted[i];
  return sorted[0] ?? from;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Ease-out cubic: starts at full speed, decelerates to rest (reads as inertia). */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Glide duration that matches the release speed: an ease-out cubic starts at 3*dist/dur,
 * so dur = 3*dist/v keeps the hand-off seamless. Clamped so it never drags on or snaps.
 */
export function glideDuration(distance: number, speed: number): number {
  const d = Math.abs(distance);
  const v = Math.abs(speed);
  if (d < 1) return 0;
  if (v < 0.05) return clamp(220 + d * 0.6, 220, 600);
  return clamp((3 * d) / v, 220, 900);
}

/** Normalise a WheelEvent delta to pixels (deltaMode 1 = lines, 2 = pages). */
export function wheelPixels(delta: number, deltaMode: number, pageSize: number): number {
  if (deltaMode === 1) return delta * 16;
  if (deltaMode === 2) return delta * pageSize;
  return delta;
}
