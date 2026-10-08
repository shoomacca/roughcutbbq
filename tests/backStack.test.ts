import { describe, expect, it, vi } from 'vitest';
import { handleBack, pushBack } from '@/lib/backStack';

describe('backStack', () => {
  it('closes only the topmost overlay, then falls through when empty', () => {
    const a = vi.fn(), b = vi.fn();
    const offA = pushBack(a);
    const offB = pushBack(b);
    expect(handleBack()).toBe(true);
    expect(b).toHaveBeenCalledOnce();
    expect(a).not.toHaveBeenCalled();
    offB();
    expect(handleBack()).toBe(true);
    expect(a).toHaveBeenCalledOnce();
    offA();
    expect(handleBack()).toBe(false);
  });
});
