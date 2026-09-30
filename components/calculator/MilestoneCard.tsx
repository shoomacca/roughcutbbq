'use client';

import type { CookMilestone } from '@/types/calculator';

interface Props {
  milestone: CookMilestone;
  index: number;
  /** Formatted clock time string, e.g. "2:30 PM" */
  clockTime?: string;
  /** Relative offset label, e.g. "~4 hrs 45 min in" */
  timeOffsetLabel?: string;
  /** Hide the trailing vertical connector on the last card */
  isLast?: boolean;
}

export default function MilestoneCard({ milestone, index, clockTime, timeOffsetLabel, isLast }: Props) {
  return (
    <div className="flex gap-4 items-start">
      {/* Timeline connector */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
        <div className="w-8 h-8 rounded-full bg-brand-surface border-2 border-brand-primary/40 flex items-center justify-center text-base">
          {milestone.icon}
        </div>
        {/* Vertical line — hidden on last card */}
        {!isLast && <div className="w-0.5 bg-brand-muted/15 flex-1 min-h-4" />}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 pb-5">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs text-brand-muted font-medium uppercase tracking-wide">
            Step {index + 1}
          </span>
          {timeOffsetLabel && (
            <span className="text-xs font-semibold text-brand-muted bg-brand-muted/10 px-2 py-0.5 rounded-full">
              {timeOffsetLabel}
            </span>
          )}
          {clockTime && (
            <span className="text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
              {clockTime}
            </span>
          )}
        </div>
        <span className="text-brand-text font-semibold text-sm">{milestone.label}</span>
        <p className="text-brand-muted text-xs leading-relaxed">{milestone.description}</p>
      </div>
    </div>
  );
}
