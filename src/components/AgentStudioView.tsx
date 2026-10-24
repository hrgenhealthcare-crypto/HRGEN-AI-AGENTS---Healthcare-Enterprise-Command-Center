import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Plus, PhoneCall, MessageSquare, Globe, Sparkles, 
  Settings2, CheckCircle2, Sliders, Shield, Volume2, 
  Zap, Copy, Check, ArrowRight, Play, Edit3, Trash2,
  RefreshCw, FileCode2, Download, ArrowUpRight, ShieldCheck,
  TrendingUp, Activity, Database, Brain
} from 'lucide-react';
import { AgentPod, AgentChannel, AgentRoleType, IndustryType, PromptEvolutionLog } from '../types';
import { sharedElementSpring, modalBackdropVariants } from '../utils/motionTransitions';
import { WorkingAgentFlipCard } from './WorkingAgentFlipCard';
import { StarRingBackground } from './StarRingBackground';

interface AgentStudioViewProps {
  pods: AgentPod[];
  onLaunchVoiceTest: (pod: AgentPod) => void;
  onLaunchWhatsAppTest: (pod: AgentPod) => void;
  onLaunchBotConsole?: (pod: AgentPod) => void;
  onCreatePod: (newPod: Partial<AgentPod>) => void;
  onUpdatePod: (podId: string, updates: Partial<AgentPod>) => void;
  onDeletePod: (podId: string) => void;
  onOpenTrainModal?: (pod: AgentPod) => void;
  onOpenSettingsDrawer?: () => void;
}

