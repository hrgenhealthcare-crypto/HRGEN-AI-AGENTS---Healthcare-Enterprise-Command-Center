import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Globe,
  Play,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  X,
  Zap,
  RefreshCw,
  PhoneCall,
  Layers,
  Code2,
  ArrowUpRight,
  Cpu,
} from 'lucide-react';
import { AgentPod } from '../types';
import { getAgentBotDescriptor } from '../utils/agentBotModalities';
import { StarRingBackground } from './StarRingBackground';
import { executeAgentApiRequest } from '../utils/apiClient';

interface AgentBotConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pod: AgentPod | null;
  pods: AgentPod[];
  onSelectPod: (pod: AgentPod) => void;
  onSwitchToVoice?: (pod: AgentPod) => void;
}

interface BotExecutionState {
  cliLogs: string[];
  browserActions: { step: string; target: string; status: string; latencyMs: number }[];
  artifactTitle: string;
  artifactCode: string;
  kpis: { label: string; value: string; delta: string }[];
  summary: string;
}

export const AgentBotConsoleModal: React.FC<AgentBotConsoleModalProps> = ({
  isOpen,
  onClose,
  pod,
  pods,
  onSelectPod,
  onSwitchToVoice,
}) => {
  const activePod = pod || pods[3] || pods[0];
  const descriptor = activePod ? getAgentBotDescriptor(activePod) : null;

  const [commandInput, setCommandInput] = useState('');
  const [taskPromptInput, setTaskPromptInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copiedArtifact, setCopiedArtifact] = useState(false);
  const [executionResult, setExecutionResult] = useState<BotExecutionState | null>(null);

  useEffect(() => {
    if (activePod && descriptor) {
      setCommandInput(descriptor.cliCommand);
      setTaskPromptInput(descriptor.defaultTaskPrompt);
      handleRunBotTask(descriptor.cliCommand, descriptor.defaultTaskPrompt, descriptor.browserTargetUrl);
    }
  }, [activePod?.id]);

  const handleRunBotTask = async (cmdOverride?: string, promptOverride?: string, targetOverride?: string) => {
    if (!activePod || !descriptor) return;
    const cmd = cmdOverride || commandInput || descriptor.cliCommand;
    const prompt = promptOverride || taskPromptInput || descriptor.defaultTaskPrompt;
    const target = targetOverride || descriptor.browserTargetUrl;

    setIsRunning(true);
    const apiResult = await executeAgentApiRequest<{
      success: boolean;
      execution: BotExecutionState;
      mode?: string;
      engineModel?: string;
      durationMs?: number;
    }>('/api/agents/bot-execute', {
      method: 'POST',
      body: {
        podId: activePod.id,
        podName: activePod.name,
        podRole: activePod.role,
        modality: descriptor.modality,
        command: cmd,
        taskPrompt: prompt,
        targetUrl: target,
      },
      timeoutMs: 12000,
    });

    if (apiResult.classification === 'valid_agent_response' && apiResult.data?.execution) {
      setExecutionResult(apiResult.data.execution);
    } else if (apiResult.classification === 'service_unavailable' || apiResult.classification === 'validation_error') {
      setExecutionResult({
        cliLogs: [
          `[ERROR] ${apiResult.errorMessage || 'Backend service unavailable.'}`,
          `[HTTP STATUS] ${apiResult.httpStatus}`,
        ],
        browserActions: [],
        artifactTitle: 'Service Unavailability Diagnostic',
        artifactCode: JSON.stringify(
          {
            classification: apiResult.classification,
            httpStatus: apiResult.httpStatus,
            error: apiResult.errorMessage,
          },
          null,
          2
        ),
        kpis: [
          { label: 'Service Status', value: `HTTP ${apiResult.httpStatus}`, delta: 'Offline' },
        ],
        summary: apiResult.errorMessage || 'Could not reach backend bot execution service.',
      });
    }
    setIsRunning(false);
  };

  const handleCopyArtifact = () => {
    if (!executionResult?.artifactCode) return;
    navigator.clipboard.writeText(executionResult.artifactCode);
    setCopiedArtifact(true);
    setTimeout(() => setCopiedArtifact(false), 2000);
  };

  if (!isOpen || !activePod || !descriptor) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 18 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl apple-glass-card border border-emerald-500/35 p-5 sm:p-6 text-slate-100 shadow-2xl space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Two Orbital Rings + Twinkling Stars Inside Modal */}
          <StarRingBackground
            variant="card"
            accentColor={descriptor.accentColor}
            secondaryColor="#10b981"
          />

          {/* Top Bar: Agent Bot Identity, Switcher & Controls */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-lg">
                {activePod.avatar}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-white font-display">
                    {activePod.name}
                  </h2>
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border"
                    style={{
                      backgroundColor: `${descriptor.accentColor}22`,
                      borderColor: `${descriptor.accentColor}66`,
                      color: '#fff',
                    }}
                  >
                    {descriptor.badgeLabel}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {descriptor.shortEngineTag}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{activePod.title}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Switch Active Bot */}
              <select
                value={activePod.id}
                onChange={(e) => {
                  const found = pods.find((p) => p.id === e.target.value);
                  if (found) onSelectPod(found);
                }}
                className="p-2 rounded-xl bg-[#050811]/90 border border-white/15 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-400"
              >
                {pods.map((p) => {
                  const d = getAgentBotDescriptor(p);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — {d.badgeLabel}
                    </option>
                  );
                })}
              </select>

              {onSwitchToVoice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToVoice(activePod);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
                  title="Optional: Speak to this agent via Voice Webphone"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Voice Bridge</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset One-Click Swarm CLI / Lucas / Browser Missions */}
          {descriptor.presetTasks.length > 0 && (
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>One-Click Autonomous Swarm CLI / Browser Bot Missions</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                   Swan CLI · Lucas Optimizer · Headless Chromium
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {descriptor.presetTasks.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isRunning}
                    onClick={() => {
                      setCommandInput(preset.cliCommand);
                      setTaskPromptInput(preset.label);
                      handleRunBotTask(preset.cliCommand, preset.label, preset.targetPlatform);
                    }}
                    className="p-3 rounded-2xl bg-black/45 hover:bg-emerald-500/15 border border-white/15 hover:border-emerald-500/40 text-left transition-all group flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {preset.label}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <code className="text-[10px] font-mono text-cyan-300 truncate block">
                      $ {preset.cliCommand}
                    </code>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dual-Pane Workspace: Left = Swarm CLI / TUI Terminal, Right = Headless Browser & Artifact HUD */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT PANE (7 cols): Interactive Swarm CLI / TUI Terminal */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-[#040710]/90 border border-white/15 p-4 space-y-3">
              <div className="space-y-3">
                {/* Terminal Window Top Bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5 ml-2">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>swan-cli · tui-swarm-node ({activePod.id})</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {isRunning ? 'EXECUTING...' : 'READY · 0 ERRORS'}
                  </span>
                </div>

                {/* CLI Command Input Bar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-black/60 border border-emerald-500/30 rounded-xl px-3 py-2">
                    <span className="text-emerald-400 font-mono text-xs font-bold">$</span>
                    <input
                      type="text"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRunBotTask()}
                      className="flex-1 bg-transparent text-xs font-mono text-emerald-200 focus:outline-none"
                      placeholder="Enter swan-cli, lucas-optimizer, or browser-bot command..."
                    />
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => handleRunBotTask()}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      {isRunning ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                      )}
                      <span>{isRunning ? 'Running' : 'Execute'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={taskPromptInput}
                    onChange={(e) => setTaskPromptInput(e.target.value)}
                    placeholder="Custom mission objective (e.g., Optimize Meta Reels ROAS, Inject Perplexity Schema, Audit Ad Spend)..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Live Streaming CLI Logs */}
                <div className="h-56 overflow-y-auto rounded-xl bg-black/70 border border-white/10 p-3.5 font-mono text-[11px] space-y-2">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-emerald-300 animate-pulse py-6 justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>
                        Executing {descriptor.badgeLabel} pipeline across {descriptor.browserTargetUrl}...
                      </span>
                    </div>
                  ) : (
                    (executionResult?.cliLogs || []).map((line, i) => (
                      <div key={i} className="leading-relaxed text-emerald-200/95 flex items-start gap-2">
                        <span className="text-slate-500 select-none">{String(i + 1).padStart(2, '0')}</span>
                        <span className="break-all">{line}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* KPI Impact Footer inside Terminal */}
              {executionResult?.kpis && (
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  {executionResult.kpis.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between"
                    >
                      <span className="text-[10px] text-slate-400">{kpi.label}</span>
                      <div className="flex items-baseline justify-between gap-1 mt-0.5">
                        <span className="text-sm font-extrabold text-white font-mono">{kpi.value}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">{kpi.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT PANE (5 cols): Headless Browser Automation & Generated Code/Campaign Artifact */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-[#040710]/90 border border-white/15 p-4 space-y-3">
              {/* Browser Bot Target Bar */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Headless Browser & API Automation</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SESSION
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-slate-300 truncate">
                  Target: <span className="text-cyan-300">{descriptor.browserTargetUrl}</span>
                </div>

                {/* Browser / API Action Steps */}
                <div className="space-y-1.5">
                  {(executionResult?.browserActions || []).map((act, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">{act.step}</span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {act.target}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2 font-mono">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          {act.status}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{act.latencyMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Structured Artifact (JSON-LD / Ad Set / Audit Payload) */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate">
                      {executionResult?.artifactTitle || 'Live Output Payload'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyArtifact}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-mono text-slate-200 flex items-center gap-1"
                  >
                    {copiedArtifact ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedArtifact ? 'Copied' : 'Copy Output'}</span>
                  </button>
                </div>

                <pre className="h-36 overflow-y-auto p-3 rounded-xl bg-black/75 border border-white/10 text-[10px] font-mono text-cyan-200 whitespace-pre-wrap">
                  {executionResult?.artifactCode || '// Ready to execute bot mission...'}
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
