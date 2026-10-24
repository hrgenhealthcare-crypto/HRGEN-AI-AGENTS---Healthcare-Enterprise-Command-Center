import React, { useState } from 'react';
import { 
  Users, UserCheck, Calendar, DollarSign, Filter, 
  Search, ArrowRight, CheckCircle2, Clock, Phone, 
  Mail, Building2, Plus, Sparkles, TrendingUp, MessageSquare
} from 'lucide-react';
import { BusinessLead, LeadStage, AgentPod } from '../types';
import { StarRingBackground } from './StarRingBackground';

interface CrmManagerViewProps {
  leads: BusinessLead[];
  onUpdateLeadStage: (leadId: string, stage: LeadStage) => void;
  onOpenNewLeadModal: () => void;
  onTriggerCall: (phone: string, name: string) => void;
  onTriggerWhatsApp: (phone: string, name: string) => void;
}

export const CrmManagerView: React.FC<CrmManagerViewProps> = ({
  leads,
  onUpdateLeadStage,
  onOpenNewLeadModal,
  onTriggerCall,
  onTriggerWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | LeadStage>('all');

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.serviceOfInterest.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
  const wonCount = leads.filter((l) => l.stage === 'won').length;

  return (
    <div className="space-y-6">
      {/* Top CRM KPI Bar (Apple Glassmorphism + Two Rings & Stars) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono-numbers text-xs">
        <div className="relative overflow-hidden apple-glass-card p-4 rounded-3xl">
          <StarRingBackground variant="card" accentColor="#10b981" secondaryColor="#06b6d4" />
          <div className="relative z-10 flex items-center justify-between text-slate-300 mb-1.5">
            <span className="font-sans text-[11px]">Total Pipeline</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="relative z-10 text-xl sm:text-2xl font-bold text-white block font-display">
            ₹{totalPipelineValue.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="relative overflow-hidden apple-glass-card p-4 rounded-3xl">
          <StarRingBackground variant="card" accentColor="#06b6d4" secondaryColor="#3b82f6" />
          <div className="relative z-10 flex items-center justify-between text-slate-300 mb-1.5">
            <span className="font-sans text-[11px]">Total Leads</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="relative z-10 text-xl sm:text-2xl font-bold text-cyan-400 block font-display">
            {leads.length} Leads
          </span>
        </div>

        <div className="relative overflow-hidden apple-glass-card p-4 rounded-3xl">
          <StarRingBackground variant="card" accentColor="#22c55e" secondaryColor="#10b981" />
          <div className="relative z-10 flex items-center justify-between text-slate-300 mb-1.5">
            <span className="font-sans text-[11px]">Deals Won</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="relative z-10 text-xl sm:text-2xl font-bold text-emerald-400 block font-display">
            {wonCount} Closed
          </span>
        </div>

        <div className="relative overflow-hidden apple-glass-card p-4 rounded-3xl">
          <StarRingBackground variant="card" accentColor="#a855f7" secondaryColor="#06b6d4" />
          <div className="relative z-10 flex items-center justify-between text-slate-300 mb-1.5">
            <span className="font-sans text-[11px]">Avg Response</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <span className="relative z-10 text-xl sm:text-2xl font-bold text-violet-400 block font-display">
            &lt;140ms
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0b1220]/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lead name, company, phone, service..."
            className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-[#050811] text-white focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-slate-400 font-mono text-[11px]">Stage:</span>
          {(['all', 'new', 'contacted', 'demo_scheduled', 'proposal_sent', 'won'] as const).map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl capitalize whitespace-nowrap transition-all active:scale-95 ${
                stageFilter === stage
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {stage.replace('_', ' ')}
            </button>
          ))}
          <button
            onClick={onOpenNewLeadModal}
            className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 shrink-0 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Leads Table / Cards */}
      <div className="bg-[#0b1220]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white font-display">
            Active Lead & Deal Pipeline ({filteredLeads.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Auto-synced with Agent Pod Webhooks
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="p-4 hover:bg-white/5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5 border border-emerald-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm font-display">{lead.name}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-medium">{lead.company}</span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-emerald-400">{lead.phone}</span>
                  </div>
                  <p className="text-slate-300 mt-1">
                    Inquired: <strong className="text-white">{lead.serviceOfInterest}</strong>
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                    <span>Assigned: {lead.assignedPodName}</span>
                    <span className="text-slate-600">·</span>
                    <span>Source: {lead.source.replace('_', ' ')}</span>
                    <span className="text-slate-600">·</span>
                    <span>Notes: {lead.notes}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <span className="font-bold text-white text-sm font-mono block">
                    ₹{lead.value.toLocaleString('en-IN')}
                  </span>
                  <select
                    value={lead.stage}
                    onChange={(e) => onUpdateLeadStage(lead.id, e.target.value as LeadStage)}
                    className="mt-1 p-1.5 rounded-xl border border-white/10 text-[11px] font-semibold bg-[#050811] text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="demo_scheduled">Demo Scheduled</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="won">Closed / Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onTriggerCall(lead.phone, lead.name)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-300 transition-all shadow-md active:scale-95"
                    title="Call with Voice Agent Pod"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onTriggerWhatsApp(lead.phone, lead.name)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95"
                    title="Message on WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
