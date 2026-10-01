'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { uiTransition } from '@/lib/motion';

/**
 * App-wide framer-motion setup.
 *
 * - LazyMotion(domAnimation) + `m.*` components ship the small feature set (no layout
 *   animations — sliding indicators use lib/useSlidingIndicator.ts instead); `strict`
 *   fails the build if anyone imports the heavier `motion.*`.
 *   The features are imported synchronously on purpose: with an async `features`
 *   loader, `m` elements sat at their `initial` values (opacity 0, height 0) until
 *   the chunk arrived, and on /gear that was measured at ~3.6s after load.
 * - reducedMotion="user" is the JS half of the reduced-motion policy (see
 *   app/globals.css): when the OS asks for less motion, transform animations are
 *   skipped and opacity still fades, so nothing ever just pops.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={uiTransition}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
