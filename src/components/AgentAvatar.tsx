import React, { useState } from 'react';
import { getAgentPortraitSpec, getAgentPortraitUrl } from '../utils/agentPortraits';

interface AgentAvatarProps {
  podId?: string;
  name?: string;
  role?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'speaking' | 'listening' | 'processing' | 'idle' | 'none';
  className?: string;
  rounded?: 'full' | 'xl' | '2xl';
}

const SIZE_CLASSES: Record<NonNullable<AgentAvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-lg',
};

const ROUNDED_CLASSES: Record<NonNullable<AgentAvatarProps['rounded']>, string> = {
  full: 'rounded-full',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  podId,
  name,
  role,
  size = 'md',
  status = 'none',
  className = '',
  rounded = '2xl',
}) => {
  const [imgError, setImgError] = useState(false);
  const spec = getAgentPortraitSpec(podId, name);
  const src = getAgentPortraitUrl(podId, name);
  const displayName = name || spec.name;
  const displayRole = role || spec.roleTitle;
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const statusColor =
    status === 'speaking'
      ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
      : status === 'listening'
      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
      : status === 'processing'
      ? 'bg-violet-400 shadow-[0_0_8px_#a78bfa]'
      : status === 'online'
      ? 'bg-emerald-400'
      : 'bg-slate-400';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${SIZE_CLASSES[size]} ${ROUNDED_CLASSES[rounded]} ${className}`}
      title={`${displayName} — ${displayRole}`}
    >
      <div
        className={`w-full h-full overflow-hidden border border-white/15 bg-slate-900/90 shadow-inner flex items-center justify-center ${ROUNDED_CLASSES[rounded]}`}
      >
        {!imgError ? (
          <img
            src={src}
            alt={`${displayName} (${displayRole}) portrait`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-bold tracking-tight text-white"
            style={{
              background: `linear-gradient(135deg, ${spec.bgStart}, ${spec.bgEnd})`,
            }}
            aria-label={`${displayName} (${displayRole}) fallback avatar`}
          >
            {initials}
          </div>
        )}
      </div>

      {status !== 'none' && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${statusColor}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
