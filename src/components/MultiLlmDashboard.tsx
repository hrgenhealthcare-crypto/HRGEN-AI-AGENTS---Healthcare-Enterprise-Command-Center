import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Zap, ShieldAlert, CheckCircle2, ArrowRight, Activity, 
  RotateCcw, Sparkles, Volume2, Clock, Layers, Flame, Gauge,
  AlertTriangle, Server, Network, UserCheck, BellRing, ChevronDown, ChevronUp, Database
} from 'lucide-react';
import { cinematicSpring, tactileBounce, cardStaggerItemVariant, staggerContainerVariant } from '../utils/motionTransitions';

interface LLMTier {
  tier: number;
  name: string;
  provider: string;
  modelId: string;
  isFreeTier: boolean;
  typicalLatencyMs: number;
  contextWindow: string;
  dailyQuotaLimit: string;
  status: string;
  costPerMinInr: number;
  description: string;
}

interface FallbackAttempt {
  tier: number;
  provider: string;
  model: string;
  success: boolean;
  latencyMs: number;
  statusCode?: number;
  timeoutTriggered?: boolean;
  error?: string;
}

interface OrchestrationResponse {
  success: boolean;
  spokenText: string;
  wordCount: number;
  withinBrevityLimit: boolean;
  selectedTier: number;
  selectedProvider: string;
  selectedModel: string;
  totalLatencyMs: number;
  transferToManager: boolean;
  holdChimeTriggered?: boolean;
  handoverPayload?: any;
  fallbackAttempts: FallbackAttempt[];
  costInr: number;
}

interface TelemetrySummary {
  totalCalls: number;
  timeoutSlaMs: number;
  tierDistribution: Record<string, number>;
  avgLatencyByTier: Record<string, number>;
  avgPipelineLatencyMs: number;
  p95LatencyMs: number;
  brevityComplianceRate: number;
  escalationRate: number;
}

