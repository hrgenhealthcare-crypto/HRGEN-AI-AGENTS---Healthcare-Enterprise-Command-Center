import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X,
  Send,
  RotateCcw,
  Square,
  Play,
  Sliders,
  AlertCircle,
  Globe,
  Upload,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { AppNavTab } from '../types';
import {
  Humanoid3DCanvas,
  HumanoidLifecycleState,
  CustomGlbLoadStatus,
} from './Humanoid3DCanvas';
import {
  hologramAudio,
  SpeechAmplitudeEnvelope,
} from '../utils/hologramAudio';
import { executeAgentApiRequest } from '../utils/apiClient';

interface JarvisHologramAvatarProps {
  /** 'floating' = summonable bottom-left HUD; 'inline' = embedded inside VoiceWebphone */
  mode?: 'floating' | 'inline';
  isActive?: boolean;
  isSpeaking?: boolean;
  agentName?: string;
  agentRole?: string;
  spokenText?: string;
  externalOpen?: boolean;
  onCloseExternal?: () => void;
  onNavigateTab?: (tab: AppNavTab) => void;
  onOpenTrainModal?: () => void;
  onOpenBotConsole?: () => void;
}

const MAX_GLB_FILE_BYTES = 25 * 1024 * 1024; // 25 MB max local GLB size

