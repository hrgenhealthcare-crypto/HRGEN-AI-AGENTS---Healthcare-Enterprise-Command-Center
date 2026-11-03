import React from 'react';
import { motion } from 'framer-motion';
import { 
  PhoneCall, Bot, LayoutDashboard, 
  MessageSquare, Users, Menu, BarChart3
} from 'lucide-react';
import { AppNavTab } from '../types';
import { HRGenWordmark } from './HRGenWordmark';
import { sharedElementSpring } from '../utils/motionTransitions';

interface HeaderProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
  onOpenQuickCall: () => void;
  onOpenNewLead: () => void;
  onOpenSqlModal?: () => void;
  onOpenPricingDrawer?: () => void;
  onOpenMoreMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickCall,
  onOpenMoreMenu,
}) => {
  interface NavTabItem {
    id: AppNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const navTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio', label: 'Agent Team', icon: Bot },
    { id: 'copilot', label: 'Voice Call', icon: PhoneCall },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'crm', label: 'Leads', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#050811]/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 sm:gap-8 h-14 sm:h-16">
          {/* Approved color split: HR solid black / Gen solid magenta. */}
          <div className="flex shrink-0 items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('dashboard')}
              className="rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E72D88]"
              title="HRGen dashboard"
              aria-label="HRGen dashboard"
            >
              <HRGenWordmark compact />
            </motion.button>
            <span className="hidden sm:inline text-[10px] font-semibold tracking-[.12em] uppercase text-[#C4B6EA]">
              Agentic AI
            </span>
          </div>

          {/* Zone 2: Navigation Links for desktop */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5 text-sm font-medium text-slate-300">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 text-xs lg:text-sm font-medium ${
                    isActive ? 'text-[#F7B3D6] font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="globalActiveNavPill"
                      transition={sharedElementSpring}
                      className="absolute inset-0 bg-[#52152F]/25 border border-[#E72D88]/50 rounded-xl -z-10 shadow-sm shadow-[#52152F]/20"
                    />
                  )}
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-[#FFAFD2] stroke-[2.2] scale-110' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA & Drawer Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onOpenQuickCall}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-xs font-bold text-white bg-[#E72D88] rounded-xl hover:bg-[#C81E6D] hover:-translate-y-0.5 transition-all shadow-md shadow-[#E72D88]/20 whitespace-nowrap min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Launch Live Call</span>
            </motion.button>

            {onOpenMoreMenu && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={onOpenMoreMenu}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors"
                title="Drawer Menu, Settings, Pricing & PWA Install"
              >
                <Menu className="w-4 h-4 text-[#F7D8E7]" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
