const KEY = 'bbq_tally_ts';
const WINDOW_MS = 60_000; // 60 seconds

/** Returns true if enough time has passed to increment again */
export function canIncrement(): boolean {
  if (typeof window === 'undefined') return false;
  const last = sessionStorage.getItem(KEY);
  if (!last) return true;
  return Date.now() - parseInt(last, 10) > WINDOW_MS;
}

/** Record the current timestamp as the last increment */
export function markIncremented(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, String(Date.now()));
}
