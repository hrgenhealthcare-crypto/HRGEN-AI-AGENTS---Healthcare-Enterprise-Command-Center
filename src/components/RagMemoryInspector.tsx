import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, X, ShieldCheck, Zap, RefreshCw, 
  BookOpen, CheckCircle2, ChevronRight, Award, Plus, ArrowUpRight
} from 'lucide-react';
import { AgentPod, RagMemoryItem, HermesSelfImproverProfile } from '../types';

interface RagMemoryInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  podId: string;
  pods: AgentPod[];
}

export const RagMemoryInspector: React.FC<RagMemoryInspectorProps> = ({
  isOpen,
  onClose,
  podId,
  pods,
}) => {
  const [selectedPodId, setSelectedPodId] = useState(podId || 'pod-01');
  const [memories, setMemories] = useState<RagMemoryItem[]>([]);
  const [hermesProfile, setHermesProfile] = useState<HermesSelfImproverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const activePod = pods.find((p) => p.id === selectedPodId) || pods[0];

  useEffect(() => {
    if (podId) setSelectedPodId(podId);
  }, [podId]);

  const loadMemoryData = (id: string) => {
    setIsLoading(true);
    fetch(`/api/memory/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.memories) setMemories(data.memories);
        if (data.hermesProfile) setHermesProfile(data.hermesProfile);
      })
      .catch((err) => console.error('Failed to load RAG memory:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadMemoryData(selectedPodId);
    }
  }, [isOpen, selectedPodId]);

  const handleSimulateHermesLearning = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/memory/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId: selectedPodId,
          callId: `CALL-${Date.now().toString().slice(-4)}`,
          clientName: 'Enterprise Client',
          keyObjection: 'Contract term flexibility & data residency',
          transcriptSummary: 'Customer requested assurance that audio streams stay within Indian cloud regions. Agent confirmed local Kokoro-82M processing and secured demo commitment.',
        }),
      });
      const data = await res.json();
      if (data.newMemory) {
        setMemories((prev) => [data.newMemory, ...prev]);
        setHermesProfile(data.updatedProfile);
        setToast(`Hermes Self-Improver advanced to v${data.updatedProfile.version}! New RAG insight indexed.`);
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredMemories = memories.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-4xl bg-[#070b14] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans text-slate-100"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0b1220] to-[#070b14] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white font-display">
                      RAG Memory & Hermes Self-Improver
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Hermes v{hermesProfile?.version || '1.4'} Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Autonomous vector-lite episodic memory and dynamic prompt evolution for {activePod?.name}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-Header: Pod Selector & Actions */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Selected Agent Pod:</span>
                <select
                  value={selectedPodId}
                  onChange={(e) => setSelectedPodId(e.target.value)}
                  className="p-2 rounded-xl bg-[#050811] border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 font-sans"
                >
                  {pods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateHermesLearning}
                  disabled={isSimulating}
                  className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSimulating ? 'Evolving Prompt...' : 'Trigger Hermes Auto-Learn'}</span>
                </button>
              </div>
            </div>

            {toast && (
              <div className="mx-4 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{toast}</span>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Hermes Self-Improver Skill Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-[#050811] border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-sans">Self-Tuning Engine</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                    Hermes v{hermesProfile?.version || '1.4'}
                  </span>
                  <span className="text-[9px] text-slate-500">Autonomous Self-Improver</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#050811] border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-sans">Learnings Applied</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    {hermesProfile?.totalLearningsApplied || 18} Objections
                  </span>
                  <span className="text-[9px] text-emerald-400">+100% Retained</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#050811] border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-sans">Accuracy Gain</span>
                  <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                    {hermesProfile?.accuracyImprovement || '+21.5%'}
                  </span>
                  <span className="text-[9px] text-slate-500">Against baseline</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#050811] border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-sans">Last Auto-Evolution</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block truncate">
                    {hermesProfile?.lastAutoEvolution || 'Today'}
                  </span>
                  <span className="text-[9px] text-emerald-400">Zero human intervention</span>
                </div>
              </div>

              {/* Active Prompt Tuning Rules */}
              <div className="p-4 rounded-2xl bg-[#050811]/70 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-display flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hermes Dynamically Refined Prompt Directives</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Injected into LLM context</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(hermesProfile?.activePromptTuningRules || [
                    'Strict 18-word brevity limit.',
                    'Calm conversational demeanor.',
                  ]).map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-emerald-400 font-mono text-[10px] mt-0.5 font-bold">#{idx + 1}</span>
                      <span className="leading-snug">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Episodic RAG Memory Documents */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white font-display flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Episodic Knowledge & Resolved Objection Bank ({memories.length})</span>
                  </span>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter memories..."
                    className="p-1.5 px-3 rounded-xl bg-[#050811] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono max-w-[240px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMemories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3.5 rounded-2xl bg-[#050811] border border-white/10 hover:border-emerald-500/30 transition-all space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {mem.type.replace('_', ' ')}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                          <span>Impact: <strong className="text-cyan-400">{mem.impactScore}%</strong></span>
                          <span className="mx-1">·</span>
                          <span>{mem.timestamp}</span>
                        </div>
                      </div>

                      <h5 className="font-bold text-xs text-white font-display">{mem.title}</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">{mem.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
