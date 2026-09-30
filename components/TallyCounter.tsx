'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  suffix: string;
  /** Render just the number inline (no suffix, no block wrapper) */
  inline?: boolean;
}

function formatCount(n: number): string {
  return n.toLocaleString('en-AU');
}

export default function TallyCounter({ suffix, inline }: Props) {
  const [display, setDisplay] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/tally')
      .then((r) => r.json())
      .then(({ count }) => {
        const target = Number(count);
        const duration = 1500;
        const start = performance.now();

        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * target));
          if (progress < 1) {
            rafRef.current = requestAnimationFrame(tick);
          }
        };

        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => setDisplay(0));

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (inline) {
    return <span>{display === null ? '—' : formatCount(display)}</span>;
  }

  return (
    <span>
      {display === null ? '—' : `${formatCount(display)} ${suffix}`}
    </span>
  );
}
