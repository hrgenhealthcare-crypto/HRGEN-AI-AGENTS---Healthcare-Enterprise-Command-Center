import React from 'react';

/**
 * Reuses the original HRGen wordmark cropped from the existing user Library
 * asset "HRGen Healthcare Digital Brand Identity.png".
 * The original artwork is preserved; this is not a new text-logo.
 * This implementation is isolated from all third-party design systems.
 */
export function HRGenWordmark({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} ${className}`}>
      <img
        src="/brand/hrgen-wordmark-original-crop.webp"
        alt="HRGen"
        width={compact ? 120 : 160}
        height={compact ? 29 : 38}
        className="block h-auto w-[120px] object-contain sm:w-[148px]"
        draggable={false}
      />
    </span>
  );
}
