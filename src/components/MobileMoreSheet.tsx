import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bot, Globe2, Users, 
  ChevronRight, MessageSquare, PhoneCall, Zap, ShoppingBag, Settings, Brain, BarChart3
} from 'lucide-react';
import { AppNavTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { bottomSheetVariant } from '../utils/motionTransitions';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigateTab: (tab: AppNavTab) => void;
  onOpenSqlModal?: () => void;
  onOpenPricingDrawer?: () => void;
  onOpenSettingsDrawer?: () => void;
  onOpenTrainModal?: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab,
  onOpenPricingDrawer,
  onOpenSettingsDrawer,
  onOpenTrainModal,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-black/80 backdrop-blur-md p-0 md:p-4"
          onClick={onClose}
        >
          <motion.div 
            variants={bottomSheetVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full md:max-w-lg bg-[#0b1220] rounded-t-3xl md:rounded-3xl max-h-[88vh] overflow-y-auto p-5 pb-10 md:pb-6 shadow-2xl border-t md:border border-white/10 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header handle & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white font-display">HRGen Agentic Drawer Menu</h3>
              </div>
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Extended Modules Navigation */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block px-1">
                Training, Analytics, Settings & Modules
              </span>

              {/* Real-Time Recharts Analytics Dashboard */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigateTab('analytics');
                  onClose();
                }}
                className={`w-full min-h-[52px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-semibold shadow-lg shadow-emerald-500/10'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-slate-100 hover:bg-emerald-500/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold block text-white">Real-Time Analytics Dashboard</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">LIVE</span>
                    </div>
                    <span className="text-[10px] text-slate-300">Voice Call Volume · Lead Funnel · Swarm CLI & Ads ROAS</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </motion.button>

              {/* Agent Training & Hermes Self-Improver */}
              {onOpenTrainModal && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onOpenTrainModal();
                    onClose();
                  }}
                  className="w-full min-h-[52px] p-3 rounded-2xl border border-cyan-500/35 bg-cyan-500/10 hover:bg-cyan-500/20 text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold block text-white">Train Agents & Hermes Skill</span>
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">HERMES v1.4</span>
                      </div>
                      <span className="text-[10px] text-slate-300">Custom FAQs · Business SOP Rules · Auto-Improve</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </motion.button>
              )}

              {/* System & API Settings */}
              {onOpenSettingsDrawer && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onOpenSettingsDrawer();
                    onClose();
                  }}
                  className="w-full min-h-[52px] p-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">System & API Settings</span>
                      <span className="text-[10px] text-slate-400">LLM routing · Hindi Soft Voice default · Webhooks</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </motion.button>
              )}

              {/* Commercial Licenses & Pricing */}
              {onOpenPricingDrawer && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onOpenPricingDrawer();
                    onClose();
                  }}
                  className="w-full min-h-[52px] p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">Commercial Licenses & Pricing</span>
                      <span className="text-[10px] text-slate-300">Voice seats · WhatsApp API · AEO Growth Retainers</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </motion.button>
              )}

              {/* Multi-LLM Fallback Engine */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigateTab('multillm');
                  onClose();
                }}
                className={`w-full min-h-[52px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeTab === 'multillm'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-white font-semibold shadow-lg shadow-cyan-500/10'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold block text-white">Multi-LLM Fallback Stack</span>
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">100% FREE</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Gemini · Groq Llama · OpenRouter · Mistral · DeepSeek</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.button>

              {/* Agent Studio */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigateTab('studio');
                  onClose();
                }}
                className={`w-full min-h-[52px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeTab === 'studio'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-semibold shadow-lg shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Agent Studio & Prompts</span>
                    <span className="text-[10px] text-slate-400">10 Pods · Kore/Zephyr audio · Self-evolution</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.button>

              {/* Growth Engine & SEO/GEO */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigateTab('marketing');
                  onClose();
                }}
                className={`w-full min-h-[52px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeTab === 'marketing'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-semibold shadow-lg shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Growth Engine & SEO/GEO</span>
                    <span className="text-[10px] text-slate-400">Lucas optimizer · JSON-LD · Meta Ads</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.button>

              {/* Voice Webphone */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigateTab('copilot');
                  onClose();
                }}
                className={`w-full min-h-[52px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeTab === 'copilot'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-semibold shadow-lg shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Voice Webphone (&lt;140ms)</span>
                    <span className="text-[10px] text-slate-400">Hindi Soft Voice · Live Call · Hermes Memory</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.button>
            </div>

            {/* PWA Direct Installation & Bundle Download Card */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-tr from-[#0f172a] to-[#1e293b] border border-white/10 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Progressive Web App (PWA)
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Offline Ready · Standalone
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Install HRGen Agentic AI to your home screen or desktop, or download the trained agent bundle.
              </p>
              <PWAInstallButton />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
