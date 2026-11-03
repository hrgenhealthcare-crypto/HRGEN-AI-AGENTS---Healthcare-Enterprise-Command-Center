import React from 'react';

/**
 * Locked HRGen typographic identity.
 * HR = solid near-black, Gen = solid magenta, on an opaque white tile.
 * No gradients, color blending, emoji icon or theme-inherited text colors.
 * Replace with an approved vector asset only after source verification.
 */
export function HRGenWordmark({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-[#e8e7ed] bg-white ${compact ? 'min-h-9 px-2.5 py-1' : 'min-h-10 px-3 py-1.5'} shadow-sm ${className}`}
      aria-label="HRGen"
      role="img"
    >
      <span className={`font-black tracking-[-0.055em] leading-none ${compact ? 'text-lg' : 'text-xl'}`}>
        <span className="text-[#111111]">HR</span>
        <span className="text-[#E72D88]">Gen</span>
      </span>
    </span>
  );
}