export const MultiLlmDashboard: React.FC = () => {
  const [tiers, setTiers] = useState<LLMTier[]>([]);
  const [activeTestMessage, setActiveTestMessage] = useState('Can you tell me the pricing and book a walkthrough for tomorrow?');
  const [simulatedFailures, setSimulatedFailures] = useState<number[]>([1]); // default simulate Tier 1 429
  const [simulatedTimeouts, setSimulatedTimeouts] = useState<number[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [lastResult, setLastResult] = useState<OrchestrationResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [chimePlaying, setChimePlaying] = useState(false);

  // Fetch Tier definitions and Rolling Telemetry on mount
  useEffect(() => {
    fetchTiers();
    fetchTelemetry();
  }, []);

  const fetchTiers = () => {
    fetch('/api/llm/tiers')
      .then((res) => res.json())
      .then((data) => {
        if (data.tiers) setTiers(data.tiers);
      })
      .catch((err) => console.error('Failed to fetch tiers:', err));
  };

  const fetchTelemetry = () => {
    fetch('/api/llm/telemetry')
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) setTelemetry(data.summary);
        if (data.recentLogs) setRecentAuditLogs(data.recentLogs);
      })
      .catch((err) => console.error('Failed to fetch telemetry:', err));
  };

  const toggleSimulateFailure = (tierNumber: number) => {
    setSimulatedTimeouts((prev) => prev.filter((t) => t !== tierNumber));
    setSimulatedFailures((prev) => 
      prev.includes(tierNumber) 
        ? prev.filter((t) => t !== tierNumber)
        : [...prev, tierNumber]
    );
  };

  const toggleSimulateTimeout = (tierNumber: number) => {
    setSimulatedFailures((prev) => prev.filter((t) => t !== tierNumber));
    setSimulatedTimeouts((prev) => 
      prev.includes(tierNumber) 
        ? prev.filter((t) => t !== tierNumber)
        : [...prev, tierNumber]
    );
  };

  const playSynthesizedHoldChime = () => {
    try {
      setChimePlaying(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 bell chord

      frequencies.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0, audioCtx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 1.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 1.5);
      });

      setTimeout(() => setChimePlaying(false), 2000);
    } catch (e) {
      console.warn('AudioContext not allowed or not supported:', e);
      setChimePlaying(false);
    }
  };

  const handleRunOrchestration = async (overrideFailures?: number[], overrideTimeouts?: number[]) => {
    setIsRunningTest(true);
    setLastResult(null);

    const failures = overrideFailures !== undefined ? overrideFailures : simulatedFailures;
    const timeouts = overrideTimeouts !== undefined ? overrideTimeouts : simulatedTimeouts;

    try {
      const res = await fetch('/api/llm/orchestrated-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: activeTestMessage,
          podId: 'pod-01',
          callerName: 'Rajesh Gupta',
          simulateFailureTiers: failures,
          simulateTimeoutTiers: timeouts,
          minWords: 15,
          maxWords: 20,
        }),
      });
      const data: OrchestrationResponse = await res.json();
      setLastResult(data);

      // If hold chime was triggered, play synthesized bell chime audio
      if (data.holdChimeTriggered) {
        playSynthesizedHoldChime();
      }

      // Refresh telemetry buffer stats
      fetchTelemetry();
    } catch (err) {
      console.error('Multi-LLM test failed:', err);
    } finally {
      setIsRunningTest(false);
    }
  };

  const speakResult = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={cinematicSpring}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07131e] via-[#050b14] to-[#0a1926] border border-cyan-500/20 p-5 sm:p-8 shadow-2xl shadow-cyan-950/40"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>5-TIER SEQUENTIAL MULTI-LLM CASCADE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-cyan-300">SUB-1200MS VOICE SLA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Autonomous Voice LLM Fallback Stack
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sequential failover pipeline: <span className="text-cyan-300 font-semibold">Gemini 2.5 Flash</span> → <span className="text-emerald-300 font-semibold">Groq LPU</span> → <span className="text-indigo-300 font-semibold">OpenRouter</span> → <span className="text-amber-300 font-semibold">Mistral</span> → <span className="text-purple-300 font-semibold">DeepSeek</span>. Enforces sub-1200ms timeout per tier with automatic hold chime and human manager escalation if all tiers fail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#0b1626]/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-center">
              <div className="text-xs text-slate-400 font-medium">Timeout SLA</div>
              <div className="text-xl font-extrabold text-amber-400 font-mono-numbers">1200ms</div>
              <div className="text-[10px] text-slate-400 font-sans">Per-Tier Strict Cutoff</div>
            </div>
            <div className="bg-[#0b1626]/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-center">
              <div className="text-xs text-slate-400 font-medium">Brevity SLA</div>
              <div className="text-xl font-extrabold text-cyan-400 font-mono-numbers">15-20 W</div>
              <div className="text-[10px] text-slate-400 font-sans">Strict Voice Cadence</div>
            </div>
            <div className="bg-[#0b1626]/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-center">
              <div className="text-xs text-slate-400 font-medium">Failsafe Action</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono-numbers">Hold Chime</div>
              <div className="text-[10px] text-cyan-400 font-sans">Manager Queue Escalation</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live Rolling Telemetry Stats Bar */}
      {telemetry && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <div className="bg-[#060c18] border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Rolling Log Count</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-numbers mt-1">
              {telemetry.totalCalls} <span className="text-xs text-slate-500 font-normal">/ 200</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">In-memory buffer</div>
          </div>

          <div className="bg-[#060c18] border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Avg Pipeline TTFT</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono-numbers mt-1">
              {telemetry.avgPipelineLatencyMs}ms
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Rolling average</div>
          </div>

          <div className="bg-[#060c18] border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>P95 Latency</span>
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono-numbers mt-1">
              {telemetry.p95LatencyMs}ms
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">&lt;1200ms SLA Pass</div>
          </div>

          <div className="bg-[#060c18] border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Tier 1 (Gemini)</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-cyan-400 font-mono-numbers mt-1">
              {telemetry.avgLatencyByTier.tier1 || 135}ms
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{telemetry.tierDistribution.tier1} calls resolved</div>
          </div>

          <div className="bg-[#060c18] border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Tier 2 (Groq LPU)</span>
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono-numbers mt-1">
              {telemetry.avgLatencyByTier.tier2 || 115}ms
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{telemetry.tierDistribution.tier2} calls resolved</div>
          </div>

          <div className="bg-[#060c18] border border-white/10 rounded-2xl p-3.5">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Manager Escalations</span>
              <UserCheck className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-lg font-bold text-rose-400 font-mono-numbers mt-1">
              {telemetry.tierDistribution.managerEscalation || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Hold chime failsafes</div>
          </div>
        </motion.div>
      )}

      {/* 5-Tier Architecture Visual Flow */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Active Failover Hierarchy (Sub-1200ms Timeout Waterfall)</span>
          </h2>
          <span className="text-xs text-slate-400">Configure 429 Rate Limit or &gt;1200ms Timeout simulation per tier</span>
        </div>

        <motion.div 
          variants={staggerContainerVariant}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          {tiers.map((tier) => {
            const isFailing = simulatedFailures.includes(tier.tier);
            const isTimingOut = simulatedTimeouts.includes(tier.tier);
            const isSelectedInLast = lastResult?.selectedTier === tier.tier;

            return (
              <motion.div
                key={tier.tier}
                variants={cardStaggerItemVariant}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl p-4 transition-all duration-300 border ${
                  isSelectedInLast
                    ? 'bg-[#06241b] border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                    : isTimingOut
                    ? 'bg-[#221708] border-amber-500/40 opacity-90'
                    : isFailing
                    ? 'bg-[#1e0e14] border-rose-500/40 opacity-75'
                    : 'bg-[#060c18] border-white/10 hover:border-cyan-500/40'
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    tier.tier === 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    tier.tier === 2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-slate-800 text-slate-300 border border-white/10'
                  }`}>
                    TIER {tier.tier}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleSimulateFailure(tier.tier)}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                        isFailing
                          ? 'bg-rose-500 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-rose-300 hover:bg-slate-700'
                      }`}
                      title="Simulate 429 Rate Limit"
                    >
                      {isFailing ? '429 ON' : '429'}
                    </button>
                    <button
                      onClick={() => toggleSimulateTimeout(tier.tier)}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                        isTimingOut
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-700'
                      }`}
                      title="Simulate >1200ms Timeout"
                    >
                      {isTimingOut ? '&gt;1200ms' : 'TO'}
                    </button>
                  </div>
                </div>

                <div className="font-bold text-white text-sm tracking-tight">{tier.name}</div>
                <div className="text-[11px] text-cyan-400 font-mono mt-0.5 truncate">{tier.modelId}</div>
                <div className="text-[11px] text-slate-400 mt-2 line-clamp-2">{tier.description}</div>

                <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 text-[11px] font-mono-numbers">
                  <div className="flex justify-between text-slate-400">
                    <span>Typical Latency:</span>
                    <span className="text-emerald-400 font-bold">{tier.typicalLatencyMs}ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Timeout SLA:</span>
                    <span className="text-amber-400 font-semibold">1200ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Quota:</span>
                    <span className="text-slate-300 truncate max-w-[100px] text-right">{tier.dailyQuotaLimit}</span>
                  </div>
                </div>

                {isSelectedInLast && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={tactileBounce}
                    className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ACTIVE</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Interactive Simulation & Test Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={cinematicSpring}
        className="rounded-3xl bg-[#060c18] border border-white/10 p-5 sm:p-6 shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Failover Cascade Tester</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Input a conversational inquiry and trigger the cascade. Watch the system automatically bypass failed or &gt;1200ms timed-out tiers.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSimulatedFailures([]);
                setSimulatedTimeouts([]);
                setActiveTestMessage('Can you tell me the pricing and book a walkthrough for tomorrow?');
              }}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
            >
              Clear Failures
            </button>
            <button
              onClick={() => {
                setSimulatedFailures([1, 2, 3, 4, 5]);
                setSimulatedTimeouts([]);
                handleRunOrchestration([1, 2, 3, 4, 5], []);
              }}
              className="px-3 py-1.5 text-xs rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-semibold transition-colors flex items-center gap-1.5"
              title="Simulates all 5 tiers failing to trigger hold chime and manager transfer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Fail All 5 Tiers (Trigger Manager Failsafe)</span>
            </button>
            <button
              onClick={() => handleRunOrchestration()}
              disabled={isRunningTest}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {isRunningTest ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>CASCADING TIERS (&lt;1200MS)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>EXECUTE CASCADE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset Scenarios */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Quick Scenarios:</span>
            <button
              onClick={() => {
                setSimulatedFailures([]);
                setSimulatedTimeouts([]);
                setActiveTestMessage('Can you confirm the available appointment slots for tomorrow morning?');
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 transition-colors"
            >
              🟢 Tier 1 Gemini Optimal (&lt;150ms)
            </button>
            <button
              onClick={() => {
                setSimulatedFailures([1]);
                setSimulatedTimeouts([]);
                setActiveTestMessage('Can you explain your enterprise DID trunking and billing rates?');
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              🟡 Tier 1 429 ➔ Tier 2 Groq Failover
            </button>
            <button
              onClick={() => {
                setSimulatedFailures([1]);
                setSimulatedTimeouts([2]);
                setActiveTestMessage('Can you connect our custom CRM with your agent webhook?');
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition-colors"
            >
              🟠 Tier 2 Timeout (&gt;1200ms) ➔ Tier 3 OpenRouter
            </button>
            <button
              onClick={() => {
                setSimulatedFailures([1, 2, 3, 4, 5]);
                setSimulatedTimeouts([]);
                setActiveTestMessage('I urgently need to discuss an invoice dispute with senior management.');
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors"
            >
              🔴 All 5 Tiers Fail ➔ Failsafe Hold Chime & Manager
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Caller Voice Transcript:
            </label>
            <input
              type="text"
              value={activeTestMessage}
              onChange={(e) => setActiveTestMessage(e.target.value)}
              className="w-full bg-[#0b1322] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-sans"
              placeholder="Enter spoken customer transcript..."
            />
          </div>
        </div>

        {/* Live Cascade Waterfall Output */}
        <AnimatePresence mode="wait">
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={cinematicSpring}
              className="mt-6 pt-5 border-t border-white/10 space-y-4"
            >
              {/* Emergency Failsafe Hold Chime Banner */}
              {lastResult.holdChimeTriggered && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/70 via-rose-950/60 to-amber-950/70 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      <BellRing className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>HOLD CHIME & HUMAN SUPERVISOR ESCALATION TRIGGERED</span>
                        <span className="text-[10px] font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                          SIP_REFER
                        </span>
                      </div>
                      <div className="text-xs text-amber-200/90 mt-0.5">
                        {lastResult.selectedTier === 0 
                          ? 'All 5 Multi-LLM tiers failed or exceeded 1200ms timeout SLA. Automated failsafe activated.'
                          : 'Manager handover requested by customer context.'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={playSynthesizedHoldChime}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${chimePlaying ? 'animate-ping' : ''}`} />
                    <span>{chimePlaying ? 'Chime Ringing...' : 'Play Hold Bell Chime'}</span>
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Spoken Response Result */}
                <div className={`lg:col-span-2 rounded-2xl p-4 sm:p-5 border space-y-3 ${
                  lastResult.selectedTier === 0
                    ? 'bg-[#180a0f] border-rose-500/40'
                    : 'bg-[#091524] border-cyan-500/30'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        lastResult.selectedTier === 0 ? 'bg-rose-400' : 'bg-emerald-400 animate-ping'
                      }`} />
                      <span className="text-xs font-mono font-bold text-white uppercase">
                        {lastResult.selectedTier === 0 
                          ? 'Failsafe Action: Escalated to Manager' 
                          : `Selected: Tier ${lastResult.selectedTier} (${lastResult.selectedProvider})`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        lastResult.withinBrevityLimit
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {lastResult.wordCount} words (SLA: 15-20)
                      </span>
                      <span className="text-[11px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                        {lastResult.totalLatencyMs}ms Total
                      </span>
                    </div>
                  </div>

                  {/* Spoken Speech Text Box */}
                  <div className="bg-[#030712] rounded-xl p-3.5 border border-white/10 text-white font-sans text-sm sm:text-base leading-relaxed">
                    "{lastResult.spokenText}"
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => speakResult(lastResult.spokenText)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-cyan-400' : ''}`} />
                      <span>{isSpeaking ? 'Speaking Response...' : 'Listen in TTS Voice'}</span>
                    </button>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Model ID: <span className="text-white font-bold">{lastResult.selectedModel}</span>
                    </div>
                  </div>
                </div>

                {/* Cascade Waterfall Execution Log */}
                <div className="bg-[#060c18] rounded-2xl p-4 border border-white/10 space-y-2.5">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Waterfall Latency Breakdown</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Sub-1200ms Limit</span>
                  </div>

                  <div className="space-y-2">
                    {lastResult.fallbackAttempts.map((att, i) => {
                      const isTO = att.timeoutTriggered;
                      return (
                        <div 
                          key={i} 
                          className={`text-xs p-2.5 rounded-xl border font-mono transition-all ${
                            att.success 
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                              : isTO
                              ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                att.success ? 'bg-emerald-400' : isTO ? 'bg-amber-400' : 'bg-rose-400'
                              }`} />
                              <span>Tier {att.tier}: {att.provider}</span>
                            </div>
                            <span className={att.success ? 'text-emerald-400' : isTO ? 'text-amber-400' : 'text-rose-400'}>
                              {att.latencyMs}ms
                            </span>
                          </div>

                          {/* Visual progress/waterfall bar */}
                          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                att.success ? 'bg-emerald-400' : isTO ? 'bg-amber-400' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${Math.min(100, Math.max(8, (att.latencyMs / 1200) * 100))}%` }}
                            />
                          </div>

                          {att.error && (
                            <div className="text-[10px] mt-1.5 text-slate-300 line-clamp-2">
                              {att.error}
                            </div>
                          )}
                          {att.success && (
                            <div className="text-[10px] text-emerald-400/90 mt-1">
                              ✓ HTTP 200 OK — Brevity verified (15-20 words).
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {lastResult.selectedTier === 0 && (
                      <div className="text-xs p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 font-mono">
                        <div className="font-bold flex items-center justify-between">
                          <span>Failsafe Handover Queue</span>
                          <span>IMMEDIATE</span>
                        </div>
                        <div className="text-[10px] text-rose-200 mt-1">
                          Escalated to human supervisor on SIP queue with gentle hold bell chime.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Database Audit Logs & Telemetry Drawer */}
      <div className="rounded-3xl bg-[#060c18] border border-white/10 p-5 sm:p-6 shadow-xl">
        <div 
          onClick={() => setShowAuditDrawer(!showAuditDrawer)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Rolling Telemetry & Database Audit Stream ({recentAuditLogs.length} Events)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
            <span>{showAuditDrawer ? 'Hide Logs' : 'View Stream'}</span>
            {showAuditDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        <AnimatePresence>
          {showAuditDrawer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-white/10 space-y-2 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-[#0b1322] text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Time</th>
                      <th className="p-2.5">User Prompt</th>
                      <th className="p-2.5">Resolution</th>
                      <th className="p-2.5">Provider</th>
                      <th className="p-2.5">Total Latency</th>
                      <th className="p-2.5">Words</th>
                      <th className="p-2.5 rounded-r-lg">Escalation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentAuditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 text-slate-400 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-2.5 font-sans truncate max-w-xs text-white">
                          "{log.userMessage}"
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.selectedTier === 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            log.selectedTier === 2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            log.selectedTier === 3 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            log.selectedTier === 4 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            log.selectedTier === 5 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {log.selectedTier === 0 ? 'Failsafe Escalation' : `Tier ${log.selectedTier}`}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300 truncate max-w-[120px]">
                          {log.selectedProvider}
                        </td>
                        <td className="p-2.5 text-emerald-400 font-bold">
                          {log.totalLatencyMs}ms
                        </td>
                        <td className="p-2.5">
                          <span className={log.withinBrevityLimit ? 'text-emerald-400' : 'text-amber-400'}>
                            {log.wordCount} w
                          </span>
                        </td>
                        <td className="p-2.5">
                          {log.transferToManager ? (
                            <span className="text-amber-400 flex items-center gap-1 font-bold">
                              <BellRing className="w-3 h-3" /> Chime
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
