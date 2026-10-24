import React from 'react';
import { motion } from 'framer-motion';
import { 
  PhoneCall, LayoutDashboard, MessageSquare, 
  Menu, Bot, Zap
} from 'lucide-react';
import { AppNavTab } from '../types';
import { cinematicSpring, tactileBounce, sharedElementSpring } from '../utils/motionTransitions';

interface MobileBottomNavProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
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
        {/* Tab 1: Voice AI Call */}
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
            Call
          </span>
        </motion.button>

        {/* Tab 2: Agent Team */}
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
            Agents
          </span>
        </motion.button>

        {/* Tab 3: ELEVATED TACTILE CENTER DASHBOARD BUTTON */}
        <div className="flex flex-col items-center justify-center relative -top-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setActiveTab('dashboard')}
            className={`w-13 h-13 rounded-full flex flex-col items-center justify-center text-slate-950 shadow-xl ring-4 ring-[#050811] ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-tr from-emerald-400 to-cyan-300 ring-emerald-500/30 scale-105'
                : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600'
            }`}
            title="Dashboard"
          >
            <LayoutDashboard className={`w-5 h-5 stroke-[2.3] ${activeTab === 'dashboard' ? 'text-slate-950' : 'text-emerald-400'}`} />
          </motion.button>
          <span
            className={`text-[9px] font-bold mt-1 tracking-tight ${
              activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            Home
          </span>
        </div>

        {/* Tab 4: WhatsApp */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('whatsapp')}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-colors"
        >
          {activeTab === 'whatsapp' && (
            <motion.div
              layoutId="activeMobileDockIndicator"
              transition={sharedElementSpring}
              className="absolute inset-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10 shadow-sm shadow-emerald-500/30"
            />
          )}
          <MessageSquare className={`w-5 h-5 transition-transform ${activeTab === 'whatsapp' ? 'scale-110 text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className={`text-[10px] tracking-tight mt-1 font-sans ${activeTab === 'whatsapp' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            WhatsApp
          </span>
        </motion.button>

        {/* Tab 5: Menu */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onOpenMoreMenu}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-colors"
        >
          {(activeTab === 'crm' || activeTab === 'marketing' || activeTab === 'multillm') && (
            <motion.div
              layoutId="activeMobileDockIndicator"
              transition={sharedElementSpring}
              className="absolute inset-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10 shadow-sm shadow-emerald-500/30"
            />
          )}
          <Menu className={`w-5 h-5 ${activeTab === 'crm' || activeTab === 'marketing' || activeTab === 'multillm' ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className={`text-[10px] tracking-tight mt-1 font-sans ${activeTab === 'crm' || activeTab === 'marketing' || activeTab === 'multillm' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
            Menu
          </span>
        </motion.button>
      </div>
    </nav>
  );
};