export const AgentStudioView: React.FC<AgentStudioViewProps> = ({
  pods,
  onLaunchVoiceTest,
  onLaunchWhatsAppTest,
  onLaunchBotConsole,
  onCreatePod,
  onUpdatePod,
  onDeletePod,
  onOpenTrainModal,
  onOpenSettingsDrawer,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'voice' | 'whatsapp' | 'swarm_bots' | 'marketing' | 'operations'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPod, setEditingPod] = useState<AgentPod | null>(null);

  // Self-Evolution Bench State
  const [activeEvolutionPod, setActiveEvolutionPod] = useState<AgentPod | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionResult, setEvolutionResult] = useState<PromptEvolutionLog | null>(null);
  const [evolutionSuccessNotice, setEvolutionSuccessNotice] = useState<string | null>(null);

  // FastAPI Export Sheet State
  const [isFastApiModalOpen, setIsFastApiModalOpen] = useState(false);
  const [fastApiData, setFastApiData] = useState<{ filename: string; architecture: string; costPerMin: string; code: string } | null>(null);
  const [copiedFastApiCode, setCopiedFastApiCode] = useState(false);

  // PostgreSQL / Supabase SQL Schema Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlData, setSqlData] = useState<{ filename: string; engine: string; tables: string[]; sql: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form states for Create/Edit
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formRole, setFormRole] = useState<AgentRoleType>('Inbound Receptionist Pod');
  const [formChannel, setFormChannel] = useState<AgentChannel>('voice');
  const [formVoiceId, setFormVoiceId] = useState<'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Aoede'>('Kore');
  const [formIndustry, setFormIndustry] = useState<IndustryType>('Universal Business');
  const [formGreeting, setFormGreeting] = useState('');
  const [formSystemPrompt, setFormSystemPrompt] = useState('');
  const [formBrevity, setFormBrevity] = useState(18);

  const filteredPods = pods.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'voice') return p.id === 'pod-01' || p.id === 'pod-02' || p.channel === 'voice';
    if (selectedCategory === 'whatsapp') return p.id === 'pod-03' || p.channel === 'whatsapp';
    if (selectedCategory === 'swarm_bots') return p.id !== 'pod-01' && p.id !== 'pod-02' && p.id !== 'pod-03';
    if (selectedCategory === 'marketing') return p.role.includes('Marketing') || p.role.includes('SEO') || p.role.includes('Branding') || p.role.includes('Designer');
    if (selectedCategory === 'operations') return p.role.includes('Auditor') || p.role.includes('Operations') || p.role.includes('Google');
    return true;
  });

  const openCreateModal = () => {
    setEditingPod(null);
    setFormName('');
    setFormTitle('Autonomous Business Pod');
    setFormRole('Inbound Receptionist Pod');
    setFormChannel('voice');
    setFormVoiceId('Kore');
    setFormIndustry('Universal Business');
    setFormGreeting('Hello! Thank you for contacting our enterprise. How may I assist your booking today?');
    setFormSystemPrompt(`You are an autonomous enterprise voice AI agent.
Keep responses strictly under 18 words.
Role: Collect caller name, inquiry, and preferred schedule.
Transfer rule: If complex, say: "Let me check this with the manager, please hold while I transfer your call."`);
    setFormBrevity(18);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (pod: AgentPod) => {
    setEditingPod(pod);
    setFormName(pod.name);
    setFormTitle(pod.title);
    setFormRole(pod.role);
    setFormChannel(pod.channel);
    setFormVoiceId(pod.voiceId);
    setFormIndustry(pod.industryFocus);
    setFormGreeting(pod.greeting);
    setFormSystemPrompt(pod.systemPrompt);
    setFormBrevity(pod.brevityWordsLimit);
    setIsCreateModalOpen(true);
  };

  const handleSavePod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPod) {
      onUpdatePod(editingPod.id, {
        name: formName,
        title: formTitle,
        role: formRole,
        channel: formChannel,
        voiceId: formVoiceId,
        industryFocus: formIndustry,
        greeting: formGreeting,
        systemPrompt: formSystemPrompt,
        brevityWordsLimit: formBrevity,
      });
    } else {
      onCreatePod({
        name: formName,
        title: formTitle,
        role: formRole,
        channel: formChannel,
        voiceId: formVoiceId,
        industryFocus: formIndustry,
        greeting: formGreeting,
        systemPrompt: formSystemPrompt,
        brevityWordsLimit: formBrevity,
        status: 'Active',
      });
    }
    setIsCreateModalOpen(false);
  };

  // Trigger Victor/Hermes Recursive Self-Evolution
  const handleTriggerEvolution = async (pod: AgentPod) => {
    setActiveEvolutionPod(pod);
    setIsEvolving(true);
    setEvolutionResult(null);

    try {
      const res = await fetch('/api/agent/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId: pod.id,
          bottlenecks: [
            'Tighten opening greeting to <15 words',
            'Overcome hesitation and drive immediate calendar confirmation',
            'Strengthen manager handover routing if scope exceeded'
          ],
          avgAHT: pod.stats.avgDuration || '1m 24s',
        }),
      });

      const data = await res.json();
      setIsEvolving(false);

      if (data.success && data.evolutionLog) {
        setEvolutionResult(data.evolutionLog);
        onUpdatePod(pod.id, {
          systemPrompt: data.pod.systemPrompt,
          evolutionVersion: data.pod.evolutionVersion,
        });
        setEvolutionSuccessNotice(`Autonomous evolution complete for ${pod.name} (v${data.pod.evolutionVersion || 2}.0 applied).`);
        setTimeout(() => setEvolutionSuccessNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to evolve prompt:', err);
      setIsEvolving(false);
    }
  };

  // Open Python FastAPI Telephony Export Sheet
  const handleOpenFastApiSheet = async () => {
    setIsFastApiModalOpen(true);
    if (!fastApiData) {
      try {
        const res = await fetch('/api/fastapi/export-sheet');
        const data = await res.json();
        setFastApiData(data);
      } catch (err) {
        console.error('Failed to load FastAPI sheet:', err);
      }
    }
  };

  const handleDownloadFastApiFile = () => {
    if (!fastApiData) return;
    const blob = new Blob([fastApiData.code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fastApiData.filename || 'universal_agent_pods_server.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyFastApiCode = () => {
    if (!fastApiData) return;
    navigator.clipboard.writeText(fastApiData.code);
    setCopiedFastApiCode(true);
    setTimeout(() => setCopiedFastApiCode(false), 2500);
  };

  const handleOpenSqlModal = async () => {
    setIsSqlModalOpen(true);
    if (!sqlData) {
      try {
        const res = await fetch('/api/database/migration-script');
        const data = await res.json();
        setSqlData(data);
      } catch (err) {
        console.error('Failed to load SQL schema:', err);
      }
    }
  };

  const handleDownloadSqlFile = () => {
    if (!sqlData) return;
    const blob = new Blob([sqlData.sql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = sqlData.filename || '20261024000001_multi_tenant_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySql = () => {
    if (!sqlData) return;
    navigator.clipboard.writeText(sqlData.sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Apple Glass Header (Name and Tab Name Only) */}
      <div className="relative overflow-hidden apple-glass-card text-white p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <StarRingBackground variant="card" accentColor="#06b6d4" secondaryColor="#10b981" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 font-mono">
            <Bot className="w-4 h-4" />
            <span>Agent Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
            Agent Team
          </h1>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenTrainModal && pods.length > 0 && (
            <button
              onClick={() => onOpenTrainModal(pods[0])}
              className="px-3.5 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 min-h-[44px]"
            >
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>Train & Hermes Skill</span>
            </button>
          )}

          {onOpenSettingsDrawer && (
            <button
              onClick={onOpenSettingsDrawer}
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 min-h-[44px]"
            >
              <Settings2 className="w-4 h-4 text-emerald-400" />
              <span>API & Settings</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Agent</span>
          </button>
        </div>
      </div>

      {evolutionSuccessNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{evolutionSuccessNotice}</span>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="bg-[#0b1220]/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Fleet (10)' },
            { id: 'voice', label: 'Voice Agents (2)' },
            { id: 'whatsapp', label: 'WhatsApp Bot (1)' },
            { id: 'swarm_bots', label: 'Swarm CLI / Browser / Lucas Bots (7)' },
            { id: 'marketing', label: 'Meta/Google Ads & SEO/GEO' },
            { id: 'operations', label: 'Lucas Audit & E-Com Ops' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl font-medium transition-all active:scale-95 whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-slate-400 text-[11px] px-2 font-mono tabular-nums">
          {filteredPods.length} Agents Active
        </div>
      </div>

      {/* 3D Interactive Flip Cards Grid with Framer Motion Sparkline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredPods.map((pod) => (
          <WorkingAgentFlipCard
            key={pod.id}
            pod={pod}
            onStartCall={onLaunchVoiceTest}
            onStartWhatsApp={onLaunchWhatsAppTest}
            onLaunchBotConsole={onLaunchBotConsole}
            onEvolvePrompt={handleTriggerEvolution}
            onTrainAgent={onOpenTrainModal}
          />
        ))}
      </div>

      {/* Hermes Self-Evolution Results Bench Modal (Dark Obsidian Glass) */}
      {(isEvolving || evolutionResult) && activeEvolutionPod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0b1220] text-slate-100 rounded-3xl p-6 shadow-2xl border border-emerald-500/30 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white font-display">
                  Hermes Self-Evolving Prompt Engine
                </h3>
              </div>
              <button
                onClick={() => {
                  setEvolutionResult(null);
                  setIsEvolving(false);
                }}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            {isEvolving ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <h4 className="font-bold text-sm text-white">
                  Hermes Recursive Prompt Optimization in Progress...
                </h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Synthesizing call bottlenecks, custom FAQs, and AHT latency stats to autonomously refine {activeEvolutionPod.name}&apos;s instructions.
                </p>
              </div>
            ) : evolutionResult && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-300 block">
                      Hermes Evolution Succeeded · Version {evolutionResult.version}.0
                    </span>
                    <span className="text-[11px] text-slate-300">
                      {evolutionResult.reasoning}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                      {evolutionResult.performanceScore}%
                    </span>
                    <span className="block text-[10px] text-slate-400">Accuracy Score</span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-200 block mb-1.5">Optimizations Applied:</span>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    {evolutionResult.optimizations.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>

                {/* Side-by-Side Prompt Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-[#050811] rounded-2xl border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Previous Version (v{evolutionResult.version - 1}.0)
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {evolutionResult.previousPrompt}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-950/30 rounded-2xl border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-300 block">
                      Evolved System Prompt (v{evolutionResult.version}.0 Active)
                    </span>
                    <p className="text-[11px] text-emerald-200 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap font-medium">
                      {evolutionResult.evolvedPrompt}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setEvolutionResult(null);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold rounded-xl text-xs hover:from-emerald-300 hover:to-teal-300"
                  >
                    Keep v{evolutionResult.version}.0 Active
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Python FastAPI VoIP Telephony Export Sheet Modal */}
      {isFastApiModalOpen && fastApiData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-base text-white">
                    Python FastAPI Telephony Architecture & Webhooks
                  </h3>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{fastApiData.architecture}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400 font-mono tabular-nums">{fastApiData.costPerMin}</span>
                </div>
              </div>
              <button
                onClick={() => setIsFastApiModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300 font-mono">{fastApiData.filename}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFastApiCode}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedFastApiCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFastApiCode ? 'Copied' : 'Copy Python Code'}</span>
                </button>
                <button
                  onClick={handleDownloadFastApiFile}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .py</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-teal-200/90 overflow-x-auto max-h-96">
              {fastApiData.code}
            </pre>
          </div>
        </div>
      )}

      {/* PostgreSQL / Supabase SQL Migration Modal */}
      {isSqlModalOpen && sqlData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col gap-4 text-white">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  <Database className="w-4 h-4" />
                  <span>Production Database Migration</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Multi-Tenant PostgreSQL / Supabase DDL Script
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>Engine: {sqlData.engine}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-teal-400">Row-Level Security (RLS)</span>
                  <span aria-hidden="true">·</span>
                  <span>{sqlData.tables?.length || 5} Tables</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400">10 Pods Seed Trigger</span>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300 font-mono">{sqlData.filename}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL Script'}</span>
                </button>
                <button
                  onClick={handleDownloadSqlFile}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-200/90 overflow-x-auto max-h-96">
              {sqlData.sql}
            </pre>
          </div>
        </div>
      )}

      {/* Create / Edit Modal with Full-Card Morph Shared Element Transition */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Fade */}
            <motion.div
              key="pod-edit-backdrop"
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingPod(null);
              }}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Morphing Card Dialog Container */}
            <motion.div
              layoutId={editingPod ? `pod-card-container-${editingPod.id}` : 'pod-card-container-new'}
              transition={sharedElementSpring}
              className="relative z-10 w-full max-w-xl bg-[#0b1220] rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/30 max-h-[90vh] overflow-y-auto text-slate-100"
            >
              {/* Header with shared avatar, name, and role */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <motion.div 
                    layoutId={editingPod ? `pod-avatar-${editingPod.id}` : 'pod-avatar-new'}
                    transition={sharedElementSpring}
                    className="w-12 h-12 rounded-2xl bg-[#050811] border border-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0"
                  >
                    {editingPod ? editingPod.avatar : '🤖'}
                  </motion.div>
                  <div>
                    <motion.h3 
                      layoutId={editingPod ? `pod-name-${editingPod.id}` : 'pod-name-new'}
                      transition={sharedElementSpring}
                      className="font-bold text-base text-white font-display"
                    >
                      {editingPod ? `Configure: ${editingPod.name}` : 'Create Autonomous Agent Pod'}
                    </motion.h3>
                    <motion.span 
                      layoutId={editingPod ? `pod-title-${editingPod.id}` : 'pod-title-new'}
                      transition={sharedElementSpring}
                      className="text-xs text-emerald-400 font-mono block mt-0.5"
                    >
                      {editingPod ? `${editingPod.title} · ${editingPod.channel.replace('_', ' ')}` : 'Universal Business Operations'}
                    </motion.span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingPod(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePod} className="mt-5 space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Agent Name & Title</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="p-2.5 rounded-xl border border-white/10 bg-[#050811] text-white focus:outline-none focus:border-emerald-400 font-sans"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Inbound Receptionist"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="p-2.5 rounded-xl border border-white/10 bg-[#050811] text-white focus:outline-none focus:border-emerald-400 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Agent Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as AgentRoleType)}
                      className="w-full p-2.5 rounded-xl border border-white/10 bg-[#050811] text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="Inbound Receptionist Pod">Inbound Receptionist Pod</option>
                      <option value="Outbound Sales Closer Pod">Outbound Sales Closer Pod</option>
                      <option value="WhatsApp Business Bot">WhatsApp Business Bot</option>
                      <option value="SEO/GEO/AEO Optimizer">SEO/GEO/AEO Optimizer</option>
                      <option value="Financial Leakage Auditor Pod">Financial Leakage Auditor Pod</option>
                      <option value="E-Commerce Operations & Inventory Pod">E-Commerce Operations & Inventory Pod</option>
                      <option value="Social Media Marketing Agent">Social Media Marketing Agent</option>
                      <option value="Google Web Agent">Google Web Agent</option>
                      <option value="Branding Agent">Branding Agent</option>
                      <option value="Graphic Designer Agent">Graphic Designer Agent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Primary Channel</label>
                    <select
                      value={formChannel}
                      onChange={(e) => setFormChannel(e.target.value as AgentChannel)}
                      className="w-full p-2.5 rounded-xl border border-white/10 bg-[#050811] text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="voice">Voice Call Only</option>
                      <option value="whatsapp">WhatsApp Only</option>
                      <option value="web_chat">Web Chat Only</option>
                      <option value="omnichannel">Omnichannel (All)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Voice Model</label>
                    <select
                      value={formVoiceId}
                      onChange={(e) => setFormVoiceId(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-white/10 bg-[#050811] text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="Kore">Kore (Warm, Professional)</option>
                      <option value="Fenrir">Fenrir (Authoritative, Closer)</option>
                      <option value="Zephyr">Zephyr (Fast, Helpful)</option>
                      <option value="Puck">Puck (Energetic, Clear)</option>
                      <option value="Aoede">Aoede (Articulate, Conversational)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Brevity Cap (Words)</label>
                    <input
                      type="number"
                      min="10"
                      max="40"
                      value={formBrevity}
                      onChange={(e) => setFormBrevity(parseInt(e.target.value) || 18)}
                      className="w-full p-2.5 rounded-xl border border-white/10 bg-[#050811] text-white focus:outline-none focus:border-emerald-400 font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Opening Greeting</label>
                  <input
                    type="text"
                    value={formGreeting}
                    onChange={(e) => setFormGreeting(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-[#050811] text-white focus:outline-none focus:border-emerald-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">System Prompt Directive</label>
                  <textarea
                    rows={4}
                    value={formSystemPrompt}
                    onChange={(e) => setFormSystemPrompt(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-[#050811] text-emerald-200/90 focus:outline-none focus:border-emerald-400 font-mono text-[11px] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingPod(null);
                    }}
                    className="px-4 py-2 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    Save & Deploy Pod
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
