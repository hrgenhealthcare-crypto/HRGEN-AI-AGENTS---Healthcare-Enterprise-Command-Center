import React from 'react';
import { motion } from 'framer-motion';
import { 
  PhoneCall, PlusCircle, Activity, Bot, LayoutDashboard, 
  MessageSquare, Users, Globe2, Zap
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { cinematicSpring, sharedElementSpring } from '../utils/motionTransitions';

interface HeaderProps {
  activeTab: 'dashboard' | 'studio' | 'copilot' | 'crm' | 'whatsapp' | 'marketing' | 'multillm';
  setActiveTab: (tab: 'dashboard' | 'studio' | 'copilot' | 'crm' | 'whatsapp' | 'marketing' | 'multillm') => void;
  onOpenQuickCall: () => void;
  onOpenNewLead: () => void;
  onOpenSqlModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickCall,
  onOpenNewLead,
  onOpenSqlModal,
}) => {
  interface NavTabItem {
    id: 'dashboard' | 'studio' | 'copilot' | 'crm' | 'whatsapp' | 'marketing' | 'multillm';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const navTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio', label: 'Agent Studio', icon: Bot },
    { id: 'copilot', label: 'Voice Webphone', icon: PhoneCall },
    { id: 'multillm', label: 'Multi-LLM Fallback', icon: Zap, badge: 'FREE' },
    { id: 'whatsapp', label: 'WhatsApp Suite', icon: MessageSquare },
    { id: 'crm', label: 'Lead Pipeline', icon: Users },
    { id: 'marketing', label: 'Growth Engine', icon: Globe2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#050811]/90 backdrop-blur-xl border-b border-white/10">
      {/* Top Utility Bar: Engine Status & Telephony Network */}
      <div className="bg-[#030712] text-slate-300 text-xs px-3 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 font-mono-numbers">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-sans font-bold text-white tracking-wide">
              PODS 2026 · AUTONOMOUS AGENT CORE
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-400 text-[10px] sm:text-[11px] font-sans">
            5-Tier Multi-LLM · Gemini Flash · Groq Llama · Kokoro TTS
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-emerald-400 text-[10px] sm:text-[11px]">
            &lt;140ms Real-Time Voice
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
          <span className="text-emerald-400 font-sans font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            10 Business Pods Online
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <button 
            onClick={onOpenSqlModal}
            className="text-cyan-400 hover:text-cyan-300 hidden sm:inline cursor-pointer transition-colors"
          >
            Supabase RLS Active
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 sm:gap-8 h-14 sm:h-16">
          {/* Zone 1: Brand wordmark & logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveTab('dashboard')}
              className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 transition-all"
              title="PODS 2026 Home"
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap hover:text-emerald-400 transition-colors font-display"
            >
              PODS 2026
            </button>
          </div>

          {/* Zone 2: Navigation Links for desktop with Shared Motion Indicator */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3 text-sm font-medium text-slate-300">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 text-xs lg:text-sm font-medium ${
                    isActive ? 'text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="globalActiveNavPill"
                      transition={sharedElementSpring}
                      className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10 shadow-sm shadow-emerald-500/20"
                    />
                  )}
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-emerald-400 stroke-[2.2] scale-110' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & PWA Install */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <PWAInstallButton compact={true} />

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onOpenQuickCall}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-xl hover:from-emerald-300 hover:to-teal-200 transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="hidden xs:inline">Launch Live Call</span>
              <span className="xs:hidden">Call</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onOpenNewLead}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>New Lead</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};
