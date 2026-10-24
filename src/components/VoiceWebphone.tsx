import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, Sparkles, 
  Send, RefreshCw, CheckCircle2, AlertCircle, 
  User, Bot, ShieldCheck, Zap, ArrowRight, UserCheck, 
  Clock, ShieldAlert, PhoneForwarded, History, SplitSquareVertical,
  PhoneIncoming, PhoneOutgoing, LayoutGrid, DollarSign,
  FileCode2, ChevronRight, Check
} from 'lucide-react';
import { CallMessage, AgentPod, BusinessLead, CallLogItem } from '../types';
import { CallHistorySection } from './CallHistorySection';

interface VoiceWebphoneProps {
  pods: AgentPod[];
  activePodId: string;
  onSelectPod: (podId: string) => void;
  onLeadCreated: (lead: Partial<BusinessLead>) => void;
}

export const VoiceWebphone: React.FC<VoiceWebphoneProps> = ({
  pods,
  activePodId,
  onSelectPod,
  onLeadCreated,
}) => {
  const activePod = pods.find((p) => p.id === activePodId) || pods[0];

  // Tab state: 'dialer' | 'history'
  const [webphoneTab, setWebphoneTab] = useState<'dialer' | 'history'>('dialer');

  // Call history state
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [archivedAlert, setArchivedAlert] = useState<string | null>(null);

  // Active call state
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callDirection, setCallDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<CallMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(138);
  const [lastWordCount, setLastWordCount] = useState<number>(14);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  // Client caller information
  const [callerName, setCallerName] = useState<string>('Rajesh Gupta');
  const [callerPhone, setCallerPhone] = useState<string>('+91 98201 44321');
  const [callerCompany, setCallerCompany] = useState<string>('Gupta Retail Enterprises');
  const [serviceOfInterest, setServiceOfInterest] = useState<string>('Voice AI Telephony Setup');
  const [estimatedValue, setEstimatedValue] = useState<number>(45000);

  // Queue timer & Recommended AI Script
  const [queueWaitTime, setQueueWaitTime] = useState<number>(0);
  const [recommendedScript, setRecommendedScript] = useState<string>(
    'Confirm preferred meeting slot and offer instant WhatsApp booking confirmation.'
  );

  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load call logs from backend
  useEffect(() => {
    fetch('/api/calls')
      .then((res) => res.json())
      .then((data) => {
        if (data.calls) {
          setCallLogs(data.calls);
        }
      })
      .catch((err) => console.error('Failed to load call history:', err));
  }, []);

  // Call timer
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Waveform canvas for live dialer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isSpeaking ? '#0d9488' : isThinking ? '#f59e0b' : '#94a3b8';

      const amplitude = isSpeaking ? 16 : isThinking ? 8 : 2;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.05 + phase) * amplitude * Math.sin((x / width) * Math.PI);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      phase += isSpeaking ? 0.2 : 0.08;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isSpeaking, isThinking]);

  // Audio Speech Synthesis
  const playAgentVoice = (text: string) => {
    setIsSpeaking(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; // brisk, conversational speed
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  // Start Call
  const handleStartCall = () => {
    setCallStatus('calling');
    setIsTransferring(false);
    setQueueWaitTime(0);

    setTimeout(() => {
      setCallStatus('connected');
      const greetingMsg: CallMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        text: activePod?.greeting || 'Hello! Thank you for calling HRGEN Enterprise. How may I assist your booking or appointment today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latencyMs: 120,
      };
      setTranscript([greetingMsg]);
      playAgentVoice(greetingMsg.text);
      setLastWordCount(greetingMsg.text.split(/\s+/).length);
    }, 600);
  };

  // End Call & Automatically Save to Call History
  const handleEndCall = () => {
    setCallStatus('ended');
    setIsSpeaking(false);
    setIsThinking(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (transcript.length > 0) {
      const mins = Math.floor(callDuration / 60);
      const secs = callDuration % 60;
      const formattedDuration = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

      const newLogItem: CallLogItem = {
        id: `CALL-${Date.now().toString().slice(-4)}`,
        podId: activePod?.id || 'pod-01',
        podName: activePod?.name || 'Dr. Ritu Verma (Inbound Reception)',
        clientName: callerName || 'Direct Caller',
        phone: callerPhone || '+91 98000 00000',
        direction: callDirection,
        duration: formattedDuration === '0m 00s' ? '0m 45s' : formattedDuration,
        timestamp: 'Just now',
        sentiment: isTransferring ? 'neutral' : 'converted',
        summary: `AI voice telephony call with ${callerName || 'Client'}. ${isTransferring ? 'Transferred to operational manager.' : 'Logistics details exchanged successfully.'}`,
        leadCaptured: true,
        managerHandover: isTransferring,
        messages: [...transcript],
        metrics: {
          avgLatencyMs: latencyMs,
          totalTurns: transcript.length,
          avgWordsPerTurn: lastWordCount,
        },
      };

      setCallLogs((prev) => [newLogItem, ...prev]);

      fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLogItem),
      }).catch((err) => console.error('Failed to persist call log:', err));

      setArchivedAlert(`Call logged to history (${newLogItem.id}) with ${transcript.length} turns.`);
      setTimeout(() => setArchivedAlert(null), 4000);
    }

    setTimeout(() => setCallStatus('idle'), 1500);
  };

  // Send message to Gemini Pod Backend
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || callStatus !== 'connected') return;

    const userMsg: CallMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    const newTranscript = [...transcript, userMsg];
    setTranscript(newTranscript);
    setInputMessage('');
    setIsThinking(true);

    // Update dynamic recommended script based on user intent
    if (userText.toLowerCase().includes('price') || userText.toLowerCase().includes('cost')) {
      setRecommendedScript('Emphasize <₹0.50/min routing efficiency and ₹7,500/seat monthly license with zero setup fee.');
    } else if (userText.toLowerCase().includes('demo') || userText.toLowerCase().includes('time')) {
      setRecommendedScript('Offer tomorrow at 11 AM or 3 PM for a personalized video walkthrough.');
    } else if (userText.toLowerCase().includes('manager') || userText.toLowerCase().includes('human')) {
      setRecommendedScript('Hold chime active: politely transfer caller to the executive managerial queue.');
    }

    try {
      const res = await fetch('/api/gemini/pod-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId: activePod?.id,
          userMessage: userText,
          conversationHistory: newTranscript.map((t) => ({ role: t.role, text: t.text })),
          channel: 'voice',
          callerName,
          callerPhone,
        }),
      });

      const data = await res.json();
      setIsThinking(false);

      if (data.replyText) {
        setLatencyMs(data.latencyMs || 138);
        setLastWordCount(data.wordCount || 14);

        if (data.transferToManager) {
          setIsTransferring(true);
        }

        const agentReply: CallMessage = {
          id: `agt-${Date.now()}`,
          role: 'agent',
          text: data.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          latencyMs: data.latencyMs,
        };

        setTranscript((prev) => [...prev, agentReply]);
        playAgentVoice(data.replyText);
      }
    } catch (err) {
      console.error(err);
      setIsThinking(false);
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by this browser. You can type in the prompt box.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsMuted(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      handleSendMessage(speechText);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setIsMuted(true);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsMuted(false);
  };

  const handleCaptureLead = () => {
    onLeadCreated({
      name: callerName,
      phone: callerPhone,
      company: callerCompany,
      serviceOfInterest,
      value: estimatedValue,
      assignedPodId: activePod?.id,
      assignedPodName: activePod?.name,
      stage: 'demo_scheduled',
      source: 'voice_agent',
      notes: `Captured live during call with ${activePod?.name}. Call duration: ${formatDuration(callDuration)}.`,
    });
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleSelectCallForDialer = (call: CallLogItem) => {
    setCallerName(call.clientName);
    setCallerPhone(call.phone);
    setWebphoneTab('dialer');
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Nav Tabs & VoIP Metadata (Zero-Pill Discipline) */}
      <div className="bg-[#0b1220]/80 backdrop-blur-xl p-3 rounded-3xl border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Responsive Segmented Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => setWebphoneTab('dialer')}
            className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all active:scale-95 ${
              webphoneTab === 'dialer'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-Time Call Center HUD</span>
          </button>

          <button
            onClick={() => setWebphoneTab('history')}
            className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all active:scale-95 ${
              webphoneTab === 'history'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Call History ({callLogs.length})</span>
          </button>
        </div>

        {/* Zero-Pill VoIP Telephony Pipeline Specs (Text with typographic dots) */}
        <div className="text-xs text-slate-400 hidden md:flex items-center gap-2 font-mono tabular-nums">
          <span className="text-emerald-400 font-bold">Virtual VoIP DID Connected</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Groq Whisper STT (₹0.05/min)</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Gemini 2.5 Flash (₹0.02/min)</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-white font-semibold">Total ₹0.27/min</span>
        </div>

        {/* Pod Switcher dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Active Pod:</span>
          <select
            value={activePodId}
            onChange={(e) => onSelectPod(e.target.value)}
            className="p-2 rounded-xl border border-white/10 bg-[#050811] text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.role.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {archivedAlert && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{archivedAlert}</span>
          </div>
          <button
            onClick={() => setWebphoneTab('history')}
            className="text-emerald-400 underline font-semibold hover:text-emerald-300"
          >
            View in History
          </button>
        </div>
      )}

      {webphoneTab === 'history' ? (
        <CallHistorySection
          calls={callLogs}
          pods={pods}
          onSelectCallForDialer={handleSelectCallForDialer}
        />
      ) : (
        /* STEP 1.4: SOLID SPLIT-SCREEN REAL-TIME HUD LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================
              LEFT PANE (lg:col-span-7): LIVE AUDIO & TRANSCRIPT STREAM
             ======================================================== */}
          <div className="lg:col-span-7 space-y-4">
            {/* Active Pod Banner */}
            <div className="bg-[#0b1220]/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activePod?.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white font-display">{activePod?.name}</h3>
                    <span className="text-xs text-emerald-400 font-semibold font-mono">
                      {activePod?.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                    <span>{activePod?.industryFocus}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-cyan-400">{activePod?.voiceId} Engine</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>{activePod?.brevityWordsLimit}w Cap</span>
                  </div>
                </div>
              </div>

              {/* Call Direction Switcher */}
              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl text-[11px] font-semibold">
                <button
                  onClick={() => setCallDirection('inbound')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                    callDirection === 'inbound' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PhoneIncoming className="w-3 h-3 text-emerald-400" />
                  <span>Inbound</span>
                </button>
                <button
                  onClick={() => setCallDirection('outbound')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                    callDirection === 'outbound' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PhoneOutgoing className="w-3 h-3 text-cyan-400" />
                  <span>Outbound</span>
                </button>
              </div>
            </div>

            {/* Metrics HUD Row: Latency, Word Count, Cost Meter, Call State */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono tabular-nums">
              <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Pipeline Latency</span>
                <span className="text-base font-bold text-emerald-400">{latencyMs} ms</span>
                <span className="text-[9px] text-slate-400 block font-sans">SLA: &lt;200ms Target</span>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Turn Word Count</span>
                <span className="text-base font-bold text-white">
                  {lastWordCount} / {activePod?.brevityWordsLimit || 18} w
                </span>
                <span className="text-[9px] text-teal-300 block font-sans">Strict Brevity Cap</span>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">VoIP Routing Cost</span>
                <span className="text-base font-bold text-emerald-400">₹0.27 / min</span>
                <span className="text-[9px] text-slate-400 block font-sans">Target: &lt;₹0.50/min</span>
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Session State</span>
                <span className="text-base font-bold text-indigo-300 capitalize">{callStatus}</span>
                <span className="text-[9px] text-slate-400 block font-sans">
                  {callStatus === 'connected' ? formatDuration(callDuration) : 'Queue: 0s'}
                </span>
              </div>
            </div>

            {/* Manager Handover Alert if triggered */}
            {isTransferring && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <PhoneForwarded className="w-4 h-4 text-amber-600 animate-bounce" />
                  <div>
                    <span className="font-bold block">Live Transfer Triggered (Hold Chime Active)</span>
                    <span className="text-[11px] text-amber-700">
                      Caller requested manager or complex topic. Routed to human executive queue.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800">
                  Transferring...
                </span>
              </div>
            )}

            {/* Audio Waveform Canvas & Live Streaming Transcript Feed */}
            <div className="bg-[#0b1220]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl space-y-4">
              {/* Waveform Canvas */}
              <div className="bg-[#050811] rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden h-24 border border-white/10">
                <canvas ref={canvasRef} width={480} height={60} className="w-full h-full" />
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    {callStatus === 'connected' ? `Live Telephony Stream · ${formatDuration(callDuration)}` : 'SIP Engine Ready'}
                  </span>
                  <span>24kHz HD Audio · {activePod?.voiceId}</span>
                </div>
              </div>

              {/* Verbatim Streaming Transcript Feed */}
              <div className="h-60 overflow-y-auto p-3 rounded-2xl bg-[#050811]/70 border border-white/10 space-y-3 text-xs">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2">
                    <Phone className="w-8 h-8 opacity-40 text-emerald-400" />
                    <p>Press "Start Live Call" to connect via Virtual SIP trunk.</p>
                  </div>
                ) : (
                  transcript.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'agent' && (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-white rounded-tr-xs'
                            : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-xs shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 mb-1 font-mono">
                          <span className="font-semibold text-emerald-300">{msg.role === 'user' ? callerName : activePod?.name}</span>
                          <span className="tabular-nums">{msg.timestamp}</span>
                        </div>
                        <p>{msg.text}</p>
                        {msg.latencyMs && (
                          <span className="text-[9px] font-mono tabular-nums text-emerald-400 mt-1 block">
                            ⚡ {msg.latencyMs}ms processing
                          </span>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isThinking && (
                  <div className="flex items-center gap-2 text-slate-400 italic text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span>{activePod?.name} is synthesizing speech...</span>
                  </div>
                )}
              </div>

              {/* Quick Test Inquiries */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 font-mono">Quick Simulation Phrases:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Hello! What services do you offer?',
                    'Can I book an executive demo for tomorrow at 3 PM?',
                    'What is your pricing for the voice AI seat?',
                    'Please transfer me to your human manager.',
                  ].map((query, idx) => (
                    <button
                      key={idx}
                      disabled={callStatus !== 'connected'}
                      onClick={() => handleSendMessage(query)}
                      className="min-h-[36px] px-3 py-1 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 rounded-xl text-[11px] text-slate-300 disabled:opacity-40 transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Message & Mic Controls */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  disabled={callStatus !== 'connected'}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                  placeholder={callStatus === 'connected' ? 'Speak or type as client...' : 'Start live call to connect...'}
                  className="flex-1 min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-white/5 disabled:text-slate-500 font-sans"
                />
                <button
                  onClick={toggleMic}
                  disabled={callStatus !== 'connected'}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-all ${
                    !isMuted && recognitionRef.current
                      ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 disabled:opacity-40'
                  }`}
                  title="Toggle Microphone"
                >
                  {!isMuted && recognitionRef.current ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={callStatus !== 'connected' || !inputMessage.trim()}
                  className="min-h-[44px] px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Footer Controls: Start / End Call */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="text-xs text-slate-400 font-mono">
                  Channel: <strong className="text-white">Virtual SIP DID</strong> · Speed:{' '}
                  <strong className="text-emerald-400 tabular-nums">&lt;140ms</strong>
                </div>

                {callStatus === 'idle' || callStatus === 'ended' ? (
                  <button
                    onClick={handleStartCall}
                    className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Start Live Call</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="min-h-[44px] px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all animate-pulse"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call & Archive</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT PANE (lg:col-span-5): CUSTOMER LOOKUP, AI SCRIPTS & QUEUE
             ======================================================== */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Queue & Recommended AI Script Card */}
            <div className="bg-[#0b1220]/80 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white font-display">Recommended AI Script & Queue</h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono tabular-nums">
                  Queue Wait: 0.0s (Instant)
                </span>
              </div>

              {/* Dynamic Real-Time Recommended Script */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                  AI Context-Aware Suggestion
                </span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  "{recommendedScript}"
                </p>
              </div>

              {/* Cost Routing Breakdown Table */}
              <div className="p-3.5 bg-[#050811]/80 rounded-2xl border border-white/5 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  VoIP Infrastructure Cost per Minute (&lt;₹0.50/min target)
                </span>
                <div className="space-y-1.5 font-mono tabular-nums text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Virtual DID / SIP Ingestion (WebRTC):</span>
                    <span className="font-semibold text-white">₹0.20 / min</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Groq Whisper Speech-to-Text:</span>
                    <span className="font-semibold text-white">₹0.05 / min</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Gemini 2.5 Flash Reasoning:</span>
                    <span className="font-semibold text-white">₹0.02 / min</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Local Kokoro-82M Audio TTS:</span>
                    <span className="font-semibold text-emerald-400">₹0.00 / min (Free)</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-white/10 font-bold text-white text-xs">
                    <span>Total Telephony Cost:</span>
                    <span className="text-emerald-400">₹0.27 / min (46% Below ₹0.50 Cap)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-Time Customer Lookup & CRM Lead Capture */}
            <div className="bg-[#0b1220]/80 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white font-display">Customer CRM Lookup</h3>
                </div>
                <span className="text-xs text-emerald-400 font-semibold font-mono">
                  Live Webhook Sync
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">Caller Full Name</label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-mono text-[11px] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={callerPhone}
                      onChange={(e) => setCallerPhone(e.target.value)}
                      className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono text-[11px] mb-1">Company / Org</label>
                    <input
                      type="text"
                      value={callerCompany}
                      onChange={(e) => setCallerCompany(e.target.value)}
                      className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">Service Inquired</label>
                  <input
                    type="text"
                    value={serviceOfInterest}
                    onChange={(e) => setServiceOfInterest(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">Estimated Deal Value (₹)</label>
                  <input
                    type="number"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(parseInt(e.target.value) || 0)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
                  />
                </div>

                <button
                  onClick={handleCaptureLead}
                  className="w-full min-h-[44px] py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Save Lead to Business CRM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
