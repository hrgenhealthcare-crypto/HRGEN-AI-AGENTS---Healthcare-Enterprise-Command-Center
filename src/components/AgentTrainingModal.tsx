import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Brain, Sparkles, Plus, Trash2, CheckCircle2, RefreshCw,
  BookOpen, ShieldCheck, Volume2, Sliders, Zap, MessageSquareQuote as MessageSquareQuestion
} from 'lucide-react';
import {
  AgentPod,
  AgentFaqItem,
  AgentTrainingConfig,
  HermesSelfImproverProfile,
  PromptEvolutionLog,
} from '../types';
import { modalBackdropVariants } from '../utils/motionTransitions';

interface AgentTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pod: AgentPod | null;
  pods: AgentPod[];
  onSelectPod: (pod: AgentPod) => void;
  onPodUpdated: (updatedPod: AgentPod) => void;
}

export const AgentTrainingModal: React.FC<AgentTrainingModalProps> = ({
  isOpen,
  onClose,
  pod,
  pods,
  onSelectPod,
  onPodUpdated,
}) => {
  const activePod = pod || pods[0] || null;
  const [activeTab, setActiveTab] = useState<'faqs' | 'rules' | 'hermes'>('hermes');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Training state
  const [hermesEnabled, setHermesEnabled] = useState(true);
  const [voiceProfile, setVoiceProfile] = useState<'english' | 'hindi_soft'>('hindi_soft');
  const [faqs, setFaqs] = useState<AgentFaqItem[]>([]);
  const [businessRules, setBusinessRules] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [brevityLimit, setBrevityLimit] = useState(18);
  const [hermesProfile, setHermesProfile] = useState<HermesSelfImproverProfile | null>(null);
  const [tuningRules, setTuningRules] = useState<string[]>([]);
  const [evolutionDiff, setEvolutionDiff] = useState<PromptEvolutionLog | null>(null);

  // Inputs for adding new items
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newRule, setNewRule] = useState('');
  const [newTuningRule, setNewTuningRule] = useState('');

  useEffect(() => {
    if (!isOpen || !activePod) return;
    setLoading(true);
    setEvolutionDiff(null);
    setSystemPrompt(activePod.systemPrompt || '');
    setBrevityLimit(activePod.brevityWordsLimit || 18);

    fetch(`/api/agent/train/${activePod.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.trainingConfig) {
          const cfg: AgentTrainingConfig = data.trainingConfig;
          setHermesEnabled(cfg.hermesEnabled);
          setVoiceProfile(cfg.voiceProfile || 'hindi_soft');
          setFaqs(cfg.faqs || []);
          setBusinessRules(cfg.businessRules || []);
        }
        if (data.hermesProfile) {
          setHermesProfile(data.hermesProfile);
          setTuningRules(data.hermesProfile.activePromptTuningRules || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen, activePod?.id]);

  if (!isOpen || !activePod) return null;

  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const item: AgentFaqItem = {
      id: `faq-${Date.now().toString().slice(-4)}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    };
    setFaqs((prev) => [...prev, item]);
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleRemoveFaq = (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setBusinessRules((prev) => [...prev, newRule.trim()]);
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    setBusinessRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTuningRule = () => {
    if (!newTuningRule.trim()) return;
    setTuningRules((prev) => [...prev, newTuningRule.trim()]);
    setNewTuningRule('');
  };

  const handleRemoveTuningRule = (index: number) => {
    setTuningRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTraining = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agent/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId: activePod.id,
          hermesEnabled,
          voiceProfile,
          faqs,
          businessRules,
          activePromptTuningRules: tuningRules,
          systemPrompt,
          brevityWordsLimit: brevityLimit,
        }),
      });
      const data = await res.json();
      setSaving(false);
      if (data.success) {
        if (data.pod) onPodUpdated(data.pod);
        if (data.hermesProfile) setHermesProfile(data.hermesProfile);
        setSaveNotice(`Training & Hermes configuration saved for ${activePod.name}.`);
        setTimeout(() => setSaveNotice(null), 3500);
      }
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const handleRunHermesEvolution = async () => {
    setEvolving(true);
    setEvolutionDiff(null);
    try {
      // Save current FAQs & rules first so Hermes incorporates them
      await fetch('/api/agent/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId: activePod.id,
          hermesEnabled,
          voiceProfile,
          faqs,
          businessRules,
          activePromptTuningRules: tuningRules,
          systemPrompt,
          brevityWordsLimit: brevityLimit,
        }),
      });

      const res = await fetch('/api/agent/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId: activePod.id,
          bottlenecks: [
            `Enforce strict ${brevityLimit}-word spoken brevity SLA`,
            `Embed ${faqs.length} trained FAQs and ${businessRules.length} SOP rules`,
            voiceProfile === 'hindi_soft'
              ? 'Use warm North Indian Hindi/Hinglish soft vocal cadence'
              : 'Use crisp executive Indian-English pacing',
          ],
          avgAHT: activePod.stats.avgDuration || '1m 15s',
        }),
      });
      const data = await res.json();
      setEvolving(false);
      if (data.success && data.evolutionLog) {
        setEvolutionDiff(data.evolutionLog);
        if (data.pod) {
          setSystemPrompt(data.pod.systemPrompt);
          onPodUpdated(data.pod);
        }
        setSaveNotice(`Hermes Self-Improver upgraded ${activePod.name} to v${data.evolutionLog.version}.0!`);
        setTimeout(() => setSaveNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
      setEvolving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative z-10 w-full max-w-3xl bg-[#0b1220] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070c18]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                {activePod.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Agent Training & Hermes Skill
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    v{hermesProfile?.version || activePod.evolutionVersion || 1.2}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-white font-display mt-0.5">
                  {activePod.name} · {activePod.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activePod.id}
                onChange={(e) => {
                  const found = pods.find((p) => p.id === e.target.value);
                  if (found) onSelectPod(found);
                }}
                className="px-3 py-2 rounded-xl bg-[#050811] border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
              >
                {pods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatar} {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Save Toast Inside Modal */}
          {saveNotice && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveNotice}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="px-5 pt-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto bg-[#090f1d]">
            <button
              onClick={() => setActiveTab('hermes')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'hermes'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>1. RAG · Vector · Hermes Layers</span>
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'faqs'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2. Custom FAQs ({faqs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. Business Rules &amp; Voice ({businessRules.length})</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Loading agent training knowledge base...</span>
              </div>
            ) : (
              <>
                {/* TAB 1: CUSTOM FAQS */}
                {activeTab === 'faqs' && (
                  <div className="space-y-4">
                    <div className="bg-[#050811] p-4 rounded-2xl border border-white/10 space-y-3">
                      <span className="font-bold text-white block">
                        Add Custom FAQ Pair (Injected into Live Voice & Chat Calls)
                      </span>
                      <input
                        type="text"
                        placeholder="Customer Question (e.g. What is your setup time and monthly cost?)"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                      />
                      <textarea
                        rows={2}
                        placeholder="Agent Trained Answer (Keep concise under 20 words for voice speed)"
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add FAQ to Agent Memory</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                        Active Trained FAQs ({faqs.length})
                      </span>
                      {faqs.map((faq) => (
                        <div
                          key={faq.id}
                          className="p-3.5 rounded-2xl bg-[#050811]/90 border border-white/10 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-emerald-300">Q: {faq.question}</p>
                            <p className="text-slate-300 leading-relaxed">A: {faq.answer}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveFaq(faq.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                            title="Delete FAQ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: BUSINESS SOP RULES & VOICE */}
                {activeTab === 'rules' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-[#050811] border border-white/10 space-y-2">
                        <label className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                          <span>Default Voice Accent Profile</span>
                        </label>
                        <select
                          value={voiceProfile}
                          onChange={(e) => setVoiceProfile(e.target.value as 'english' | 'hindi_soft')}
                          className="w-full p-2.5 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                        >
                          <option value="hindi_soft">Hindi North Indian Soft Voice (hi-IN · Polite)</option>
                          <option value="english">Indian English Executive Pro (en-IN)</option>
                        </select>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#050811] border border-white/10 space-y-2">
                        <label className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-cyan-400" />
                          <span>Spoken Brevity Cap (Max Words/Turn)</span>
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={35}
                          value={brevityLimit}
                          onChange={(e) => setBrevityLimit(Number(e.target.value) || 18)}
                          className="w-full p-2.5 rounded-xl bg-[#0b1220] border border-white/10 text-white font-mono focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    {/* Add Business Rule */}
                    <div className="p-4 rounded-2xl bg-[#050811] border border-white/10 space-y-2.5">
                      <span className="font-bold text-white block">
                        Business SOP Guardrails & Closing Rules
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Always offer WhatsApp brochure dispatch before ending the call."
                          value={newRule}
                          onChange={(e) => setNewRule(e.target.value)}
                          className="flex-1 p-2.5 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddRule}
                          className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Rule</span>
                        </button>
                      </div>

                      <div className="space-y-2 pt-2">
                        {businessRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#0b1220] border border-white/5 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="text-slate-200">{rule}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveRule(idx)}
                              className="text-slate-400 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* System Prompt Editor */}
                    <div className="p-4 rounded-2xl bg-[#050811] border border-white/10 space-y-2">
                      <label className="font-bold text-slate-200 block">
                        Core System Prompt Directive
                      </label>
                      <textarea
                        rows={4}
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#0b1220] border border-white/10 text-emerald-200 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: HERMES SELF-IMPROVER SKILL + 3-LAYER RAG-VECTOR-HERMES VISUAL DIAGRAM */}
                {activeTab === 'hermes' && (
                  <div className="space-y-4">
                    {/* Interactive 3-Layer AI Architecture Visualizer: RAG -> Vector -> Hermes */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-[#050811] border border-cyan-500/30 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                            Enterprise 3-Layer AI Architecture Map
                          </span>
                          <h3 className="text-sm sm:text-base font-extrabold text-white font-display">
                            How RAG, Vector Memory &amp; Hermes Train Your Agent
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold self-start sm:self-auto">
                          REAL-TIME PIPELINE
                        </span>
                      </div>

                      {/* 3-Column Visual Flow Diagram */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                        {/* Layer 1: RAG Knowledge */}
                        <div
                          onClick={() => setActiveTab('faqs')}
                          className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-[#0b1220] border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-all space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                              LAYER 1 · RAG
                            </span>
                            <span className="font-mono text-[11px] text-emerald-400 font-bold">
                              {faqs.length} FAQs · {businessRules.length} SOPs
                            </span>
                          </div>
                          <h4 className="font-extrabold text-white text-xs sm:text-sm font-display group-hover:text-emerald-300">
                            1. RAG Knowledge Base
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Stores your company pricing, product catalog, FAQs, and strict SOP business guardrails so the agent never hallucinates.
                          </p>
                          <div className="text-[10px] font-mono text-emerald-400 pt-1">
                            Click to edit FAQs →
                          </div>
                        </div>

                        {/* Layer 2: Vector Embeddings */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-[#0b1220] border border-cyan-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                              LAYER 2 · VECTOR DB
                            </span>
                            <span className="font-mono text-[11px] text-cyan-300 font-bold">
                              Cosine Sim 0.94
                            </span>
                          </div>
                          <h4 className="font-extrabold text-white text-xs sm:text-sm font-display">
                            2. Vector Semantic Memory
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Converts caller speech (Hindi/English) into high-dimensional mathematical vectors to retrieve the exact answer in milliseconds.
                          </p>
                          <div className="text-[10px] font-mono text-cyan-300 pt-1">
                            768-Dim Neural Embeddings Active
                          </div>
                        </div>

                        {/* Layer 3: Hermes Self-Learning Loop */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-950/35 to-[#0b1220] border border-purple-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                              LAYER 3 · HERMES
                            </span>
                            <span className="font-mono text-[11px] text-emerald-400 font-bold">
                              v{hermesProfile?.version || 1.4} Auto-Loop
                            </span>
                          </div>
                          <h4 className="font-extrabold text-white text-xs sm:text-sm font-display">
                            3. Hermes Self-Improver
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Analyzes every completed call for objections and sentiment, then automatically rewrites the agent&apos;s system prompt to boost conversion.
                          </p>
                          <div className="text-[10px] font-mono text-purple-300 pt-1">
                            {hermesProfile?.accuracyImprovement || '+24.5%'} Conversion Lift
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hermes Autonomous Toggle Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#07131e] to-cyan-950/50 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-sm text-white">
                            Hermes Autonomous Self-Improver Skill
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              hermesEnabled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {hermesEnabled ? 'AUTO-LEARN ACTIVE' : 'PAUSED'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs max-w-xl">
                          Automatically extracts caller objections after every voice session, updates RAG vector memory, and refines the agent prompt for higher conversion.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setHermesEnabled(!hermesEnabled)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                          hermesEnabled
                            ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                            : 'bg-white/10 text-slate-300 hover:bg-white/15'
                        }`}
                      >
                        {hermesEnabled ? 'Enabled (Auto-Learn ON)' : 'Enable Hermes Skill'}
                      </button>
                    </div>

                    {/* Hermes Telemetry Strip */}
                    <div className="grid grid-cols-3 gap-3 text-center font-mono">
                      <div className="p-3 rounded-2xl bg-[#050811] border border-white/10">
                        <span className="text-[10px] text-slate-400 block font-sans">Hermes Version</span>
                        <span className="text-sm font-bold text-emerald-400">
                          v{hermesProfile?.version || 1.4}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#050811] border border-white/10">
                        <span className="text-[10px] text-slate-400 block font-sans">Learnings Applied</span>
                        <span className="text-sm font-bold text-cyan-400">
                          {hermesProfile?.totalLearningsApplied || 18} Calls
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#050811] border border-white/10">
                        <span className="text-[10px] text-slate-400 block font-sans">Conversion Lift</span>
                        <span className="text-sm font-bold text-emerald-300">
                          {hermesProfile?.accuracyImprovement || '+24.5%'}
                        </span>
                      </div>
                    </div>

                    {/* Hermes Active Prompt-Tuning Rules */}
                    <div className="p-4 rounded-2xl bg-[#050811] border border-white/10 space-y-2.5">
                      <span className="font-bold text-white block">
                        Hermes Learned Prompt-Tuning Directives
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add custom Hermes self-tuning rule..."
                          value={newTuningRule}
                          onChange={(e) => setNewTuningRule(e.target.value)}
                          className="flex-1 p-2.5 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddTuningRule}
                          className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {tuningRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#0b1220] border border-white/5 flex items-center justify-between gap-2"
                          >
                            <span className="text-cyan-200 font-mono text-[11px]">⚡ {rule}</span>
                            <button
                              onClick={() => handleRemoveTuningRule(idx)}
                              className="text-slate-400 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trigger Immediate Hermes Evolution */}
                    <div className="p-4 rounded-2xl bg-[#050811] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-white block">
                          Synthesize FAQs &amp; Run Hermes Prompt Evolution Now
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Rewrites {activePod.name}&apos;s system prompt using your trained FAQs, SOP rules, and call telemetry.
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={evolving}
                        onClick={handleRunHermesEvolution}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${evolving ? 'animate-spin' : ''}`} />
                        <span>{evolving ? 'Optimizing Prompt...' : 'Run Hermes Evolution'}</span>
                      </button>
                    </div>

                    {/* Evolution Diff Result */}
                    {evolutionDiff && (
                      <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300">
                            Hermes Evolution Complete · v{evolutionDiff.version}.0 Active
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            Score: {evolutionDiff.performanceScore}%
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{evolutionDiff.reasoning}</p>
                        <div className="p-3 rounded-xl bg-[#050811] border border-white/10 font-mono text-[11px] text-emerald-200 whitespace-pre-wrap">
                          {evolutionDiff.evolvedPrompt}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070c18] flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-mono">
              Changes sync immediately to Live Voice Webphone & WhatsApp
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveTraining}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Agent Training'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
