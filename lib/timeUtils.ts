/** Returns current local time as "HH:MM" (24-hr) */
export function nowTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Add fractional hours to a "HH:MM" string, returns "h:MM AM/PM".
 * When the result lands on a later day, appends "(+1 day)" / "(+N days)".
 */
export function addHours(base: string, offsetHours: number): string {
  const [h, m] = base.split(':').map(Number);
  const totalMins = h * 60 + m + Math.round(offsetHours * 60);
  const dayOffset = Math.floor(totalMins / 1440);
  const clampedMins = ((totalMins % 1440) + 1440) % 1440; // wrap 24-hr
  const rh = Math.floor(clampedMins / 60);
  const rm = clampedMins % 60;
  const ampm = rh < 12 ? 'AM' : 'PM';
  const displayH = rh % 12 === 0 ? 12 : rh % 12;
  const clock = `${displayH}:${String(rm).padStart(2, '0')} ${ampm}`;
  if (dayOffset <= 0) return clock;
  return `${clock} (+${dayOffset} day${dayOffset === 1 ? '' : 's'})`;
}
