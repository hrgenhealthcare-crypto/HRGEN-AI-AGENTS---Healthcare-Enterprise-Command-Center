import React from 'react';
import { motion } from 'framer-motion';
import { Flame, PhoneCall, Brain, ArrowUpRight, Terminal, Globe } from 'lucide-react';
import { AgentPod } from '../types';
import { getAgentPortrait } from '../utils/agentPortraits';
import { getAgentBotDescriptor } from '../utils/agentBotModalities';
import { AgentAvatar } from './AgentAvatar';

interface TrendingAgentsSectionProps {
  pods: AgentPod[];
  onSelectAgentForCall: (podId: string) => void;
  onOpenBotConsole?: (pod: AgentPod) => void;
  onOpenRagInspector?: (podId: string) => void;
  className?: string;
}

export const TrendingAgentsSection: React.FC<TrendingAgentsSectionProps> = ({
  pods,
  onSelectAgentForCall,
  onOpenBotConsole,
  onOpenRagInspector,
  className = '',
}) => {
  const trendingPodData = [
    {
      podId: 'pod-02',
      name: 'Vikramaditya Singh',
      role: 'B2B Revenue & Closer Lead',
      velocity: 'Active',
      rank: 1,
    },
    {
      podId: 'pod-05',
      name: 'Neha Verma',
      role: 'Dispatch & Logistics TUI',
      velocity: 'Active',
      rank: 2,
    },
    {
      podId: 'pod-03',
      name: 'Priya Nair',
      role: 'Growth & Campaign Command',
      velocity: 'Active',
      rank: 3,
    },
  ];

  const handleActivateTrending = (podId: string) => {
    const matched = pods.find((p) => p.id === podId);
    if (matched) {
      const desc = getAgentBotDescriptor(matched);
      if (
        desc.modality !== 'voice_pod' &&
        desc.modality !== 'whatsapp_bot' &&
        onOpenBotConsole
      ) {
        onOpenBotConsole(matched);
        return;
      }
    }
    onSelectAgentForCall(podId);
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white font-display">
          Featured Specialist Pods
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trendingPodData.map((item) => {
          const portrait = getAgentPortrait(item.podId);
          const matchedPod = pods.find((p) => p.id === item.podId);
          const desc = matchedPod ? getAgentBotDescriptor(matchedPod) : null;
          const isVoice = !desc || desc.modality === 'voice_pod';

          return (
            <motion.div
              key={item.podId}
              onClick={() => handleActivateTrending(item.podId)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="relative h-56 rounded-3xl apple-glass-card overflow-hidden p-5 flex flex-col justify-between group cursor-pointer select-none border border-white/10"
            >
              {/* Illustrated Human Portrait Backdrop (Zero Rings) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <img
                  src={portrait.portraitSvg}
                  alt={`${item.name} (${item.role}) portrait`}
                  className="w-48 h-48 object-contain opacity-85 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#030712]/95 via-[#030712]/60 to-transparent" />
              </div>

              {/* Top Bar */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-200">
                    #{item.rank}
                  </span>
                  {desc && (
                    <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[9px] font-mono font-bold text-emerald-300">
                      {desc.badgeLabel}
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {item.velocity}
                </span>
              </div>

              {/* Bottom Bar with AgentAvatar */}
              <div className="relative z-10 flex items-end justify-between gap-2 pt-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AgentAvatar
                    podId={item.podId}
                    name={item.name}
                    role={item.role}
                    size="sm"
                    status="online"
                    rounded="xl"
                  />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-white text-sm sm:text-base font-display tracking-tight group-hover:text-emerald-300 transition-colors truncate">
                      {item.name}
                    </h4>
                    <span className="text-xs text-slate-300 font-medium block truncate">
                      {item.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenRagInspector && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRagInspector(item.podId);
                      }}
                      title="RAG Memory"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <Brain className="w-4 h-4 text-cyan-400" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateTrending(item.podId);
                    }}
                    title={isVoice ? 'Voice Call' : desc?.actionLabel || 'Launch Bot'}
                    className="p-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 backdrop-blur-md text-emerald-300 border border-emerald-400/40 transition-colors cursor-pointer"
                  >
                    {isVoice ? (
                      <PhoneCall className="w-4 h-4 text-emerald-300" />
                    ) : desc?.modality === 'ads_meta_google' ||
                      desc?.modality === 'browser_bot' ? (
                      <Globe className="w-4 h-4 text-cyan-300" />
                    ) : (
                      <Terminal className="w-4 h-4 text-emerald-300" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
