import { ViewTransition } from 'react';

/**
 * Route transition. A template re-mounts on every navigation, so this one boundary
 * gives every page an exit (old content fades, fast) and an enter (new content
 * fades up, slower) — see `::view-transition-*(.page-*)` in app/globals.css.
 * `default="none"` keeps it out of unrelated transitions (Suspense reveals etc).
 * Header and footer live in the layout, outside the boundary, and stay put.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="flex-1 flex flex-col">{children}</div>
    </ViewTransition>
  );
}
