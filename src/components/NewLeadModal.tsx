import React, { useState } from 'react';
import { BusinessLead, AgentPod } from '../types';
import { X, CheckCircle2, Building2 } from 'lucide-react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pods: AgentPod[];
  onLeadCreated: (lead: Partial<BusinessLead>) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  pods,
  onLeadCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [serviceOfInterest, setServiceOfInterest] = useState('Enterprise Voice AI Telephony Seat (<140ms)');
  const [value, setValue] = useState(45000);
  const [assignedPodId, setAssignedPodId] = useState(pods[0]?.id || 'pod-01');
  const [notes, setNotes] = useState('New prospective client registered into CRM.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const assignedPod = pods.find((p) => p.id === assignedPodId);

    setIsSubmitting(true);
    onLeadCreated({
      name,
      phone,
      email,
      company: company || 'Private Enterprise',
      serviceOfInterest,
      value,
      assignedPodId,
      assignedPodName: assignedPod?.name || 'Inbound Reception Pod',
      stage: 'new',
      notes,
      source: 'web_chat',
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0b1220] rounded-3xl p-6 shadow-2xl border border-white/10 text-xs text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white font-display">Add New Enterprise Lead</h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Contact Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Anand Mahindra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Company / Business</label>
              <input
                type="text"
                placeholder="e.g. Apex Tech Solutions"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Email Address</label>
              <input
                type="email"
                placeholder="client@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">Service / Solution of Interest</label>
            <input
              type="text"
              required
              value={serviceOfInterest}
              onChange={(e) => setServiceOfInterest(e.target.value)}
              className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Estimated Deal Value (₹)</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Assigned Agent Pod</label>
              <select
                value={assignedPodId}
                onChange={(e) => setAssignedPodId(e.target.value)}
                className="w-full min-h-[44px] p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {pods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">Initial Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-white/10 bg-[#050811] text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-semibold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Save to CRM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
