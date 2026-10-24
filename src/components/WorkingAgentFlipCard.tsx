import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneCall, MessageSquare, RotateCw, Sparkles, Brain, Terminal, Globe } from 'lucide-react';
import { AgentPod } from '../types';
import { getAgentPortrait } from '../utils/agentPortraits';
import { getAgentBotDescriptor } from '../utils/agentBotModalities';
import { sharedElementSpring } from '../utils/motionTransitions';
import { MiniSparkline } from './MiniSparkline';
import { AgentAvatar } from './AgentAvatar';

interface WorkingAgentFlipCardProps {
  pod: AgentPod;
  onStartCall: (pod: AgentPod) => void;
  onStartWhatsApp: (pod: AgentPod) => void;
  onLaunchBotConsole?: (pod: AgentPod) => void;
  onEvolvePrompt?: (pod: AgentPod) => void;
  onTrainAgent?: (pod: AgentPod) => void;
}

export const WorkingAgentFlipCard: React.FC<WorkingAgentFlipCardProps> = ({
  pod,
  onStartCall,
  onStartWhatsApp,
  onLaunchBotConsole,
  onEvolvePrompt,
  onTrainAgent,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const portrait = getAgentPortrait(pod.id);
  const botDescriptor = getAgentBotDescriptor(pod);

  const isVoiceAgent = botDescriptor.modality === 'voice_pod';
  const isWhatsAppBot = botDescriptor.modality === 'whatsapp_bot';
  const isSpecializedBot = !isVoiceAgent && !isWhatsAppBot;

  const handlePrimaryAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoiceAgent) {
      onStartCall(pod);
    } else if (isWhatsAppBot) {
      onStartWhatsApp(pod);
    } else if (onLaunchBotConsole) {
      onLaunchBotConsole(pod);
    } else {
      onStartCall(pod);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const baseInteractions = pod.stats.interactions || 42;
  const sparklineData = [
    Math.max(10, Math.round(baseInteractions * 0.58)),
    Math.round(baseInteractions * 0.72),
    Math.round(baseInteractions * 0.69),
    Math.round(baseInteractions * 0.84),
    Math.round(baseInteractions * 0.89),
    Math.round(baseInteractions * 0.92),
    baseInteractions,
  ];

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="relative w-full h-[380px] cursor-pointer select-none group perspective-[1200px]"
      title="Click card to flip"
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={sharedElementSpring}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full rounded-3xl"
      >
        {/* FRONT FACE: Illustrated Human Portrait & Modality Controls (Zero Rings) */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden apple-glass-card flex flex-col justify-between"
        >
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <img
              src={portrait.portraitSvg}
              alt={`${pod.name} (${pod.title}) portrait`}
              className="w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#030712]/80 via-[#030712]/30 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#030712]/95 via-[#030712]/75 to-transparent" />
          </div>

          {/* Top Status & Modality Badge */}
          <div className="relative z-10 p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: botDescriptor.accentColor }}
              />
              <span className="text-[10px] font-mono font-bold text-white tracking-wider">
                {botDescriptor.badgeLabel}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-slate-200 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3 h-3 text-cyan-400" />
              <span>Flip</span>
            </button>
          </div>

          {/* Bottom: Avatar Badge, Name, Role & Primary Action */}
          <div className="relative z-10 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <AgentAvatar
                podId={pod.id}
                name={pod.name}
                role={pod.title}
                size="sm"
                status="online"
                rounded="xl"
              />
              <div className="min-w-0">
                <h3 className="font-extrabold text-base sm:text-lg text-white font-display tracking-tight group-hover:text-emerald-300 transition-colors truncate">
                  {pod.name}
                </h3>
                <p className="text-xs text-slate-300 font-medium line-clamp-1">
                  {pod.title}
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={handlePrimaryAction}
                className={`flex-1 py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all min-h-[44px] cursor-pointer ${
                  isVoiceAgent
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
                    : isWhatsAppBot
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-300 hover:to-emerald-300 text-slate-950 shadow-green-500/25'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 shadow-cyan-500/25'
                }`}
              >
                {isVoiceAgent ? (
                  <PhoneCall className="w-4 h-4 fill-slate-950 text-slate-950" />
                ) : isWhatsAppBot ? (
                  <MessageSquare className="w-4 h-4 text-slate-950" />
                ) : botDescriptor.modality === 'browser_bot' ||
                  botDescriptor.modality === 'ads_meta_google' ? (
                  <Globe className="w-4 h-4 text-slate-950" />
                ) : (
                  <Terminal className="w-4 h-4 text-slate-950" />
                )}
                <span>{botDescriptor.actionLabel}</span>
              </button>

              {onTrainAgent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrainAgent(pod);
                  }}
                  className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-md text-emerald-300 border border-emerald-400/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Train & Hermes Skill"
                >
                  <Brain className="w-4 h-4 text-emerald-300" />
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/15 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Flip Card"
              >
                <RotateCw className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 w-full h-full rounded-3xl p-4 sm:p-5 overflow-hidden apple-glass-card flex flex-col justify-between text-slate-100"
        >
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <AgentAvatar
                  podId={pod.id}
                  name={pod.name}
                  role={pod.title}
                  size="sm"
                  status="online"
                  rounded="xl"
                />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white font-display">
                    {pod.name}
                  </h4>
                  <span className="text-[11px] text-emerald-300 block">{pod.title}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-slate-200 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3 h-3 text-emerald-400" />
                <span>Front</span>
              </button>
            </div>

            <MiniSparkline
              data={sparklineData}
              color={portrait.accentColor || '#10b981'}
              gradientId={`spark-grad-${pod.id}`}
              label={isSpecializedBot ? botDescriptor.shortEngineTag : 'Activity Trend'}
              trendText="Session"
              height={48}
            />

            <div className="grid grid-cols-3 gap-2 py-2.5 px-2 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 text-center font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">
                  {isSpecializedBot ? 'Bot Runs' : 'Calls'}
                </span>
                <span className="font-bold text-white text-xs">{pod.stats.interactions}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Target SLA</span>
                <span className="font-bold text-emerald-400 text-xs">
                  {pod.stats.satisfaction}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Leads</span>
                <span className="font-bold text-cyan-400 text-xs">
                  {pod.stats.leadsCaptured}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-white/10 space-y-2">
            <button
              onClick={handlePrimaryAction}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all min-h-[42px] cursor-pointer"
            >
              {isVoiceAgent ? (
                <PhoneCall className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              ) : isWhatsAppBot ? (
                <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
              ) : (
                <Terminal className="w-3.5 h-3.5 text-slate-950" />
              )}
              <span>{botDescriptor.actionLabel}</span>
            </button>

            <div className="flex items-center gap-2">
              {isSpecializedBot ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCall(pod);
                  }}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors min-h-[40px] cursor-pointer"
                  title="Voice Call Bridge"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Voice</span>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartWhatsApp(pod);
                  }}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 backdrop-blur-md text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors min-h-[40px] cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              )}

              {onTrainAgent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrainAgent(pod);
                  }}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md border border-cyan-400/30 text-cyan-200 font-semibold text-xs flex items-center justify-center gap-1 transition-colors min-h-[40px] cursor-pointer"
                  title="Train & Hermes"
                >
                  <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Train</span>
                </button>
              )}

              {onEvolvePrompt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEvolvePrompt(pod);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-slate-200 font-semibold text-xs flex items-center justify-center transition-colors min-h-[40px] cursor-pointer"
                  title="Hermes Evolve"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
