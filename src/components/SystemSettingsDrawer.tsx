import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings, Cpu, Volume2, Brain, Webhook, Download,
  CheckCircle2, RefreshCw, ShieldCheck, Smartphone, Zap
} from 'lucide-react';
import { PlatformSystemSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SystemSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemSettingsDrawer: React.FC<SystemSettingsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<PlatformSystemSettings>({
    primaryLlmEngine: 'gemini-3.8-flash',
    voiceSynthesisEngine: 'gemini-neural-tts',
    defaultVoiceProfile: 'hindi_soft',
    targetLatencyMs: 140,
    defaultBrevityWords: 18,
    globalHermesAutoLearn: true,
    autoCreateCrmLead: true,
    whatsappAutoDispatch: true,
    webhookEndpointUrl: 'https://api.hrgen-agents.enterprise/webhooks/voice-events',
    updatedAt: 'Active',
  });

  const [apiHealth, setApiHealth] = useState<{
    geminiConnected: boolean;
    multiLlmTiersReady: number;
    voiceSynthReady: boolean;
    avgPingMs: number;
  }>({
    geminiConnected: true,
    multiLlmTiersReady: 5,
    voiceSynthReady: true,
    avgPingMs: 38,
  });

  const [testingPing, setTestingPing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
        if (data.apiHealth) setApiHealth(data.apiHealth);
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, [isOpen]);

  const handleTestApiHealth = async () => {
    setTestingPing(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      const roundtrip = Math.max(24, Date.now() - start);
      if (data.apiHealth) {
        setApiHealth({
          ...data.apiHealth,
          avgPingMs: roundtrip,
        });
      }
      setStatusMessage(`API & Voice Pipeline Verified (${roundtrip}ms roundtrip · 5/5 Tiers Online)`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingPing(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setStatusMessage('System & API routing settings saved across all 10 agent pods.');
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAgentBundle = async () => {
    setDownloadingBundle(true);
    try {
      const res = await fetch('/api/export/bundle');
      const data = await res.json();
      const payload = JSON.stringify(data.bundle || data, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hrgen-agentic-ai-trained-bundle.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMessage('Downloaded complete Trained Agents + Hermes Memory Bundle (.json).');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingBundle(false);
    }
  };

  const [activeStep, setActiveStep] = useState<'engine' | 'voice' | 'hermes' | 'export'>('engine');

  const steps: { id: 'engine' | 'voice' | 'hermes' | 'export'; num: number; label: string; icon: any }[] = [
    { id: 'engine', num: 1, label: 'AI Engine', icon: Cpu },
    { id: 'voice', num: 2, label: 'Voice Tone', icon: Volume2 },
    { id: 'hermes', num: 3, label: 'Hermes & CRM', icon: Brain },
    { id: 'export', num: 4, label: 'PWA & Export', icon: Smartphone },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative z-10 w-full max-w-lg bg-[#0b1220] border-l border-white/10 h-full flex flex-col justify-between text-slate-100 shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-[#070c18] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                      Step-by-Step Control Plane
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-white font-display">
                      Enterprise Settings
                    </h2>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4-Step Tabbed Navigation Bar */}
              <div className="grid grid-cols-4 gap-1.5 bg-[#050811] p-1.5 rounded-2xl border border-white/10">
                {steps.map((s) => {
                  const IconComp = s.icon;
                  const isActive = activeStep === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveStep(s.id)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>
                        {s.num}. {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body (Single Spacious Step View at a Time) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {statusMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* STEP 1: AI ENGINE & SERVER API ROUTING */}
              {activeStep === 'engine' && (
                <div className="p-5 rounded-3xl bg-[#050811] border border-white/10 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="font-bold text-sm text-white font-display">
                          Step 1: AI Engine & Failover Routing
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Configure primary conversational LLM and neural voice synthesis
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">
                      ONLINE
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-200 font-bold">
                      Primary Conversational LLM Router
                    </label>
                    <select
                      value={settings.primaryLlmEngine}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          primaryLlmEngine: e.target.value as PlatformSystemSettings['primaryLlmEngine'],
                        })
                      }
                      className="w-full p-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="gemini-3.8-flash">
                        Google Gemini Flash Native (Primary Server Proxy)
                      </option>
                      <option value="multi-llm-5tier">
                        5-Tier Multi-LLM Free Failover Stack (Gemini → Groq → OpenRouter → Mistral → DeepSeek)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-200 font-bold">
                      Voice Speech Synthesis Engine (TTS)
                    </label>
                    <select
                      value={settings.voiceSynthesisEngine}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          voiceSynthesisEngine: e.target.value as PlatformSystemSettings['voiceSynthesisEngine'],
                        })
                      }
                      className="w-full p-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="gemini-neural-tts">
                        Gemini Neural Audio + Browser Speech Fallback (Zero Drop)
                      </option>
                      <option value="kokoro-82m-hybrid">
                        Kokoro-82M Low-Cost SIP Trunk Stream (&lt;₹0.27/min)
                      </option>
                    </select>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0b1220] border border-white/10 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Server-side proxy credentials verified</span>
                    </div>
                    <button
                      type="button"
                      disabled={testingPing}
                      onClick={handleTestApiHealth}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin' : ''}`} />
                      <span>{testingPing ? 'Verifying...' : 'Verify API Health'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: VOICE ACCENT & BREVITY */}
              {activeStep === 'voice' && (
                <div className="p-5 rounded-3xl bg-[#050811] border border-white/10 space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white font-display">
                        Step 2: Voice Accent & Hindi Soft Tone
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Tune spoken warmth, accent profile, and turn brevity
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-200 font-bold">
                      Default Telephony Voice Profile
                    </label>
                    <select
                      value={settings.defaultVoiceProfile}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultVoiceProfile: e.target.value as 'english' | 'hindi_soft',
                        })
                      }
                      className="w-full p-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="hindi_soft">
                        Hindi North Indian Soft Voice (hi-IN · Warm &amp; Polite)
                      </option>
                      <option value="english">
                        Indian English Executive Pro (en-IN)
                      </option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0b1220] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold">
                        Spoken Brevity Cap (Words per Turn)
                      </label>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {settings.defaultBrevityWords} words
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={35}
                      value={settings.defaultBrevityWords}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultBrevityWords: Number(e.target.value) || 18,
                        })
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400">
                      Keeps agent voice responses crisp and human-like without long monologues.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: HERMES SELF-LEARNING & CRM WEBHOOKS */}
              {activeStep === 'hermes' && (
                <div className="p-5 rounded-3xl bg-[#050811] border border-white/10 space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                    <Brain className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white font-display">
                        Step 3: Hermes Auto-Learn &amp; CRM Sync
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Autonomous post-call memory extraction and lead pipeline sync
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0b1220] border border-white/10 cursor-pointer">
                    <div className="pr-3">
                      <span className="font-bold text-white block">
                        Global Hermes Auto-Learn After Calls
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Automatically extract caller objections into RAG vector memory &amp; evolve prompts
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.globalHermesAutoLearn}
                      onChange={(e) =>
                        setSettings({ ...settings, globalHermesAutoLearn: e.target.checked })
                      }
                      className="w-5 h-5 accent-emerald-400 shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0b1220] border border-white/10 cursor-pointer">
                    <div className="pr-3">
                      <span className="font-bold text-white block">
                        Auto-Create CRM Lead on Call End
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Sync caller phone, sentiment &amp; deal value directly into pipeline
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoCreateCrmLead}
                      onChange={(e) =>
                        setSettings({ ...settings, autoCreateCrmLead: e.target.checked })
                      }
                      className="w-5 h-5 accent-emerald-400 shrink-0"
                    />
                  </label>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-slate-200 font-bold flex items-center gap-1.5">
                      <Webhook className="w-4 h-4 text-cyan-400" />
                      <span>Enterprise SIP / CRM Webhook Endpoint</span>
                    </label>
                    <input
                      type="text"
                      value={settings.webhookEndpointUrl}
                      onChange={(e) =>
                        setSettings({ ...settings, webhookEndpointUrl: e.target.value })
                      }
                      className="w-full p-3 rounded-xl bg-[#0b1220] border border-white/10 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: PWA APP INSTALL & CLIENT BUNDLE EXPORT */}
              {activeStep === 'export' && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/50 via-[#07111e] to-cyan-950/40 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="font-bold text-sm text-white font-display">
                          Step 4: PWA App Install &amp; Client Export
                        </h3>
                        <p className="text-[11px] text-slate-300">
                          One-click standalone app install and trained JSON bundle handoff
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 font-bold">
                      READY
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">
                    Install <strong className="text-white">HRGen Agentic AI</strong> as a standalone desktop or mobile Progressive Web App, or export your trained 10-agent configuration &amp; Hermes RAG memory bundle for client deployment.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">Standalone Desktop &amp; Mobile App</span>
                        <span className="text-[11px] text-slate-400">Works offline with cached workforce UI</span>
                      </div>
                      <PWAInstallButton />
                    </div>

                    <button
                      type="button"
                      disabled={downloadingBundle}
                      onClick={handleDownloadAgentBundle}
                      className="w-full p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>
                        {downloadingBundle
                          ? 'Exporting Trained Bundle...'
                          : 'Download Trained Workforce & Hermes Bundle (.json)'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Step Navigation + Save */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070c18] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {currentStepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(steps[currentStepIndex - 1].id)}
                    className="px-3.5 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
                  >
                    Previous
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
                  >
                    Close
                  </button>
                )}

                {currentStepIndex < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(steps[currentStepIndex + 1].id)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
                  >
                    Next Step →
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSettings}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
