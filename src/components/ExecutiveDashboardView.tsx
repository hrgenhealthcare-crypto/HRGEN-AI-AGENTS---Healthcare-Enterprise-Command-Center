import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, PhoneCall, TrendingUp, Users, CheckCircle2, 
  Clock, ShieldCheck, ShoppingBag, Globe2, Sparkles, 
  MessageSquare, ArrowRight, Zap, Download, Layers, 
  CreditCard, Calendar, BarChart3, ChevronRight, Plus, Database
} from 'lucide-react';
import { BusinessServiceOrProduct, BusinessLead, AgentPod } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { HolographicAgentCore } from './HolographicAgentCore';
import { sharedElementSpring } from '../utils/motionTransitions';

interface ExecutiveDashboardViewProps {
  pods: AgentPod[];
  leads: BusinessLead[];
  onNavigateTab: (tab: 'dashboard' | 'studio' | 'copilot' | 'crm' | 'whatsapp' | 'marketing') => void;
  onOpenNewLeadModal: () => void;
  onOrderServiceDirect: (service: BusinessServiceOrProduct) => void;
  onOpenSqlModal?: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  pods,
  leads,
  onNavigateTab,
  onOpenNewLeadModal,
  onOrderServiceDirect,
  onOpenSqlModal,
}) => {
  const [productFilter, setProductFilter] = useState<'all' | 'voice' | 'whatsapp' | 'growth'>('all');

  const enterpriseServices: BusinessServiceOrProduct[] = [
    {
      id: 'SERV-01',
      name: 'Ultra-Fast Autonomous Voice Telephony Seat (<140ms)',
      category: 'Enterprise Voice & Telephony',
      type: 'voice_seat',
      price: 7500,
      mrp: 15000,
      tat: 'Instant Activation',
      description: 'Ultra-low latency conversational voice agent on Groq STT + Gemini Flash 2.5 + Kokoro TTS with hold chime audio transfer and manager alert.',
      features: ['<140ms Voice Processing Latency', '15-20 Words Strict Brevity Limit', 'Hold Chime Audio Transfer', 'Manager Handover Alert Card', 'Full Webphone & SIP Bench'],
    },
    {
      id: 'SERV-02',
      name: 'WhatsApp Business Cloud API Suite & Automation',
      category: 'WhatsApp Cloud Suite',
      type: 'saas_license',
      price: 4999,
      mrp: 9000,
      tat: 'Instant Setup',
      description: 'Official WhatsApp Business Cloud API with 2-way AI concierge, auto-brochure dispatch, and instant UPI/Card checkout link generation.',
      features: ['Official Meta Cloud API Verified', 'Two-Way AI Triage Bot', 'Instant UPI & Card Checkout Links', '1-Tap Escalate to Live Call', 'Zero Infrastructure Overhead'],
    },
    {
      id: 'SERV-03',
      name: 'AEO / GEO (Generative Engine Optimization) Pack',
      category: 'Digital Growth & SEO/GEO',
      type: 'growth_package',
      price: 14999,
      mrp: 28000,
      tat: '48h Deployment',
      description: 'Deploys structured JSON-LD Schema entities to rank your enterprise as the #1 recommended solution on ChatGPT, Gemini, Perplexity, and Apple Intelligence.',
      features: ['Schema.org JSON-LD Entities', 'Perplexity Answer Citation', 'Google Local Map Pack Boost', 'FAQ Search Knowledge Graph'],
    },
    {
      id: 'SERV-04',
      name: 'Meta Ads & Google Search Ads Autonomous Retainer',
      category: 'Digital Growth & SEO/GEO',
      type: 'growth_package',
      price: 11999,
      mrp: 22000,
      tat: '24h Launch',
      description: 'Autonomous ad generation and negative keyword curation across Meta Ads and Google Search with bilingual copy and instant call triggers.',
      features: ['Bilingual Ad Creatives (Hindi & English)', 'Negative Keyword Defense', 'Instant Voice Lead Dial', 'Live ROAS Tracking'],
    },
    {
      id: 'SERV-05',
      name: 'Custom Dedicated Agent Fine-Tuning & SIP Trunk',
      category: 'Enterprise Voice & Telephony',
      type: 'voice_seat',
      price: 24999,
      mrp: 45000,
      tat: '72h Turnaround',
      description: 'Private fine-tuned agent trained on your proprietary sales playbooks, objection matrices, and custom company pricing sheets.',
      features: ['Proprietary Company Fine-Tuning', 'Dedicated Voice Clone (Kore/Zephyr)', 'Private SIP Trunk DID Routing', 'Self-Evolution Engine'],
    },
    {
      id: 'SERV-06',
      name: '24/7 Multi-Tenant Client Support Pod Retainer',
      category: 'Client Care Retainer',
      type: 'support_plan',
      price: 8999,
      mrp: 18000,
      tat: 'Instant Boot',
      description: 'Automated 24/7 omnichannel customer care resolving tickets, shipment queries, and scheduling meetings with CRM synchronization.',
      features: ['Automated Ticket Resolution', 'Omnichannel Voice & WhatsApp', 'Live CRM Pipeline Integration', '99.5% First-Turn Accuracy'],
    },
  ];

  const filteredServices = enterpriseServices.filter((item) => {
    if (productFilter === 'all') return true;
    if (productFilter === 'voice') return item.category.includes('Voice');
    if (productFilter === 'whatsapp') return item.category.includes('WhatsApp');
    if (productFilter === 'growth') return item.category.includes('Growth');
    return true;
  });

  const totalPipelineRevenue = leads.reduce((sum, l) => sum + (l.value || 0), 0) + 185000;

  return (
    <div className="space-y-6 pb-12">
      {/* 2026 Interactive Hero with 3D Holographic Core */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 3D Holographic Agent Core */}
        <div className="lg:col-span-5">
          <HolographicAgentCore
            activePodName={pods[0]?.name || 'Dr. Ritu Verma'}
            podRole={pods[0]?.role || 'Inbound Reception & Smart Handover'}
            voiceEngine="Kore (Neural TTS)"
            channel="Voice Telephony · <140ms"
            latencyMs={138}
            onTapCore={() => onNavigateTab('copilot')}
            className="h-full"
          />
        </div>

        {/* Right: Executive Fleet Command Center */}
        <div className="lg:col-span-7 bg-[#0b1220]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold tracking-wide">PODS 2026 · AUTONOMOUS FLEET CORE</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400">PWA 2026 READY</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Autonomous Agent Pods & Telephony Hub
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Orchestrate low-latency Voice Calling Agents (&lt;140ms), WhatsApp automation bots, and Autonomous Growth managers with live PostgreSQL multi-tenant isolation.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => onNavigateTab('copilot')}
                className="min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Launch Live Voice Dial</span>
              </button>

              <button
                onClick={() => onNavigateTab('studio')}
                className="min-h-[44px] px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all active:scale-95"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>10 Agent Pods</span>
              </button>

              {onOpenSqlModal && (
                <button
                  onClick={onOpenSqlModal}
                  className="min-h-[44px] px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-cyan-500/20 transition-all active:scale-95"
                >
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>SQL Schema (RLS)</span>
                </button>
              )}
            </div>
          </div>

          {/* Top KPI Metrics Strip (Zero-Pill Discipline) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 font-mono-numbers text-xs">
            <div className="bg-[#050811]/70 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Active Pods</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400 block mt-0.5 font-display">
                {pods.length || 10}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Voice · WhatsApp · Web</span>
            </div>

            <div className="bg-[#050811]/70 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Engine Latency</span>
              <span className="text-xl sm:text-2xl font-bold text-cyan-400 block mt-0.5 font-display">
                135 ms
              </span>
              <span className="text-[10px] text-cyan-300 mt-1 block">Groq + Gemini Flash</span>
            </div>

            <div className="bg-[#050811]/70 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Pipeline Revenue</span>
              <span className="text-xl sm:text-2xl font-bold text-white block mt-0.5 font-display">
                ₹{(totalPipelineRevenue / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] text-emerald-400 mt-1 block">+24.5% conversion</span>
            </div>

            <div className="bg-[#050811]/70 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-400 block font-sans">Total Turns</span>
              <span className="text-xl sm:text-2xl font-bold text-violet-400 block mt-0.5 font-display">
                {pods.reduce((acc, p) => acc + (p.stats?.interactions || 0), 0) || 540}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Zero human fatigue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad Grid (Tactile 2026 Cyber Glass) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => onNavigateTab('copilot')}
          className="p-4 rounded-2xl bg-[#0b1220]/70 border border-white/10 hover:border-emerald-500/50 text-left transition-all active:scale-95 group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-white font-display">Voice Webphone</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            Live mic speech · &lt;140ms HUD
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('studio')}
          className="p-4 rounded-2xl bg-[#0b1220]/70 border border-white/10 hover:border-cyan-500/50 text-left transition-all active:scale-95 group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-white font-display">10 Agent Pods</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            Tune prompts & self-evolution
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('whatsapp')}
          className="p-4 rounded-2xl bg-[#0b1220]/70 border border-white/10 hover:border-emerald-500/50 text-left transition-all active:scale-95 group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-white font-display">WhatsApp Suite</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            Auto-dispatches & payment links
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('crm')}
          className="p-4 rounded-2xl bg-[#0b1220]/70 border border-white/10 hover:border-violet-500/50 text-left transition-all active:scale-95 group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-white font-display">Lead Pipeline</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            5 deal stages · 1-click calls
          </p>
        </button>
      </div>

      {/* Autonomous Agent Pod Fleet — Shared Element Preview */}
      <div className="bg-[#0b1220]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <Bot className="w-3.5 h-3.5" />
              <span>10 AUTONOMOUS AGENT PODS FLEET</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 font-display">
              Active Business Agents & Telephony Roster
            </h2>
            <p className="text-xs text-slate-400">
              Click any agent pod to morph into the full Agent Studio editor with continuous shared element motion.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('studio')}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <span>Open All in Agent Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Featured Pod Cards with Shared layoutId */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pods.slice(0, 3).map((pod) => (
            <motion.div
              key={pod.id}
              layoutId={`pod-card-container-${pod.id}`}
              transition={sharedElementSpring}
              whileHover={{ y: -4 }}
              onClick={() => onNavigateTab('studio')}
              className="bg-[#070b14]/90 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      layoutId={`pod-avatar-${pod.id}`}
                      transition={sharedElementSpring}
                      className="w-10 h-10 rounded-xl bg-[#050811] border border-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform shrink-0"
                    >
                      {pod.avatar}
                    </motion.div>
                    <div>
                      <motion.h3
                        layoutId={`pod-name-${pod.id}`}
                        transition={sharedElementSpring}
                        className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors font-display"
                      >
                        {pod.name}
                      </motion.h3>
                      <motion.span
                        layoutId={`pod-title-${pod.id}`}
                        transition={sharedElementSpring}
                        className="text-[10px] text-slate-400 block truncate max-w-[170px]"
                      >
                        {pod.title}
                      </motion.span>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    ACTIVE
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2 italic bg-[#050811]/60 p-2.5 rounded-xl border border-white/5">
                  "{pod.greeting}"
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <motion.span
                  layoutId={`pod-voice-${pod.id}`}
                  transition={sharedElementSpring}
                  className="text-cyan-400 font-medium"
                >
                  {pod.voiceId} Audio
                </motion.span>
                <span className="text-emerald-400 flex items-center gap-1 font-sans font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Edit in Studio</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Commercial Services & Products Catalog */}
      <div className="bg-[#0b1220]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>COMMERCIAL AGENT PODS & DIGITAL LICENSES</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 font-display">
              Enterprise Voice Seats, WhatsApp Licenses & Growth Packs
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Directly activate new software licenses, private SIP trunks, and autonomous marketing engines.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl text-xs font-medium">
            <button
              onClick={() => setProductFilter('all')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-colors ${
                productFilter === 'all' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Offerings
            </button>
            <button
              onClick={() => setProductFilter('voice')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-colors ${
                productFilter === 'voice' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voice Seats
            </button>
            <button
              onClick={() => setProductFilter('whatsapp')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-colors ${
                productFilter === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp API
            </button>
            <button
              onClick={() => setProductFilter('growth')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg transition-colors ${
                productFilter === 'growth' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Growth & AEO
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((prod) => (
            <div
              key={prod.id}
              className="p-5 rounded-2xl border border-white/10 bg-[#070b14]/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider font-mono">
                    {prod.category}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">{prod.tat}</span>
                </div>

                <h3 className="font-bold text-sm text-white leading-snug group-hover:text-emerald-400 transition-colors font-display">
                  {prod.name}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {prod.description}
                </p>

                {/* Features checklist */}
                <div className="mt-3.5 space-y-1.5">
                  {prod.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block line-through font-mono">
                    ₹{prod.mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="text-base font-bold text-white font-mono">
                    ₹{prod.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => onOrderServiceDirect(prod)}
                  className="min-h-[44px] px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Activate License</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Agent Pods Status Row (Zero-Pill Discipline) */}
      <div className="bg-[#0b1220]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="font-bold text-sm text-white font-display">
              Active Agent Pods Fleet Status (10 Pods)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live satisfaction rating, voice model, and turn counts across all booted pods.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('studio')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 min-h-[44px]"
          >
            <span>Open Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pods.map((pod) => (
            <div
              key={pod.id}
              className="p-3.5 rounded-2xl border border-white/10 bg-[#070b14]/70 flex items-center justify-between gap-3 text-xs hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pod.avatar}</span>
                <div>
                  <span className="font-bold text-white block">{pod.name}</span>
                  <span className="text-[11px] text-slate-400">{pod.role}</span>
                </div>
              </div>
              <div className="text-right font-mono text-[11px]">
                <span className="text-emerald-400 font-bold block">{pod.stats?.satisfaction || '98.5%'}</span>
                <span className="text-slate-400">{pod.stats?.interactions || 42} turns</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
