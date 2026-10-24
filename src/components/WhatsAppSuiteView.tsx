import React, { useState } from 'react';
import { 
  MessageSquare, Send, CheckCheck, FileText, 
  CreditCard, Calendar, Sparkles, User, Bot, 
  ShieldCheck, Phone, ArrowRight, Zap, RefreshCw
} from 'lucide-react';
import { WhatsAppMessage, BusinessLead, AgentPod } from '../types';

interface WhatsAppSuiteViewProps {
  leads: BusinessLead[];
  onTriggerVoiceCall: (phone: string, name: string) => void;
}

export const WhatsAppSuiteView: React.FC<WhatsAppSuiteViewProps> = ({
  leads,
  onTriggerVoiceCall,
}) => {
  const [selectedLead, setSelectedLead] = useState<BusinessLead>(
    leads[0] || {
      id: 'LEAD-01',
      name: 'Rajiv Malhotra',
      phone: '+91 98201 54321',
      email: 'rajiv@apexindustries.in',
      company: 'Apex Manufacturing Ltd',
      industry: 'Universal Business',
      serviceOfInterest: 'Enterprise Voice AI Telephony Seat (<140ms)',
      stage: 'demo_scheduled',
      value: 85000,
      assignedPodId: 'pod-02',
      assignedPodName: 'Rahul Sharma (Sales Closer)',
      notes: 'Requested live telephony demo for 5 call center desks.',
      source: 'voice_agent',
      createdAt: 'Today, 14:20',
      lastContact: 'Today, 14:35',
    }
  );

  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: 'wa-1',
      phone: '+91 98201 54321',
      recipientName: 'Rajiv Malhotra',
      direction: 'outbound',
      body: 'Hello Mr. Rajiv Malhotra! 👋 Thank you for inquiring about PODS 2026 Enterprise Voice AI for Apex Manufacturing.\n\nYour executive demo is scheduled for Tomorrow at 03:00 PM.\n\nMeeting link: https://meet.pods2026.ai/apex-demo',
      templateName: 'demo_confirmation',
      timestamp: '14:22',
      status: 'read',
      attachmentType: 'calendar_invite',
    },
    {
      id: 'wa-2',
      phone: '+91 98201 54321',
      recipientName: 'Rajiv Malhotra',
      direction: 'inbound',
      body: 'Can this voice agent integrate with our custom CRM webhook directly?',
      timestamp: '14:25',
      status: 'delivered',
    },
    {
      id: 'wa-3',
      phone: '+91 98201 54321',
      recipientName: 'Rajiv Malhotra',
      direction: 'outbound',
      body: 'Yes, absolutely! All 10 Agent Pods provide instant webhook REST synchronization with Supabase, Salesforce, and Zoho CRM in under 140ms.',
      templateName: 'crm_faq_reply',
      timestamp: '14:26',
      status: 'read',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const handleSendMessage = (textToSend?: string, attachment?: 'calendar_invite' | 'brochure_pdf' | 'payment_link') => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      phone: selectedLead.phone,
      recipientName: selectedLead.name,
      direction: 'outbound',
      body: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
      attachmentType: attachment,
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');

    // Simulate Client Reply after 2 seconds
    setTimeout(() => {
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        const reply: WhatsAppMessage = {
          id: `wa-client-${Date.now()}`,
          phone: selectedLead.phone,
          recipientName: selectedLead.name,
          direction: 'inbound',
          body: 'Thanks for the quick response! Sending this to our director to review the quote.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered',
        };
        setMessages((prev) => [...prev, reply]);
      }, 1500);
    }, 1000);
  };

  const dispatchTemplate = (type: 'demo' | 'proposal' | 'payment') => {
    if (type === 'demo') {
      handleSendMessage(
        `Hi ${selectedLead.name}! 📅 Here is your executive demo confirmation for ${selectedLead.serviceOfInterest}.\n\nDate: Tomorrow, 11:30 AM\nAgent Assigned: ${selectedLead.assignedPodName}\nCalendar: https://cal.pods2026.ai/meet`,
        'calendar_invite'
      );
    } else if (type === 'proposal') {
      handleSendMessage(
        `Hello ${selectedLead.name}! 📄 Here is your custom proposal & feature breakdown for ${selectedLead.company}.\n\nEstimated Investment: ₹${selectedLead.value.toLocaleString('en-IN')}\nIncludes: <140ms Voice Telephony + WhatsApp Cloud API + CRM Webhook`,
        'brochure_pdf'
      );
    } else if (type === 'payment') {
      handleSendMessage(
        `Hi ${selectedLead.name}! 💳 Click below to activate your Agent Pod license securely via UPI / Card:\n\nAmount: ₹${selectedLead.value.toLocaleString('en-IN')}\nPayment Link: https://pay.pods2026.ai/inv-${selectedLead.id}`,
        'payment_link'
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Lead Conversation Selector */}
      <div className="lg:col-span-4 bg-[#0b1220]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white font-display">WhatsApp Inbound & CRM</h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">
            Cloud API Active
          </span>
        </div>

        <div className="space-y-2 max-h-[620px] overflow-y-auto">
          {leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
                selectedLead.id === lead.id
                  ? 'bg-emerald-500/20 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-[#050811]/60 border-white/5 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="font-bold text-white font-sans">{lead.name}</span>
                <span className="text-[10px] text-slate-400">
                  ₹{lead.value.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">{lead.company}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>{lead.phone}</span>
                <span className="capitalize text-emerald-400 font-semibold">{lead.stage.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: WhatsApp Interactive Chat Sandbox */}
      <div className="lg:col-span-8 bg-[#0b1220]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between overflow-hidden">
        {/* Chat Header */}
        <div className="bg-[#050811] text-white p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-lg text-emerald-400">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white font-display">{selectedLead.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedLead.company}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">
                {selectedLead.phone} · Active Meta API
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerVoiceCall(selectedLead.phone, selectedLead.name)}
              className="min-h-[44px] px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Escalate to Call</span>
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="p-4 sm:p-6 space-y-3 bg-[#030712]/90 min-h-[380px] max-h-[440px] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.direction === 'outbound' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs space-y-1.5 shadow-md ${
                  msg.direction === 'outbound'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs'
                    : 'bg-[#0b1220] text-slate-100 border border-white/10 rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.body}</p>

                {msg.attachmentType === 'calendar_invite' && (
                  <div className="p-2.5 rounded-xl bg-black/20 border border-white/10 flex items-center gap-2 text-[11px]">
                    <Calendar className="w-4 h-4 text-emerald-200" />
                    <span>Calendar Invite: Executive Walkthrough</span>
                  </div>
                )}

                {msg.attachmentType === 'brochure_pdf' && (
                  <div className="p-2.5 rounded-xl bg-black/20 border border-white/10 flex items-center gap-2 text-[11px]">
                    <FileText className="w-4 h-4 text-cyan-200" />
                    <span>Commercial Proposal & SLA Breakdown (.pdf)</span>
                  </div>
                )}

                {msg.attachmentType === 'payment_link' && (
                  <div className="p-2.5 rounded-xl bg-black/20 border border-white/10 flex items-center gap-2 text-[11px]">
                    <CreditCard className="w-4 h-4 text-emerald-200" />
                    <span>Instant UPI & Card Checkout URL</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 text-[10px] opacity-75 font-mono">
                  <span>{msg.timestamp}</span>
                  {msg.direction === 'outbound' && <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />}
                </div>
              </div>
            </div>
          ))}

          {isBotTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{selectedLead.name} is typing...</span>
            </div>
          )}
        </div>

        {/* Quick Automation Templates Dispatch */}
        <div className="p-3 bg-[#050811] border-t border-white/10 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase shrink-0">
            1-Click Templates:
          </span>
          <button
            onClick={() => dispatchTemplate('demo')}
            className="min-h-[36px] px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-white/10 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Confirm Demo</span>
          </button>
          <button
            onClick={() => dispatchTemplate('proposal')}
            className="min-h-[36px] px-3 py-1.5 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-white/10 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Send Proposal</span>
          </button>
          <button
            onClick={() => dispatchTemplate('payment')}
            className="min-h-[36px] px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-white/10 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payment Link</span>
          </button>
        </div>

        {/* Text Input Strip */}
        <div className="p-3 sm:p-4 bg-[#050811] border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Message ${selectedLead.name} on WhatsApp...`}
            className="flex-1 min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#030712] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
          />
          <button
            onClick={() => handleSendMessage()}
            className="min-h-[44px] px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