export const JarvisHologramAvatar: React.FC<JarvisHologramAvatarProps> = ({
  mode = 'floating',
  isActive = false,
  isSpeaking = false,
  agentName = 'JARVIS 3D',
  agentRole = 'Enterprise AI Assistant',
  spokenText,
  externalOpen,
  onCloseExternal,
  onNavigateTab,
  onOpenTrainModal,
  onOpenBotConsole,
}) => {
  // Core 6-State Machine: dormant -> materializing -> listening -> processing -> speaking -> dismissing
  const [lifecycleState, setLifecycleState] = useState<HumanoidLifecycleState>(
    mode === 'inline' ? 'listening' : 'dormant'
  );
  const [isVisible, setIsVisible] = useState<boolean>(mode === 'inline' || isActive);

  // Speech & AI Response State
  const [currentMessage, setCurrentMessage] = useState<string>(
    spokenText ||
      'नमस्ते! मैं आपका 3D असिस्टेंट हूँ। नीचे कमांड टाइप कीजिए या वॉइस से वर्कस्पेस कंट्रोल कीजिए।'
  );
  const [speechAmplitude, setSpeechAmplitude] = useState<number>(0);
  const [voiceLang, setVoiceLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');

  // Honest Backend Connection & Model Telemetry
  const [backendStatusLabel, setBackendStatusLabel] = useState<string>('Server Ready');
  const [backendStatusTone, setBackendStatusTone] = useState<'emerald' | 'cyan' | 'amber' | 'rose'>('cyan');
  const [textCommandInput, setTextCommandInput] = useState<string>('');

  // Optional User-Supplied Local GLB Model State (Processed 100% locally in memory)
  const [customGlbBuffer, setCustomGlbBuffer] = useState<ArrayBuffer | null>(null);
  const [customGlbFileName, setCustomGlbFileName] = useState<string | undefined>(undefined);
  const [glbLoadStatus, setGlbLoadStatus] = useState<CustomGlbLoadStatus>({
    state: 'bundled',
  });
  const glbInputRef = useRef<HTMLInputElement | null>(null);

  // Voice & Sound Controls (Never auto-requests mic/camera permissions)
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // 3D View Transform State
  const [rotationOffset, setRotationOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);

  // Configurable Auto-Dissolve Idle Timer (seconds; 0 = Never)
  const [idleDelaySec, setIdleDelaySec] = useState<number>(15);

  // Refs for cleanup & timers
  const speechEnvelopeRef = useRef<SpeechAmplitudeEnvelope>(new SpeechAmplitudeEnvelope());
  const recognitionRef = useRef<any>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const materializeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRec));
  }, []);

  const clearLifecycleTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (materializeTimerRef.current) clearTimeout(materializeTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  const stopSpeakingAndCancelPending = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechEnvelopeRef.current.stop(setSpeechAmplitude);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLifecycleState((prev) =>
      prev === 'speaking' || prev === 'processing' ? 'listening' : prev
    );
  }, []);

  // Schedule auto-dissolve ONLY when idle (never while user is speaking, mic is listening, or task/speech is running)
  const resetAutoDissolveTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (mode === 'inline' || idleDelaySec <= 0) return;

    idleTimerRef.current = setTimeout(() => {
      setLifecycleState((current) => {
        if (
          current === 'speaking' ||
          current === 'processing' ||
          isMicListening ||
          textCommandInput.trim().length > 0
        ) {
          return current;
        }
        hologramAudio.playDismissSound();
        dismissTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          setLifecycleState('dormant');
          onCloseExternal?.();
        }, 850);
        return 'dismissing';
      });
    }, idleDelaySec * 1000);
  }, [idleDelaySec, isMicListening, mode, onCloseExternal, textCommandInput]);

  useEffect(() => {
    if (
      isVisible &&
      lifecycleState === 'listening' &&
      !isMicListening &&
      mode === 'floating'
    ) {
      resetAutoDissolveTimer();
    } else if (
      lifecycleState === 'speaking' ||
      lifecycleState === 'processing' ||
      isMicListening
    ) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
  }, [isVisible, lifecycleState, isMicListening, mode, resetAutoDissolveTimer]);

  const speakResponse = useCallback(
    (textToSpeak: string, langOverride?: 'hi-IN' | 'en-IN') => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setCurrentMessage(textToSpeak);
      setLifecycleState('speaking');
      speechEnvelopeRef.current.startSpeaking(setSpeechAmplitude);

      if (!isMuted && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const targetLang =
          langOverride || (/[\u0900-\u097F]/.test(textToSpeak) ? 'hi-IN' : voiceLang);
        utterance.lang = targetLang;
        utterance.rate = 1.03;
        utterance.pitch = 1.0;

        utterance.onboundary = () => {
          speechEnvelopeRef.current.triggerWordBoundary();
        };

        utterance.onend = () => {
          speechEnvelopeRef.current.stop(setSpeechAmplitude);
          setLifecycleState('listening');
        };

        utterance.onerror = () => {
          speechEnvelopeRef.current.stop(setSpeechAmplitude);
          setLifecycleState('listening');
        };

        window.speechSynthesis.speak(utterance);
      } else {
        const wordCount = textToSpeak.split(/\s+/).length;
        const durationMs = Math.min(6500, Math.max(2200, wordCount * 260));
        setTimeout(() => {
          speechEnvelopeRef.current.stop(setSpeechAmplitude);
          setLifecycleState('listening');
        }, durationMs);
      }
    },
    [isMuted, voiceLang]
  );

  // Activate / Converge Luminous Sand Particles into Half-Body Avatar
  const activateHumanoid = useCallback(
    (customGreeting?: string) => {
      clearLifecycleTimers();
      setIsVisible(true);
      setLifecycleState('materializing');
      hologramAudio.playMaterializeSound();

      materializeTimerRef.current = setTimeout(() => {
        if (customGreeting) {
          speakResponse(customGreeting);
        } else {
          setLifecycleState('listening');
        }
      }, 1100);
    },
    [clearLifecycleTimers, speakResponse]
  );

  // Dismiss / Disperse into Luminous Sand Particles
  const dismissHumanoid = useCallback(() => {
    clearLifecycleTimers();
    stopSpeakingAndCancelPending();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsMicListening(false);
    }

    hologramAudio.playDismissSound();
    setLifecycleState('dismissing');

    dismissTimerRef.current = setTimeout(() => {
      if (mode === 'floating') {
        setIsVisible(false);
      }
      setLifecycleState('dormant');
      onCloseExternal?.();
    }, 850);
  }, [clearLifecycleTimers, mode, onCloseExternal, stopSpeakingAndCancelPending]);

  useEffect(() => {
    if (externalOpen) {
      activateHumanoid(
        voiceLang === 'hi-IN'
          ? 'नमस्ते! 3D असिस्टेंट सक्रिय है। बोलिए या नीचे कमांड टाइप कीजिए।'
          : 'Hello! 3D Assistant converged and ready for your command.'
      );
    }
  }, [externalOpen]);

  useEffect(() => {
    if (mode === 'inline') {
      setIsVisible(true);
      if (isSpeaking) {
        setLifecycleState('speaking');
        speechEnvelopeRef.current.startSpeaking(setSpeechAmplitude);
        if (spokenText) setCurrentMessage(spokenText);
      } else if (isActive) {
        speechEnvelopeRef.current.stop(setSpeechAmplitude);
        setLifecycleState('listening');
        if (spokenText) setCurrentMessage(spokenText);
      } else {
        speechEnvelopeRef.current.stop(setSpeechAmplitude);
        setLifecycleState('listening');
      }
    }
  }, [mode, isActive, isSpeaking, spokenText]);

  // Execute User Command against /api/jarvis/command using executeAgentApiRequest
  const processUserCommand = useCallback(
    async (rawCommand: string) => {
      const trimmed = rawCommand.trim();
      if (!trimmed) {
        setStatusNotice('Please enter or speak a command first.');
        return;
      }

      stopSpeakingAndCancelPending();
      setStatusNotice(null);
      hologramAudio.playConfirmSound();
      setLifecycleState('processing');
      setCurrentMessage(`"${trimmed}"`);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const apiResult = await executeAgentApiRequest<{
        success: boolean;
        reply: string;
        intent: 'navigate_tab' | 'launch_bot' | 'open_train' | 'answer_query';
        targetTab: AppNavTab | null;
        mode: 'live_gemini' | 'live_server_agent';
        engineModel?: string;
        latencyMs?: number;
      }>('/api/jarvis/command', {
        method: 'POST',
        body: {
          command: trimmed,
          language: voiceLang,
          activeAgentName: agentName,
        },
        signal: controller.signal,
        timeoutMs: 12000,
      });

      if (apiResult.classification === 'aborted') {
        return;
      }

      if (apiResult.classification === 'validation_error') {
        setBackendStatusLabel('Validation Notice');
        setBackendStatusTone('amber');
        setStatusNotice(apiResult.errorMessage || 'Invalid command format.');
        setLifecycleState('listening');
        return;
      }

      if (apiResult.classification === 'service_unavailable' || !apiResult.data) {
        setBackendStatusLabel('Service Unavailable');
        setBackendStatusTone('rose');
        setStatusNotice(
          apiResult.errorMessage ||
            'Backend service is currently unreachable. Please check server status.'
        );
        speakResponse(
          voiceLang === 'hi-IN'
            ? 'सर्वर से संपर्क नहीं हो पाया। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
            : 'The backend server is currently unreachable. Please retry in a moment.'
        );
        return;
      }

      // Valid Server Agent Response (HTTP 200 OK)
      const payload = apiResult.data;
      if (apiResult.isLiveGemini) {
        setBackendStatusLabel(
          `Live Gemini AI (${payload.engineModel || 'gemini-3.1-flash-lite'} · ${apiResult.latencyMs}ms)`
        );
        setBackendStatusTone('emerald');
      } else {
        setBackendStatusLabel(`Live Server Agent (${apiResult.latencyMs}ms)`);
        setBackendStatusTone('cyan');
      }

      if (payload.intent === 'navigate_tab' && payload.targetTab && onNavigateTab) {
        onNavigateTab(payload.targetTab);
      } else if (payload.intent === 'launch_bot' && onOpenBotConsole) {
        onOpenBotConsole();
      } else if (payload.intent === 'open_train' && onOpenTrainModal) {
        onOpenTrainModal();
      }

      speakResponse(payload.reply);
    },
    [
      agentName,
      onNavigateTab,
      onOpenBotConsole,
      onOpenTrainModal,
      speakResponse,
      stopSpeakingAndCancelPending,
      voiceLang,
    ]
  );

  // Explicit User-Initiated Microphone Voice Command
  const handleToggleMicrophone = useCallback(() => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpeechSupported(false);
      setStatusNotice(
        'Web Speech API is not supported in this browser. Use the text command input below.'
      );
      return;
    }

    if (isMicListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsMicListening(false);
      setLifecycleState('listening');
      return;
    }

    stopSpeakingAndCancelPending();

    try {
      const recognition = new SpeechRec();
      recognition.lang = voiceLang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsMicListening(true);
        setStatusNotice(null);
        if (!isVisible) setIsVisible(true);
        setLifecycleState('listening');
        hologramAudio.playConfirmSound();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setIsMicListening(false);
        if (transcript.trim()) {
          processUserCommand(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsMicListening(false);
        const errCode = event?.error || 'unknown';
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          setStatusNotice(
            'Microphone permission not granted. Use the text input bar below to command the assistant.'
          );
        } else if (errCode !== 'no-speech' && errCode !== 'aborted') {
          setStatusNotice(`Voice input notice (${errCode}). Text input is ready below.`);
        }
      };

      recognition.onend = () => {
        setIsMicListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setStatusNotice('Could not start voice recognition. Please use the text input bar below.');
    }
  }, [isMicListening, isVisible, processUserCommand, stopSpeakingAndCancelPending, voiceLang]);

  // Handle Optional User-Supplied Local GLB / GLTF File Selection
  const handleLocalGlbFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.glb') && !lowerName.endsWith('.gltf')) {
      setGlbLoadStatus({
        state: 'error',
        fileName: file.name,
        errorMessage: 'Unsupported file type. Please select a valid .glb or .gltf 3D model file.',
      });
      return;
    }

    if (file.size === 0 || file.size > MAX_GLB_FILE_BYTES) {
      setGlbLoadStatus({
        state: 'error',
        fileName: file.name,
        errorMessage: `File size must be between 1 byte and 25 MB (selected: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(1)} MB).`,
      });
      return;
    }

    setGlbLoadStatus({
      state: 'loading',
      fileName: file.name,
    });

    try {
      const buffer = await file.arrayBuffer();

      // If .glb binary, validate the 4-byte 'glTF' magic header (0x46546C67)
      if (lowerName.endsWith('.glb')) {
        if (buffer.byteLength < 12) {
          setGlbLoadStatus({
            state: 'error',
            fileName: file.name,
            errorMessage: 'File is too small to be a valid binary GLB asset.',
          });
          return;
        }
        const magic = new DataView(buffer).getUint32(0, true);
        if (magic !== 0x46546c67) {
          setGlbLoadStatus({
            state: 'error',
            fileName: file.name,
            errorMessage: 'Invalid GLB binary header signature. Reverting to bundled avatar.',
          });
          return;
        }
      }

      setCustomGlbFileName(file.name);
      setCustomGlbBuffer(buffer);
    } catch (err: any) {
      setGlbLoadStatus({
        state: 'error',
        fileName: file.name,
        errorMessage: err?.message || 'Could not read local GLB file.',
      });
    }
  };

  const handleRevertToBundledAvatar = () => {
    setCustomGlbBuffer(null);
    setCustomGlbFileName(undefined);
    setGlbLoadStatus({ state: 'bundled' });
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    hologramAudio.setMuted(nextMute);
    if (nextMute && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleResetView = () => {
    setRotationOffset({ x: 0, y: 0 });
    setScaleMultiplier(1.0);
    hologramAudio.playConfirmSound();
  };

  useEffect(() => {
    return () => {
      clearLifecycleTimers();
      speechEnvelopeRef.current.stop();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearLifecycleTimers]);

  const getStateLabelAndColor = (state: HumanoidLifecycleState) => {
    switch (state) {
      case 'dormant':
        return { label: 'STANDBY · NANITES DORMANT', dot: 'bg-slate-500', text: 'text-slate-400' };
      case 'materializing':
        return { label: 'CONVERGING · NANITE SWARM', dot: 'bg-red-400 animate-ping', text: 'text-red-300' };
      case 'listening':
        return {
          label: isMicListening ? 'LISTENING · MIC LIVE' : 'LISTENING · RED VISOR ACTIVE',
          dot: 'bg-red-500 animate-pulse',
          text: 'text-red-300',
        };
      case 'processing':
        return { label: 'PROCESSING · RED BEAM CYCLING', dot: 'bg-amber-400 animate-ping', text: 'text-amber-300' };
      case 'speaking':
        return { label: 'SPEAKING · VISOR EXPANSION', dot: 'bg-red-500 animate-ping', text: 'text-red-300' };
      case 'dismissing':
        return { label: 'DISPERSING · NANITE SWARM', dot: 'bg-slate-400 animate-ping', text: 'text-slate-300' };
    }
  };

  const stateBadge = getStateLabelAndColor(lifecycleState);

  // --- INLINE MODE (Inside VoiceWebphone Console) ---
  if (mode === 'inline') {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-gradient-to-b from-[#0a0f1d]/95 via-[#060a14]/95 to-[#02050a] p-3.5 shadow-xl">
        {/* Quiet Thin Laser Scan-Line Shimmer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, rgba(239,68,68,0.14) 5px)',
          }}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stateBadge.dot}`} />
            <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${stateBadge.text}`}>
              {stateBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleMicrophone}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                isMicListening
                  ? 'bg-rose-500/25 border-rose-400/50 text-rose-200'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-400/30 text-sky-200'
              }`}
              title="Enable Voice Command"
            >
              {isMicListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span>{isMicListening ? 'Stop Mic' : 'Listen'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset 3D View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Smooth Half-Body Humanoid/Alien Android Viewport */}
        <div className="relative z-10 w-full h-48 sm:h-52">
          <Humanoid3DCanvas
            lifecycleState={lifecycleState}
            speechAmplitude={speechAmplitude}
            rotationOffset={rotationOffset}
            scaleMultiplier={scaleMultiplier}
            customGlbBuffer={customGlbBuffer}
            customGlbFileName={customGlbFileName}
            onGlbStatusChange={setGlbLoadStatus}
            onPointerRotate={(dx, dy) =>
              setRotationOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
            }
            onWheelScale={(delta) =>
              setScaleMultiplier((prev) => Math.max(0.65, Math.min(1.55, prev + delta)))
            }
          />
        </div>

        {/* Agent Identity & Honest Sync Disclosure */}
        <div className="relative z-10 text-center mt-1 pt-2 border-t border-white/10">
          <div className="text-xs font-extrabold text-white font-display tracking-tight">
            {agentName} <span className="text-sky-400 font-normal">· {agentRole}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Smooth Half-Body Avatar · Speech-Amplitude Sync · Drag to Rotate
          </div>
        </div>
      </div>
    );
  }

  // --- FLOATING COMMAND STAGE MODE ---
  return (
    <>
      {/* Hidden File Input for Optional Local GLB Import */}
      <input
        ref={glbInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleLocalGlbFileChange}
        className="hidden"
      />

      {/* Summon Trigger Button (Bottom-Left) when Dormant / Hidden */}
      <AnimatePresence>
        {!isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            className="fixed bottom-5 left-5 z-40 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() =>
                activateHumanoid(
                  voiceLang === 'hi-IN'
                    ? 'नमस्ते! मैं आपका 3D असिस्टेंट हूँ। बोलिए या नीचे कमांड टाइप कीजिए।'
                    : 'Hello! I am your 3D assistant. Speak or type a command below.'
                )
              }
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl apple-glass-pill border border-sky-400/35 bg-slate-950/90 hover:bg-sky-950/80 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.22)] transition-all cursor-pointer active:scale-95"
              title="Summon 3D Assistant"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400" />
              </span>
              <Sparkles className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-extrabold font-display tracking-wide text-white">
                Jarvis 3D Assistant
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active 3D Half-Body Assistant Stage */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.86, y: 32 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="fixed bottom-4 left-4 z-50 w-[340px] sm:w-[390px] rounded-3xl apple-glass-heavy border border-sky-400/30 bg-[#040c18]/95 shadow-[0_24px_70px_rgba(14,165,233,0.25)] overflow-hidden"
          >
            {/* Quiet Thin Scan-Line Shimmer */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, rgba(56,189,248,0.14) 5px)',
              }}
            />

            {/* Top HUD Header */}
            <div className="relative z-10 flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-950/75">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stateBadge.dot}`} />
                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${stateBadge.text}`}>
                  {stateBadge.label}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Bilingual HI / EN Switch */}
                <button
                  type="button"
                  onClick={() => setVoiceLang((prev) => (prev === 'hi-IN' ? 'en-IN' : 'hi-IN'))}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono font-bold text-sky-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Switch Voice & Reply Language (Hindi / English)"
                >
                  <Globe className="w-3 h-3 text-sky-400" />
                  <span>{voiceLang === 'hi-IN' ? 'HI-IN' : 'EN-IN'}</span>
                </button>

                {/* Mute / Unmute Audio */}
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute Voice & Sound Effects' : 'Mute Voice & Sound Effects'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-sky-300" />
                  )}
                </button>

                {/* Avatar Settings & Local GLB Import Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer((prev) => !prev)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    showSettingsDrawer || glbLoadStatus.state === 'loaded'
                      ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300'
                  }`}
                  title="Avatar Settings & Optional Local GLB Model Import"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={dismissHumanoid}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/25 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
                  title="Dismiss & Disperse Avatar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Clean Half-Body Humanoid/Alien Android Stage */}
            <div className="relative z-10 w-full h-56 sm:h-64 bg-[radial-gradient(circle_at_50%_42%,rgba(56,189,248,0.12),transparent_72%)]">
              <Humanoid3DCanvas
                lifecycleState={lifecycleState}
                speechAmplitude={speechAmplitude}
                rotationOffset={rotationOffset}
                scaleMultiplier={scaleMultiplier}
                customGlbBuffer={customGlbBuffer}
                customGlbFileName={customGlbFileName}
                onGlbStatusChange={setGlbLoadStatus}
                onPointerRotate={(dx, dy) =>
                  setRotationOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
                }
                onWheelScale={(delta) =>
                  setScaleMultiplier((prev) => Math.max(0.65, Math.min(1.55, prev + delta)))
                }
              />

              {/* Subtle Bottom Stage Info */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
                <span>Drag: Rotate · Scroll: Zoom ({scaleMultiplier.toFixed(2)}x)</span>
                <span className="text-red-300/90">
                  {glbLoadStatus.state === 'loaded'
                    ? `GLB: ${glbLoadStatus.fileName}`
                    : 'GORT (2008) Half-Body Avatar'}
                </span>
              </div>
            </div>

            {/* Primary Controls Bar (Activate, Listen, Stop, Reset, Dismiss) */}
            <div className="relative z-10 px-3.5 py-2 bg-slate-950/85 border-t border-white/10 flex flex-wrap items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() =>
                  activateHumanoid(
                    voiceLang === 'hi-IN'
                      ? 'नानाइट पार्टिकल्स से GORT 3D अवतार सक्रिय किया गया है।'
                      : 'GORT 3D Avatar assembled from nanite swarm.'
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Activate / Assemble Nanites"
              >
                <Play className="w-3 h-3" />
                <span>Activate</span>
              </button>

              <button
                type="button"
                onClick={handleToggleMicrophone}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  isMicListening
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/30 text-emerald-200'
                }`}
                title="Speak a Voice Command"
              >
                {isMicListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{isMicListening ? 'Listening...' : 'Voice Input'}</span>
              </button>

              <button
                type="button"
                onClick={stopSpeakingAndCancelPending}
                disabled={lifecycleState !== 'speaking' && lifecycleState !== 'processing'}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-400/30 text-amber-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Stop Speaking & Cancel Pending Request"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>

              <button
                type="button"
                onClick={handleResetView}
                className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                title="Reset 3D Rotation & Scale"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={dismissHumanoid}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Disperse into Sand Particles"
              >
                <X className="w-3 h-3" />
                <span>Dismiss</span>
              </button>
            </div>

            {/* Collapsible Settings Drawer: Local GLB Model Import & Idle Auto-Dissolve */}
            <AnimatePresence>
              {showSettingsDrawer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative z-10 px-3.5 py-2.5 bg-slate-900/95 border-t border-white/10 space-y-2.5 overflow-hidden"
                >
                  {/* Optional Local GLB / GLTF File Import */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-200">
                        Custom 3D Model (.glb / .gltf · Local Only)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => glbInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Import GLB</span>
                        </button>
                        {customGlbBuffer && (
                          <button
                            type="button"
                            onClick={handleRevertToBundledAvatar}
                            className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 transition-colors cursor-pointer"
                            title="Revert to Bundled Smooth Half-Body Avatar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Honest GLB Load Status Indicator */}
                    {glbLoadStatus.state === 'bundled' && (
                      <div className="text-[10px] font-mono text-slate-400">
                        Active: Bundled Smooth Half-Body Android (No external dependency)
                      </div>
                    )}
                    {glbLoadStatus.state === 'loading' && (
                      <div className="text-[10px] font-mono text-sky-300 animate-pulse">
                        Parsing local GLB file “{glbLoadStatus.fileName}” in memory...
                      </div>
                    )}
                    {glbLoadStatus.state === 'loaded' && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          Loaded {glbLoadStatus.fileName} ({glbLoadStatus.meshCount} meshes)
                        </span>
                      </div>
                    )}
                    {glbLoadStatus.state === 'error' && (
                      <div className="flex items-start gap-1.5 text-[10px] font-mono text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg p-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{glbLoadStatus.errorMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* Configurable Idle Auto-Dissolve Delay */}
                  <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
                    <span>Idle Auto-Disperse:</span>
                    <div className="flex items-center gap-1">
                      {[8, 15, 30, 0].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setIdleDelaySec(sec)}
                          className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            idleDelaySec === sec
                              ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sec === 0 ? 'Never' : `${sec}s`}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spoken Response Transcript & Honest Backend Status */}
            <div className="relative z-10 px-4 py-2.5 bg-slate-950/90 border-t border-white/10 space-y-2">
              {statusNotice && (
                <div className="flex items-start gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg p-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{statusNotice}</span>
                </div>
              )}

              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 text-xs text-slate-100 leading-relaxed font-medium">
                “{currentMessage}”
              </div>

              {/* Honest Capability & Backend Connection Status */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>
                  Status:{' '}
                  <strong
                    className={
                      backendStatusTone === 'emerald'
                        ? 'text-emerald-300'
                        : backendStatusTone === 'rose'
                        ? 'text-rose-300'
                        : backendStatusTone === 'amber'
                        ? 'text-amber-300'
                        : 'text-sky-300'
                    }
                  >
                    {backendStatusLabel}
                  </strong>
                </span>
                <span>{speechSupported ? 'Voice + Text Ready' : 'Text Input Active'}</span>
              </div>

              {/* Reliable Text Command Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!textCommandInput.trim()) return;
                  const cmd = textCommandInput;
                  setTextCommandInput('');
                  processUserCommand(cmd);
                }}
                className="flex items-center gap-1.5 pt-0.5"
              >
                <input
                  type="text"
                  value={textCommandInput}
                  onChange={(e) => setTextCommandInput(e.target.value)}
                  placeholder={
                    voiceLang === 'hi-IN'
                      ? 'हिंदी या English में कमांड लिखें (e.g. Open Analytics)...'
                      : 'Type command (e.g., Open Analytics, Launch Swarm Bots)...'
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 focus:border-sky-400/60 focus:outline-none text-xs text-white placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/40 text-sky-200 transition-all cursor-pointer active:scale-95"
                  title="Send Command"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick Workspace Action Shortcuts */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => processUserCommand('Open Voice Call Webphone')}
                    className="px-2 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all cursor-pointer truncate"
                  >
                    Voice Call
                  </button>
                )}
                {onOpenBotConsole && (
                  <button
                    type="button"
                    onClick={() => processUserCommand('Launch Swarm CLI and Browser Bots')}
                    className="px-2 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[10px] font-bold transition-all cursor-pointer truncate"
                  >
                    Swarm Bots
                  </button>
                )}
                {onOpenTrainModal && (
                  <button
                    type="button"
                    onClick={() => processUserCommand('Open Train Agent and Hermes RAG')}
                    className="px-2 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-[10px] font-bold transition-all cursor-pointer truncate"
                  >
                    Train & RAG
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
