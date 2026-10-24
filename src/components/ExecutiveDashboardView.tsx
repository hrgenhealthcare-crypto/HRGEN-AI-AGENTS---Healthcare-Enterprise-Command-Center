import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, PhoneCall, Users, MessageSquare, Brain, Settings, ArrowUpRight, BarChart3, Terminal, Sparkles
} from 'lucide-react';
import { BusinessServiceOrProduct, BusinessLead, AgentPod, AppNavTab } from '../types';
import { HolographicAgentCore } from './HolographicAgentCore';
import { AgentPerformanceChart } from './AgentPerformanceChart';
import { TrendingAgentsSection } from './TrendingAgentsSection';
import { StarRingBackground } from './StarRingBackground';
import { MODULE_3D_VISUALS } from '../utils/agentPortraits';

interface ExecutiveDashboardViewProps {
  pods: AgentPod[];
  leads: BusinessLead[];
  onNavigateTab: (tab: AppNavTab) => void;
  onOpenNewLeadModal: () => void;
  onOrderServiceDirect: (service: BusinessServiceOrProduct) => void;
  onOpenSqlModal?: () => void;
  onLaunchVoiceTest?: (pod: AgentPod) => void;
  onLaunchWhatsAppTest?: (pod: AgentPod) => void;
  onLaunchBotConsole?: (pod: AgentPod) => void;
  onOpenPricingDrawer?: () => void;
  onOpenRagInspector?: (podId: string) => void;
  onOpenSettingsDrawer?: () => void;
  onOpenTrainModal?: (pod?: AgentPod) => void;
  onSummonJarvis?: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  pods,
  onNavigateTab,
  onLaunchVoiceTest,
  onLaunchBotConsole,
  onOpenRagInspector,
  onOpenSettingsDrawer,
  onOpenTrainModal,
  onSummonJarvis,
}) => {
  const launchpadModules = [
    {
      key: 'voice' as const,
      title: 'Voice Call',
      targetTab: 'copilot' as const,
      icon: PhoneCall,
      visual: MODULE_3D_VISUALS.voice,
      accentColor: '#10b981',
      secondaryColor: '#06b6d4',
    },
    {
      key: 'team' as const,
      title: 'Agent Team',
      targetTab: 'studio' as const,
      icon: Bot,
      visual: MODULE_3D_VISUALS.team,
      accentColor: '#8b5cf6',
      secondaryColor: '#3b82f6',
    },
    {
      key: 'whatsapp' as const,
      title: 'WhatsApp',
      targetTab: 'whatsapp' as const,
      icon: MessageSquare,
      visual: MODULE_3D_VISUALS.whatsapp,
      accentColor: '#10b981',
      secondaryColor: '#14b8a6',
    },
    {
      key: 'leads' as const,
      title: 'Leads',
      targetTab: 'crm' as const,
      icon: Users,
      visual: MODULE_3D_VISUALS.leads,
      accentColor: '#f59e0b',
      secondaryColor: '#f43f5e',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Genesis AI Core Interactive Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 3D Holographic Genesis AI Core (3D Human Hologram + 2 rings + stars) */}
        <div className="lg:col-span-5">
          <HolographicAgentCore
            activePodName="Genesis AI"
            podRole="Enterprise Core"
            voiceEngine="Neural TTS"
            channel="Voice Call"
            onTapCore={() => (onSummonJarvis ? onSummonJarvis() : onNavigateTab('copilot'))}
            className="h-full"
          />
        </div>

        {/* Right: Apple Glassmorphism Command Panel with Two Rings + Twinkling Stars Background */}
        <div className="lg:col-span-7 relative overflow-hidden apple-glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-center">
          <StarRingBackground
            variant="card"
            accentColor="#10b981"
            secondaryColor="#06b6d4"
          />

          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold tracking-wide">HRGen AGENTIC AI · EXECUTIVE WORKSPACE</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Genesis AI Workforce
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => onNavigateTab('copilot')}
                className="min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <PhoneCall className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>Voice Call</span>
              </button>

              {onSummonJarvis && (
                <button
                  onClick={onSummonJarvis}
                  className="min-h-[44px] px-3.5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-cyan-400/40 shadow-lg shadow-cyan-500/15 transition-all active:scale-95 backdrop-blur-md"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Jarvis 3D</span>
                </button>
              )}

              {onLaunchBotConsole && (
                <button
                  onClick={() => onLaunchBotConsole(pods[3] || pods[0])}
                  className="min-h-[44px] px-3.5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-all active:scale-95 backdrop-blur-md"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Swarm Bots</span>
                </button>
              )}

              <button
                onClick={() => onNavigateTab('analytics')}
                className="min-h-[44px] px-3.5 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-cyan-500/30 transition-all active:scale-95 backdrop-blur-md"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Analytics</span>
              </button>

              {onOpenTrainModal && (
                <button
                  onClick={() => onOpenTrainModal(pods[0])}
                  className="min-h-[44px] px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/15 transition-all active:scale-95 backdrop-blur-md"
                >
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span>Train & Hermes</span>
                </button>
              )}

              {onOpenSettingsDrawer && (
                <button
                  onClick={onOpenSettingsDrawer}
                  className="min-h-[44px] px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-all active:scale-95 backdrop-blur-md"
                >
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Powerful 3D Animated Apple Glassmorphism Module Cards (Single Crisp Title Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 perspective-[1200px]">
        {launchpadModules.map((mod) => {
          const IconComponent = mod.icon;
          return (
            <motion.button
              key={mod.key}
              onClick={() => onNavigateTab(mod.targetTab)}
              whileHover={{
                scale: 1.045,
                rotateX: -6,
                rotateY: 6,
                y: -8,
              }}
              whileTap={{ scale: 0.96 }}
              transition={{
                type: 'spring',
                stiffness: 340,
                damping: 22,
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative h-48 sm:h-52 rounded-3xl apple-glass-card overflow-hidden p-4 sm:p-5 text-left flex flex-col justify-between group cursor-pointer select-none"
            >
              {/* Clean Ambient Card Background */}
              <StarRingBackground
                variant="card"
                accentColor={mod.accentColor}
                secondaryColor={mod.secondaryColor}
              />

              {/* 3D Product Visual Artwork Layer */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <img
                  src={mod.visual}
                  alt={mod.title}
                  className="w-44 h-36 object-contain opacity-90 group-hover:scale-110 transition-transform duration-500 animate-float-3d"
                />
              </div>

              {/* Specular Top Glass Rim Bar */}
              <div className="relative z-10 flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                  style={{ color: mod.accentColor }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-slate-200 group-hover:text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Single Crisp Title Only (Zero Duplicate Sub-Labels) */}
              <div className="relative z-10 pt-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white font-display tracking-tight group-hover:text-emerald-300 transition-colors">
                  {mod.title}
                </h3>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 30-Day Calls Handled vs Conversion Rate Recharts Visualization */}
      <AgentPerformanceChart />

      {/* Trending Agents (30-Day Velocity) with 3D Apple Glassmorphism Cards */}
      <TrendingAgentsSection
        pods={pods}
        onSelectAgentForCall={(podId) => {
          const matched = pods.find((p) => p.id === podId);
          if (matched && onLaunchVoiceTest) onLaunchVoiceTest(matched);
          else onNavigateTab('copilot');
        }}
        onOpenBotConsole={onLaunchBotConsole}
        onOpenRagInspector={onOpenRagInspector}
      />
    </div>
  );
};
