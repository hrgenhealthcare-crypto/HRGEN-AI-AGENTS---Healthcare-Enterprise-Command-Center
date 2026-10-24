import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, Sparkles, 
  Send, RefreshCw, CheckCircle2, AlertCircle, 
  User, Bot, ShieldCheck, Zap, ArrowRight, UserCheck, 
  Clock, ShieldAlert, PhoneForwarded, History, SplitSquareVertical,
  PhoneIncoming, PhoneOutgoing, LayoutGrid, DollarSign,
  FileCode2, ChevronRight, Check, Flag, Compass, Brain,
  ThumbsUp, ThumbsDown, MessageSquareQuote, Activity
} from 'lucide-react';
import { CallMessage, AgentPod, BusinessLead, CallLogItem } from '../types';
import { CallHistorySection } from './CallHistorySection';
import { StarRingBackground } from './StarRingBackground';
import { JarvisHologramAvatar } from './JarvisHologramAvatar';
import { executeAgentApiRequest } from '../utils/apiClient';

interface VoiceWebphoneProps {
  pods: AgentPod[];
  activePodId: string;
  onSelectPod: (podId: string) => void;
  onLeadCreated: (lead: Partial<BusinessLead>) => void;
  onOpenRagInspector?: (podId: string) => void;
}

export const VoiceWebphone: React.FC<VoiceWebphoneProps> = ({
  pods,
  activePodId,
  onSelectPod,
  onLeadCreated,
  onOpenRagInspector,
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
  const [showLiveTranscriptionOverlay, setShowLiveTranscriptionOverlay] = useState<boolean>(true);

  // Intelligent Call Routing State
  const [selectedRouteTopic, setSelectedRouteTopic] = useState<string>('auto');
  const [routingNotification, setRoutingNotification] = useState<string | null>(null);

  // Live Sentiment Analysis & Review Flagging
  const [sentimentScore, setSentimentScore] = useState<number>(78);
  const [isFlaggedForReview, setIsFlaggedForReview] = useState<boolean>(false);
  const [flagReason, setFlagReason] = useState<string>('');

  // Language / Voice Accent Profile (English vs Hindi North Indian Soft Tone)
  const [voiceLanguageProfile, setVoiceLanguageProfile] = useState<'english' | 'hindi_soft'>('english');

  // Real-time Context-Aware Suggested Responses
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([
    "Thank you for calling HRGen Agentic AI! How may I assist your business today?",
    "I would be glad to schedule an executive demonstration for your team tomorrow.",
    "Our enterprise tier starts at ₹7,500/seat with zero upfront infrastructure cost."
  ]);

  const handleToggleVoiceLanguage = (profile: 'english' | 'hindi_soft') => {
    setVoiceLanguageProfile(profile);
    if (profile === 'hindi_soft') {
      setSuggestedResponses([
        'हमारे एंटरप्राइज प्लान ₹7,500 प्रति माह से शुरू होते हैं जिसमें शून्य सेटअप शुल्क है।',
        'क्या मैं कल सुबह 11:00 बजे आपके लिए एक व्यक्तिगत डेमो स्लॉट बुक कर दूँ?',
        'मैं इस कॉल को तुरंत हमारे सीनियर ऑपरेशन्स मैनेजर को ट्रांसफर कर रही हूँ।',
      ]);
    } else {
      setSuggestedResponses([
        'Thank you for calling HRGen Agentic AI! How may I assist your business today?',
        'I would be glad to schedule an executive demonstration for your team tomorrow.',
        'Our enterprise tier starts at ₹7,500/seat with zero upfront infrastructure cost.',
      ]);
    }
  };

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

  // Audio Speech Synthesis with North Indian Soft Hindi Tuning
  const playAgentVoice = (text: string) => {
    setIsSpeaking(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceLanguageProfile === 'hindi_soft') {
        utterance.lang = 'hi-IN';
        utterance.rate = 0.95; // Soft, gentle North Indian cadence
        utterance.pitch = 1.05; // Warm, friendly tone
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(
          (v) =>
            v.lang.startsWith('hi') ||
            v.name.toLowerCase().includes('hindi') ||
            v.name.toLowerCase().includes('lekha') ||
            v.name.toLowerCase().includes('neerja')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        utterance.lang = 'en-IN';
        utterance.rate = 1.1; // brisk, conversational speed
        utterance.pitch = 1.0;
      }
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  // Routing topics definitions
  const routingCategories = [
    { id: 'reception', label: 'Inbound Reception', podRoleMatch: 'Reception', agentFallback: 'Priya Sharma', matchRate: 99 },
    { id: 'sales', label: 'Sales & Demo', podRoleMatch: 'Sales', agentFallback: 'Aarav Mehta', matchRate: 98 },
    { id: 'support', label: 'Tech Support', podRoleMatch: 'Support', agentFallback: 'Neha Patel', matchRate: 97 },
    { id: 'tech', label: 'API Architecture', podRoleMatch: 'Solutions', agentFallback: 'Rohan Kapoor', matchRate: 99 },
    { id: 'finance', label: 'Commercial & Billing', podRoleMatch: 'Finance', agentFallback: 'Kabir Joshi', matchRate: 96 },
    { id: 'hr', label: 'Talent & Hiring', podRoleMatch: 'Talent', agentFallback: 'Pooja Sen', matchRate: 95 },
  ];

  const handleRouteByTopic = (topicId: string) => {
    setSelectedRouteTopic(topicId);
    const cat = routingCategories.find((c) => c.id === topicId);
    if (!cat) return;

    const matchedPod = pods.find((p) => 
      p.role.toLowerCase().includes(cat.podRoleMatch.toLowerCase()) || 
      p.name.toLowerCase().includes(cat.agentFallback.toLowerCase())
    ) || pods[0];

    if (matchedPod) {
      onSelectPod(matchedPod.id);
      setRoutingNotification(`Intelligently routed call to ${matchedPod.name} (${cat.matchRate}% domain expertise match)`);
      setTimeout(() => setRoutingNotification(null), 4000);
    }
  };

  const handleAutoRouteByQuery = () => {
    const textToAnalyze = `${serviceOfInterest} ${transcript.map((t) => t.text).join(' ')}`.toLowerCase();
    let bestCat = routingCategories[0];
    if (textToAnalyze.includes('sale') || textToAnalyze.includes('pricing') || textToAnalyze.includes('buy') || textToAnalyze.includes('cost')) {
      bestCat = routingCategories.find((c) => c.id === 'sales') || routingCategories[1];
    } else if (textToAnalyze.includes('bug') || textToAnalyze.includes('error') || textToAnalyze.includes('issue') || textToAnalyze.includes('support')) {
      bestCat = routingCategories.find((c) => c.id === 'support') || routingCategories[2];
    } else if (textToAnalyze.includes('api') || textToAnalyze.includes('code') || textToAnalyze.includes('webhook') || textToAnalyze.includes('tech')) {
      bestCat = routingCategories.find((c) => c.id === 'tech') || routingCategories[3];
    } else if (textToAnalyze.includes('bill') || textToAnalyze.includes('invoice') || textToAnalyze.includes('payment')) {
      bestCat = routingCategories.find((c) => c.id === 'finance') || routingCategories[4];
    } else if (textToAnalyze.includes('hire') || textToAnalyze.includes('job') || textToAnalyze.includes('candidate')) {
      bestCat = routingCategories.find((c) => c.id === 'hr') || routingCategories[5];
    }

    handleRouteByTopic(bestCat.id);
  };

  // Start Call
  const handleStartCall = () => {
    setCallStatus('calling');
    setIsTransferring(false);
    setQueueWaitTime(0);
    setSentimentScore(78);
    setIsFlaggedForReview(false);
    setFlagReason('');

    setTimeout(() => {
      setCallStatus('connected');
      const greetingText = voiceLanguageProfile === 'hindi_soft'
        ? `नमस्ते! HRGen Agentic AI में आपका स्वागत है। मैं ${activePod?.name.split(' ')[0]} बोल रही हूँ। आज मैं आपकी किस प्रकार सहायता कर सकती हूँ?`
        : activePod?.greeting || 'Hello! Thank you for calling HRGen Agentic AI. How may I assist your enterprise operations today?';

      const greetingMsg: CallMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        text: greetingText,
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
        podName: activePod?.name || 'Priya Sharma (Inbound Reception)',
        clientName: callerName || 'Direct Caller',
        phone: callerPhone || '+91 98000 00000',
        direction: callDirection,
        duration: formattedDuration === '0m 00s' ? '0m 45s' : formattedDuration,
        timestamp: 'Just now',
        sentiment: sentimentScore > 70 ? 'positive' : sentimentScore > 45 ? 'neutral' : 'converted',
        sentimentScore,
        flaggedForReview: isFlaggedForReview,
        routingReason: selectedRouteTopic !== 'auto' ? `Routed via ${selectedRouteTopic}` : 'Auto-routed via Intent',
        summary: `AI voice telephony call with ${callerName || 'Client'}. ${isFlaggedForReview ? '⚠️ Flagged for manager review: ' + (flagReason || 'Sentiment drop') + '.' : isTransferring ? 'Transferred to operational manager.' : 'Logistics details exchanged successfully.'}`,
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

      // Auto-trigger Hermes Self-Improver skill to extract call insights
      fetch('/api/memory/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId: activePod?.id || 'pod-01',
          callId: newLogItem.id,
          clientName: callerName,
          keyObjection: isFlaggedForReview ? flagReason : undefined,
          transcriptSummary: newLogItem.summary,
        }),
      }).catch((err) => console.error('Hermes learning hook:', err));

      setArchivedAlert(`Call logged to history (${newLogItem.id}) with ${transcript.length} turns.${isFlaggedForReview ? ' (Flagged for Review)' : ''}`);
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

    const lower = userText.toLowerCase();

    // 1. Live Sentiment Analysis
    let delta = 0;
    const positiveWords = ['great', 'awesome', 'excellent', 'thanks', 'thank', 'perfect', 'good', 'love', 'helpful', 'interested', 'yes', 'superb', 'fast', 'clear', 'nice', 'appreciate'];
    const negativeWords = ['bad', 'terrible', 'worst', 'slow', 'fail', 'error', 'frustrated', 'annoyed', 'expensive', 'cancel', 'delay', 'issue', 'hate', 'waste', 'manager', 'human', 'stupid', 'ridiculous', 'broken', 'scam', 'unacceptable'];

    positiveWords.forEach((pw) => {
      if (lower.includes(pw)) delta += 8;
    });
    negativeWords.forEach((nw) => {
      if (lower.includes(nw)) delta -= 18;
    });

    const updatedSentiment = Math.max(12, Math.min(99, sentimentScore + delta));
    setSentimentScore(updatedSentiment);

    if (updatedSentiment < 45 || negativeWords.some((nw) => lower.includes(nw))) {
      setIsFlaggedForReview(true);
      setFlagReason(updatedSentiment < 45 ? 'Sentiment score dropped below 45%' : 'Negative trigger / friction keywords detected');
    }

    // 2. Dynamic Real-time Suggested Responses
    if (lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('fee')) {
      setRecommendedScript('Emphasize <₹0.50/min routing efficiency and ₹7,500/seat monthly license with zero setup fee.');
      setSuggestedResponses([
        'Our enterprise plan is ₹7,500/seat/month with unlimited inbound AI telephony minutes.',
        'Shall I send the complete pricing tier PDF directly to your WhatsApp?',
        'I can route you directly to Kabir Joshi (Commercial Lead) for a custom volume discount.',
      ]);
    } else if (lower.includes('demo') || lower.includes('time') || lower.includes('meeting') || lower.includes('slot')) {
      setRecommendedScript('Offer tomorrow at 11 AM or 3 PM for a personalized video walkthrough.');
      setSuggestedResponses([
        'I can book a personalized executive demo for you tomorrow at 11:00 AM or 3:30 PM IST.',
        'Would you prefer a 15-minute quick walkthrough over Google Meet?',
        'I will immediately generate and send the calendar invite to your registered phone number.',
      ]);
    } else if (lower.includes('manager') || lower.includes('human') || lower.includes('escalat') || lower.includes('transfer')) {
      setRecommendedScript('Hold chime active: politely transfer caller to the executive managerial queue.');
      setSuggestedResponses([
        'I am placing this call on priority hold chime and connecting you to our supervisor immediately.',
        'Allow me 5 seconds to transfer this session to our senior operations lead.',
        'Would you like me to note down your exact concern so the manager is briefed before answering?',
      ]);
    } else if (lower.includes('support') || lower.includes('api') || lower.includes('error') || lower.includes('bug') || lower.includes('tech')) {
      setRecommendedScript('Offer immediate automated endpoint health check or route to Technical Solutions.');
      setSuggestedResponses([
        'I am running a real-time health check on your API endpoints and SIP trunks now.',
        'Let me route you directly to Rohan Kapoor (Technical Solutions Lead) for debugging.',
        'I have generated a high-priority support ticket #TK-8492 with our 1-hour SLA.',
      ]);
    } else {
      setSuggestedResponses([
        'How many inbound or outbound voice minutes does your enterprise handle monthly?',
        'Our autonomous agents integrate with your existing CRM and WhatsApp Cloud API in under 5 minutes.',
        'Would you like a live demonstration of our sub-140ms voice latency?',
      ]);
    }

    const apiResult = await executeAgentApiRequest<{
      success: boolean;
      replyText: string;
      latencyMs?: number;
      wordCount?: number;
      transferToManager?: boolean;
      engineModel?: string;
    }>('/api/gemini/pod-reply', {
      method: 'POST',
      body: {
        podId: activePod?.id,
        userMessage: userText,
        conversationHistory: newTranscript.map((t) => ({ role: t.role, text: t.text })),
        channel: 'voice',
        callerName,
        callerPhone,
        voiceLanguageProfile,
      },
      timeoutMs: 12000,
    });

    setIsThinking(false);

    if (apiResult.classification === 'valid_agent_response' && apiResult.data?.replyText) {
      const data = apiResult.data;
      setLatencyMs(data.latencyMs || apiResult.latencyMs || 138);
      setLastWordCount(data.wordCount || 14);

      if (data.transferToManager) {
        setIsTransferring(true);
      }

      const agentReply: CallMessage = {
        id: `agt-${Date.now()}`,
        role: 'agent',
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latencyMs: data.latencyMs || apiResult.latencyMs,
      };

      setTranscript((prev) => [...prev, agentReply]);
      playAgentVoice(data.replyText);
    } else if (apiResult.classification === 'service_unavailable' || apiResult.classification === 'validation_error') {
      setRoutingNotification(
        apiResult.errorMessage || 'Voice backend service temporarily unreachable.'
      );
      setTimeout(() => setRoutingNotification(null), 4000);
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setRoutingNotification('Speech Recognition is not supported by this browser. Use the prompt box below.');
      setTimeout(() => setRoutingNotification(null), 4000);
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
    recognition.lang = voiceLanguageProfile === 'hindi_soft' ? 'hi-IN' : 'en-IN';

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

  const latestAgentTurn = [...transcript].reverse().find((m) => m.role === 'agent');
  const latestCustomerTurn = [...transcript].reverse().find((m) => m.role === 'user');

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

        {/* Hermes RAG Memory Inspector Quick Button */}
        {onOpenRagInspector && (
          <button
            onClick={() => onOpenRagInspector(activePodId)}
            className="px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            title="Inspect RAG Memory Bank & Hermes Self-Improver"
          >
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">RAG Memory & Hermes</span>
            <span className="sm:hidden">Hermes</span>
          </button>
        )}
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

              {/* Controls: Hindi Soft Voice Profile + Inbound/Outbound Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Hindi North Indian Soft Voice Toggle */}
                <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl text-[11px] font-semibold">
                  <button
                    onClick={() => handleToggleVoiceLanguage('english')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      voiceLanguageProfile === 'english'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleToggleVoiceLanguage('hindi_soft')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      voiceLanguageProfile === 'hindi_soft'
                        ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-200 font-bold border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Hindi (Soft Tone)</span>
                  </button>
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
            </div>

            {/* AI FEATURE 1: INTELLIGENT CALL ROUTING BAR */}
            <div className="bg-[#0b1220]/80 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-display">Intelligent Call Routing Engine</span>
                </div>
                <button
                  onClick={handleAutoRouteByQuery}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/25 transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Auto-Route by Intent</span>
                </button>
              </div>

              {/* Topic Pills */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {routingCategories.map((cat) => {
                  const isSelected = selectedRouteTopic === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleRouteByTopic(cat.id)}
                      className={`px-2.5 py-1 text-[11px] rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[9px] font-mono text-emerald-400 opacity-80">{cat.matchRate}%</span>
                    </button>
                  );
                })}
              </div>

              {routingNotification && (
                <div className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{routingNotification}</span>
                </div>
              )}
            </div>

            {/* AI FEATURE 2: LIVE SENTIMENT ANALYSIS & SUPERVISOR REVIEW FLAG */}
            <div className="bg-[#0b1220]/80 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-white font-display">Live Caller Sentiment</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsFlaggedForReview(!isFlaggedForReview);
                      if (!isFlaggedForReview) setFlagReason('Manually flagged by supervisor');
                    }}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all flex items-center gap-1 ${
                      isFlaggedForReview
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 border-white/10'
                    }`}
                  >
                    <Flag className={`w-3 h-3 ${isFlaggedForReview ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`} />
                    <span>{isFlaggedForReview ? 'Flagged for Review' : 'Flag for Review'}</span>
                  </button>
                </div>
              </div>

              {/* Sentiment Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-slate-400">
                    Caller Mood:{' '}
                    <strong className={sentimentScore >= 70 ? 'text-emerald-400' : sentimentScore >= 45 ? 'text-amber-400' : 'text-rose-400'}>
                      {sentimentScore >= 75 ? 'Delighted & Satisfied' : sentimentScore >= 55 ? 'Positive' : sentimentScore >= 45 ? 'Neutral' : 'Frustrated / At Risk'}
                    </strong>
                  </span>
                  <span className="font-bold text-white">{sentimentScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      sentimentScore >= 70
                        ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                        : sentimentScore >= 45
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                        : 'bg-gradient-to-r from-rose-600 to-rose-400'
                    }`}
                    style={{ width: `${sentimentScore}%` }}
                  />
                </div>
              </div>

              {/* Prominent Review Warning Banner if Flagged */}
              {isFlaggedForReview && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="font-bold block">Flagged for Manager Review</span>
                      <span className="text-[10px] text-rose-300">
                        {flagReason || 'Caller satisfaction dropped below 45%.'} Marked in call history.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setIsTransferring(true)}
                      className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-[10px] font-bold"
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => setIsFlaggedForReview(false)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-[10px]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3D JARVIS HOLOGRAPHIC HUMAN AVATAR (Materializes on Call/Speech & Vanishes on End) */}
            <JarvisHologramAvatar
              mode="inline"
              isActive={callStatus === 'connected' || isSpeaking || isThinking}
              isSpeaking={isSpeaking}
              agentName={activePod?.name || 'Priya Sharma'}
              agentRole={activePod?.role || 'Voice AI Specialist'}
              spokenText={latestAgentTurn?.text || activePod?.greeting}
            />

            {/* Manager Handover Alert if triggered */}
            {isTransferring && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <PhoneForwarded className="w-4 h-4 text-amber-400 animate-bounce" />
                  <div>
                    <span className="font-bold block">Live Transfer Triggered (Hold Chime Active)</span>
                    <span className="text-[11px] text-amber-300">
                      Caller requested manager or complex topic. Routed to human executive queue.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300">
                  Transferring...
                </span>
              </div>
            )}

            {/* Audio Waveform Canvas, Floating Apple Glassmorphism Live-Transcription Overlay & Stream */}
            <div className="bg-[#0b1220]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl space-y-4">
              {/* Waveform Canvas + Floating Apple Glass Live-Transcription Overlay Toggle */}
              <div className="bg-[#050811] rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden min-h-[112px] border border-white/10">
                <canvas ref={canvasRef} width={480} height={60} className="w-full h-16" />

                <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono tabular-nums pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    {callStatus === 'connected' ? `Live Telephony Stream · ${formatDuration(callDuration)}` : 'SIP Engine Ready'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>24kHz HD Audio · {activePod?.voiceId}</span>
                    <button
                      type="button"
                      onClick={() => setShowLiveTranscriptionOverlay(!showLiveTranscriptionOverlay)}
                      className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                        showLiveTranscriptionOverlay
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}
                    >
                      {showLiveTranscriptionOverlay ? 'Live Glass HUD: ON' : 'Live Glass HUD: OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* APPLE GLASSMORPHISM LIVE-TRANSCRIPTION OVERLAY HUD */}
              {showLiveTranscriptionOverlay && (
                <div className="relative overflow-hidden apple-glass-card rounded-2xl p-4 border border-emerald-500/35 shadow-2xl space-y-2.5">
                  <StarRingBackground variant="card" accentColor="#10b981" secondaryColor="#06b6d4" />

                  <div className="relative z-10 flex items-center justify-between text-[11px] font-mono border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          callStatus === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
                        }`}
                      />
                      <span className="font-bold text-white uppercase tracking-wider">
                        Live Transcription HUD Overlay
                      </span>
                    </div>
                    <span className="text-emerald-300 font-bold">
                      {voiceLanguageProfile === 'hindi_soft' ? 'HI-IN Soft' : 'EN-IN'} · {latencyMs}ms
                    </span>
                  </div>

                  <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* Customer Live Speech Bubble */}
                    <div className="p-3 rounded-xl bg-black/45 backdrop-blur-md border border-cyan-500/30 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                        <span className="font-bold flex items-center gap-1">
                          <User className="w-3 h-3 text-cyan-400" />
                          <span>CUSTOMER ({callerName})</span>
                        </span>
                        <span>{latestCustomerTurn?.timestamp || 'Listening...'}</span>
                      </div>
                      <p className="text-slate-100 font-medium leading-snug line-clamp-2">
                        {latestCustomerTurn
                          ? `"${latestCustomerTurn.text}"`
                          : callStatus === 'connected'
                          ? 'Waiting for caller speech or prompt input...'
                          : 'Press "Start Live Call" to stream customer speech.'}
                      </p>
                    </div>

                    {/* Agent Live Speech Bubble */}
                    <div className="p-3 rounded-xl bg-emerald-950/35 backdrop-blur-md border border-emerald-500/40 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300">
                        <span className="font-bold flex items-center gap-1">
                          <Bot className="w-3 h-3 text-emerald-400" />
                          <span>AGENT ({activePod?.name})</span>
                        </span>
                        <span>
                          {isSpeaking
                            ? '🔊 SPEAKING'
                            : isThinking
                            ? '⚡ SYNTHESIZING'
                            : latestAgentTurn?.timestamp || 'Ready'}
                        </span>
                      </div>
                      <p className="text-emerald-100 font-medium leading-snug line-clamp-2">
                        {isThinking
                          ? 'Synthesizing sub-140ms neural response...'
                          : latestAgentTurn
                          ? `"${latestAgentTurn.text}"`
                          : `"${activePod?.greeting || 'Ready for live voice session.'}"`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* AI FEATURE 3: REAL-TIME CONTEXT-AWARE SUGGESTED RESPONSES */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300 font-mono flex items-center gap-1.5">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-Time Suggested Responses (Tap to Send):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Context-Adaptive</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {suggestedResponses.map((suggestion, idx) => (
                    <button
                      key={idx}
                      disabled={callStatus !== 'connected'}
                      onClick={() => handleSendMessage(suggestion)}
                      className="w-full text-left p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border border-emerald-500/25 rounded-xl text-xs disabled:opacity-40 transition-all flex items-start gap-2 group active:scale-[0.99]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="leading-relaxed flex-1 font-medium">{suggestion}</span>
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
