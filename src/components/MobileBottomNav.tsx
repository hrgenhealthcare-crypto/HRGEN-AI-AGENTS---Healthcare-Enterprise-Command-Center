import React from 'react';
import { motion } from 'framer-motion';
import { 
  PhoneCall, LayoutDashboard, MessageSquare, 
  Menu, Bot, Zap
} from 'lucide-react';
import { cinematicSpring, tactileBounce, sharedElementSpring } from '../utils/motionTransitions';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'studio' | 'copilot' | 'crm' | 'whatsapp' | 'marketing' | 'multillm';
  setActiveTab: (tab: 'dashboard' | 'studio' | 'copilot' | 'crm' | 'whatsapp' | 'marketing' | 'multillm') => void;
  onOpenMoreMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMoreMenu,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050811]/95 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2 relative">
        {/* Tab 1: Voice AI Webphone */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('copilot')}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-colors"
        >
          {activeTab === 'copilot' && (
            <motion.div
              layoutId="activeMobileDockIndicator"
              transition={sharedElementSpring}
              className="absolute inset-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10 shadow-sm shadow-emerald-500/30"
            />
          )}
          <PhoneCall className={`w-5 h-5 transition-transform ${activeTab === 'copilot' ? 'scale-110 text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className={`text-[10px] tracking-tight mt-1 font-sans ${activeTab === 'copilot' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            Voice AI
          </span>
        </motion.button>

        {/* Tab 2: Agent Studio */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('studio')}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-colors"
        >
          {activeTab === 'studio' && (
            <motion.div
              layoutId="activeMobileDockIndicator"
              transition={sharedElementSpring}
              className="absolute inset-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10 shadow-sm shadow-emerald-500/30"
            />
          )}
          <Bot className={`w-5 h-5 transition-transform ${activeTab === 'studio' ? 'scale-110 text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className={`text-[10px] tracking-tight mt-1 font-sans ${activeTab === 'studio' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            Studio
          </span>
        </motion.button>

        {/* Tab 3: ELEVATED TACTILE CENTER DASHBOARD BUTTON with Floating Spring Motion */}
        <div className="flex flex-col items-center justify-center relative -top-4">
          <motion.button
            whileTap={{ scale: 0.88 }}
            animate={{
              y: activeTab === 'dashboard' ? [0, -3, 0] : [0, -1, 0],
              boxShadow: activeTab === 'dashboard'
                ? [
                    '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                    '0 14px 30px -5px rgba(6, 182, 212, 0.5)',
                    '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                  ]
                : '0 8px 16px rgba(0, 0, 0, 0.6)',
            }}
            transition={{
              y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
              boxShadow: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
            }}
            onClick={() => setActiveTab('dashboard')}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-slate-950 shadow-xl ring-4 ring-[#050811] ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-tr from-emerald-400 to-cyan-300 ring-emerald-500/30 scale-105'
                : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600'
            }`}
            title="Executive Dashboard"
          >
            <LayoutDashboard className={`w-6 h-6 stroke-[2.3] ${activeTab === 'dashboard' ? 'text-slate-950' : 'text-emerald-400'}`} />
          </motion.button>
          <span
            className={`text-[10px] font-bold mt-1 tracking-tight ${
              activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            Dashboard
          </span>
        </div>

        {/* Tab 4: Multi-LLM Fallback Stack */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('multillm')}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-colors"
        >
          {activeTab === 'multillm' && (
            <motion.div
              layoutId="activeMobileDockIndicator"
              transition={sharedElementSpring}
              className="absolute inset-1 bg-cyan-500/15 border border-cyan-500/30 rounded-xl -z-10 shadow-sm shadow-cyan-500/30"
            />
          )}
          <Zap className={`w-5 h-5 transition-transform ${activeTab === 'multillm' ? 'scale-110 text-cyan-400 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className={`text-[10px] tracking-tight mt-1 font-sans ${activeTab === 'multillm' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
            Multi-LLM
          </span>
        </motion.button>

        {/* Tab 5: More Hub (WhatsApp, CRM, Growth, SQL Schema) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onOpenMoreMenu}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-colors"
        >
          {(activeTab === 'crm' || activeTab === 'whatsapp' || activeTab === 'marketing') && (
            <motion.div
              layoutId="activeMobileDockIndicator"
              transition={sharedElementSpring}
              className="absolute inset-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10 shadow-sm shadow-emerald-500/30"
            />
          )}
          <Menu className={`w-5 h-5 ${activeTab === 'crm' || activeTab === 'whatsapp' || activeTab === 'marketing' ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className={`text-[10px] tracking-tight mt-1 font-sans ${activeTab === 'crm' || activeTab === 'whatsapp' || activeTab === 'marketing' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            More Hub
          </span>
        </motion.button>
      </div>
    </nav>
  );
};
