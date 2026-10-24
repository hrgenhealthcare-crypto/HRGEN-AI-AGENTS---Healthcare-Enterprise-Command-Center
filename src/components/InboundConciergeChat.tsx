import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  PhoneCall,
  Sparkles,
  User,
} from 'lucide-react';
import { AgentPod } from '../types';
import { AgentAvatar } from './AgentAvatar';

interface InboundConciergeChatProps {
  pods: AgentPod[];
  onEscalateToVoice: (selectedPodId: string, visitorName: string, query: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'visitor';
  text: string;
  timestamp: string;
  matchedPodId?: string;
  matchedPodName?: string;
  suggestedAction?: 'call_now' | 'view_pricing' | null;
}

export const InboundConciergeChat: React.FC<InboundConciergeChatProps> = ({
  pods,
  onEscalateToVoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'bot',
      text: 'Hello! Welcome to HRGen Agentic AI. I am Aria, your inbound concierge specialist. How can I assist your enterprise today?',
      timestamp: 'Just now',
      matchedPodId: 'concierge',
      matchedPodName: 'Aria Concierge',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const triageTopics = [
    {
      label: 'Pricing & Seat Licenses',
      query: 'What is the pricing for HRGen AI seats?',
      podKeyword: 'Finance',
      podId: 'pod-06',
    },
    {
      label: 'Book Live Enterprise Demo',
      query: 'Can I book a live demo for my team?',
      podKeyword: 'Sales',
      podId: 'pod-02',
    },
    {
      label: 'Technical API Integration',
      query: 'How does your voice API integrate?',
      podKeyword: 'Solutions',
      podId: 'pod-04',
    },
    {
      label: 'Customer Support Escalation',
      query: 'I need help with my existing service',
      podKeyword: 'Support',
      podId: 'pod-01',
    },
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const newVisitorMsg: ChatMessage = {
      id: `vis-${Date.now()}`,
      sender: 'visitor',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newVisitorMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    const lower = text.toLowerCase();

    let matchedPod = pods[0];
    let replyText = '';
    let suggestedAction: 'call_now' | 'view_pricing' | null = null;

    if (
      lower.includes('price') ||
      lower.includes('cost') ||
      lower.includes('license') ||
      lower.includes('rate')
    ) {
      matchedPod =
        pods.find((p) => p.id === 'pod-06' || p.role.includes('Finance')) || pods[0];
      replyText = `Our enterprise licenses start at ₹7,500/month per agent seat. Would you like to speak directly with ${matchedPod.name} (${matchedPod.role})?`;
      suggestedAction = 'call_now';
    } else if (
      lower.includes('demo') ||
      lower.includes('sales') ||
      lower.includes('meeting') ||
      lower.includes('walkthrough')
    ) {
      matchedPod =
        pods.find((p) => p.id === 'pod-02' || p.role.includes('Sales')) || pods[1] || pods[0];
      replyText = `I can arrange a tailored walkthrough. ${matchedPod.name} is available on the live voice desk. Would you like to connect right now?`;
      suggestedAction = 'call_now';
    } else if (
      lower.includes('api') ||
      lower.includes('tech') ||
      lower.includes('latency') ||
      lower.includes('integrate') ||
      lower.includes('code')
    ) {
      matchedPod =
        pods.find((p) => p.id === 'pod-04' || p.role.includes('Solutions')) || pods[3] || pods[0];
      replyText = `HRGen Agentic AI supports WebRTC, SIP DID ingestion, and Webhooks. ${matchedPod.name} can walk you through the architecture.`;
      suggestedAction = 'call_now';
    } else if (
      lower.includes('support') ||
      lower.includes('help') ||
      lower.includes('issue') ||
      lower.includes('problem')
    ) {
      matchedPod =
        pods.find((p) => p.id === 'pod-08' || p.role.includes('Support')) || pods[5] || pods[0];
      replyText = `I understand. ${matchedPod.name} on our Technical Support desk can immediately assist with your account.`;
      suggestedAction = 'call_now';
    } else {
      matchedPod = pods[0];
      replyText = `Thank you for sharing. Based on your inquiry, I recommend connecting with ${matchedPod.name} for full end-to-end guidance.`;
      suggestedAction = 'call_now';
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          matchedPodId: matchedPod?.id,
          matchedPodName: matchedPod?.name,
          suggestedAction,
        },
      ]);
    }, 650);
  };

  const handleEscalateNow = (podId?: string) => {
    const targetPodId = podId || pods[0]?.id || 'pod-01';
    const effectiveName = visitorName.trim() || 'Website Visitor';
    const recentQuery = messages[messages.length - 1]?.text || 'General Inquiry';
    onEscalateToVoice(targetPodId, effectiveName, recentQuery);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Concierge Button with Friendly Avatar */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative px-3.5 py-2 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white font-bold shadow-2xl flex items-center gap-2.5 border border-emerald-400/40 cursor-pointer"
          title="Open Aria AI Concierge Triage"
        >
          <div className="relative">
            <AgentAvatar
              podId="concierge"
              name="Aria Concierge"
              role="Omnichannel Concierge"
              size="sm"
              status="online"
              rounded="full"
            />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
            )}
          </div>
          <div className="text-left pr-1">
            <span className="text-xs font-extrabold tracking-tight font-display block text-white">
              Aria Concierge
            </span>
            <span className="text-[10px] font-mono text-emerald-400 block">
              Inbound Triage Desk
            </span>
          </div>
        </motion.button>
      </div>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 sm:bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] max-h-[580px] h-[520px] bg-[#070c18]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans"
          >
            {/* Header with Friendly Human Avatar */}
            <div className="p-4 bg-gradient-to-r from-emerald-500/15 via-[#0b1220] to-[#070c18] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AgentAvatar
                  podId="concierge"
                  name="Aria Concierge"
                  role="24/7 Omnichannel Concierge"
                  size="sm"
                  status="online"
                  rounded="xl"
                />
                <div>
                  <h4 className="font-bold text-xs text-white flex items-center gap-1.5 font-display">
                    Aria — Inbound Concierge
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-mono">
                    Specialist Triage & Voice Routing
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Concierge Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Name Input */}
            <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono text-[10px]">Your Name:</span>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Optional (e.g. Rahul Sharma)"
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 ${
                    m.sender === 'visitor' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.sender === 'bot' && (
                    <AgentAvatar
                      podId={m.matchedPodId || 'concierge'}
                      name={m.matchedPodName || 'Aria Concierge'}
                      size="xs"
                      rounded="full"
                      className="mt-0.5"
                    />
                  )}

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      m.sender === 'visitor'
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-white rounded-tr-xs'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-xs shadow-md'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className="text-[9px] text-slate-500 mt-1 block font-mono tabular-nums">
                      {m.timestamp}
                    </span>

                    {m.suggestedAction === 'call_now' && (
                      <div className="mt-2.5 pt-2 border-t border-white/10">
                        <button
                          onClick={() => handleEscalateNow(m.matchedPodId)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5 fill-slate-950" />
                          <span>
                            Connect Voice Call with {m.matchedPodName?.split(' ')[0] || 'Agent'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {m.sender === 'visitor' && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                  <span>Aria is matching your inquiry with the best specialist...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Triage Chips */}
            <div className="px-3 py-2 bg-[#0b1220] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {triageTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(topic.query)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-emerald-500/15 hover:text-emerald-300 border border-white/10 text-[10px] text-slate-300 whitespace-nowrap transition-colors shrink-0 font-medium cursor-pointer"
                >
                  {topic.label}
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <div className="p-3 bg-[#070c18] border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about pricing, demos, or API setup..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
                aria-label="Send Concierge Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
