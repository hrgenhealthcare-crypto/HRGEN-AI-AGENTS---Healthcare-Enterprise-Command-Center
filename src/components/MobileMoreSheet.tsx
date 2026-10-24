import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bot, Globe2, Users, 
  ChevronRight, Sparkles, MessageSquare, PhoneCall, Database, Zap
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { bottomSheetVariant } from '../utils/motionTransitions';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigateTab: (tab: 'dashboard' | 'studio' | 'copilot' | 'crm' | 'whatsapp' | 'marketing' | 'multillm') => void;
  onOpenSqlModal?: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab,
  onOpenSqlModal,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md md:hidden"
          onClick={onClose}
        >
          <motion.div 
            variants={bottomSheetVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full bg-[#0b1220] rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-10 shadow-2xl border-t border-white/10 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header handle & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white font-display">PODS 2026 Fleet Menu</h3>
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
                Autonomous Modules
              </span>

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

              {/* WhatsApp Business Suite */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigateTab('whatsapp');
                  onClose();
                }}
                className={`w-full min-h-[52px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeTab === 'whatsapp'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-semibold shadow-lg shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">WhatsApp Business Suite</span>
                    <span className="text-[10px] text-slate-400">Templates · UPI links · PDF brochures · Voice handover</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.button>

              {/* Business Lead CRM */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigateTab('crm');
                  onClose();
                }}
                className={`w-full min-h-[52px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeTab === 'crm'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-semibold shadow-lg shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Business Lead CRM</span>
                    <span className="text-[10px] text-slate-400">5-stage pipeline · Deal values · Direct call</span>
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
                    <span className="text-[10px] text-slate-400">Live call simulator · Waveform log · SIP meter</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </motion.button>

              {onOpenSqlModal && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onOpenSqlModal();
                    onClose();
                  }}
                  className="w-full min-h-[52px] p-3 rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">Supabase / PostgreSQL Schema</span>
                      <span className="text-[10px] text-slate-400">Production multi-tenant SQL with RLS</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </motion.button>
              )}
            </div>

            {/* PWA Direct Installation Card */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-tr from-[#0f172a] to-[#1e293b] border border-white/10 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Progressive Web App (PWA)
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Offline Ready · Fast Cache
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Install PODS 2026 to your home screen for instantaneous loading and native haptic feedback.
              </p>
              <PWAInstallButton />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
