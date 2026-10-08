import { useEffect, useRef } from 'react';

// Open overlays register a close callback; Android Back (CapacitorBootstrap) and Escape
// close the topmost one instead of navigating.
const stack: Array<() => void> = [];

export function pushBack(fn: () => void): () => void {
  stack.push(fn);
  return () => {
    const i = stack.lastIndexOf(fn);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Closes the topmost overlay. Returns false when none is open. */
export function handleBack(): boolean {
  const fn = stack[stack.length - 1];
  fn?.();
  return !!fn;
}

/** While `open`, Back and Escape call `onClose`. */
export function useBackClose(open: boolean, onClose: () => void) {
  const ref = useRef(onClose);
  useEffect(() => { ref.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const close = () => ref.current();
    const off = pushBack(close);
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBack(); };
    document.addEventListener('keydown', key);
    return () => { off(); document.removeEventListener('keydown', key); };
  }, [open]);
}
