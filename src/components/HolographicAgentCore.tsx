import React, { useState } from 'react';
import { Sparkles, RotateCcw, Mic } from 'lucide-react';
import { Humanoid3DCanvas, HumanoidLifecycleState } from './Humanoid3DCanvas';

interface HolographicAgentCoreProps {
  isActiveVoice?: boolean;
  activePodName?: string;
  podRole?: string;
  voiceEngine?: string;
  channel?: string;
  latencyMs?: number;
  onTapCore?: () => void;
  className?: string;
}

export const HolographicAgentCore: React.FC<HolographicAgentCoreProps> = ({
  isActiveVoice = false,
  activePodName = 'GORT 3D AI Assistant',
  channel = 'Voice & Text Command',
  onTapCore,
  className = '',
}) => {
  const [rotOffset, setRotOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
  const [previewState, setPreviewState] = useState<HumanoidLifecycleState>('listening');

  const effectiveState: HumanoidLifecycleState = isActiveVoice ? 'speaking' : previewState;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-700/60 bg-gradient-to-b from-[#0a0f1d]/95 via-[#060a14]/95 to-[#02050a] shadow-2xl backdrop-blur-xl group transition-all duration-300 hover:border-red-500/35 ${className}`}
    >
      {/* Quiet Thin Laser Scan-Line Shimmer & Neutral Studio Vignette (Zero Rotating Rings/Halos) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, rgba(239,68,68,0.14) 5px)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(239,68,68,0.08),transparent_68%)] pointer-events-none" />

      {/* Top Clean HUD Bar */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 pointer-events-none">
          <span
            className={`inline-flex rounded-full h-2 w-2 ${
              effectiveState === 'speaking'
                ? 'bg-red-500 animate-ping'
                : effectiveState === 'processing'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-red-400 animate-pulse'
            }`}
          />
          <span className="font-mono text-[11px] font-semibold text-slate-200 tracking-wide uppercase">
            {effectiveState}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewState((prev) =>
                prev === 'listening'
                  ? 'speaking'
                  : prev === 'speaking'
                  ? 'processing'
                  : prev === 'processing'
                  ? 'materializing'
                  : 'listening'
              );
            }}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-red-300 transition-colors cursor-pointer"
            title="Cycle Avatar State Preview"
          >
            State: {effectiveState}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRotOffset({ x: 0, y: 0 });
              setScaleMultiplier(1.0);
            }}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset 3D View"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* GORT (2008) Half-Body Humanoid Alien Metal Stage */}
      <div className="w-full h-60 sm:h-68 relative">
        <Humanoid3DCanvas
          lifecycleState={effectiveState}
          speechAmplitude={effectiveState === 'speaking' ? 0.62 : 0}
          rotationOffset={rotOffset}
          scaleMultiplier={scaleMultiplier}
          onPointerRotate={(dx, dy) =>
            setRotOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
          }
          onWheelScale={(delta) =>
            setScaleMultiplier((prev) => Math.max(0.65, Math.min(1.55, prev + delta)))
          }
        />
      </div>

      {/* Bottom Clean Control Strip */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
        <div className="flex items-center gap-1.5 pointer-events-none">
          <span className="font-bold text-white text-sm tracking-tight font-display">
            {activePodName}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
            · {channel}
          </span>
        </div>

        {onTapCore && (
          <button
            type="button"
            onClick={onTapCore}
            className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-200 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Mic className="w-3 h-3 text-red-300" />
            <span>Open Assistant</span>
          </button>
        )}
      </div>
    </div>
  );
};
