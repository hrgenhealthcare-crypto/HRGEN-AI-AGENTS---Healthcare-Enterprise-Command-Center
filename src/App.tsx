import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { AgentStudioView } from './components/AgentStudioView';
import { VoiceWebphone } from './components/VoiceWebphone';
import { WhatsAppSuiteView } from './components/WhatsAppSuiteView';
import { CrmManagerView } from './components/CrmManagerView';
import { GrowthManagerView } from './components/GrowthManagerView';
import { MultiLlmDashboard } from './components/MultiLlmDashboard';
import { NewLeadModal } from './components/NewLeadModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMoreSheet } from './components/MobileMoreSheet';
import { SqlSchemaModal } from './components/SqlSchemaModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AgentPod, BusinessLead, BusinessServiceOrProduct, LeadStage } from './types';
import { CheckCircle2 } from 'lucide-react';
import { depthZoomViewVariant, cinematicSpring } from './utils/motionTransitions';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'copilot' | 'crm' | 'whatsapp' | 'marketing' | 'multillm'>('dashboard');
  const [pods, setPods] = useState<AgentPod[]>([]);
  const [activePodId, setActivePodId] = useState<string>('pod-01');
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pods')
      .then((res) => res.json())
      .then((data) => {
        if (data.pods) {
          setPods(data.pods);
          if (data.pods.length > 0) setActivePodId(data.pods[0].id);
        }
      })
      .catch((err) => console.error('Failed to load agent pods:', err));

    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.leads) setLeads(data.leads);
      })
      .catch((err) => console.error('Failed to load CRM leads:', err));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreatePod = async (newPodData: Partial<AgentPod>) => {
    try {
      const res = await fetch('/api/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPodData),
      });
      const data = await res.json();
      if (data.pod) {
        setPods((prev) => [...prev, data.pod]);
        showToast(`Agent Pod "${data.pod.name}" booted & deployed successfully!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePod = async (podId: string, updates: Partial<AgentPod>) => {
    try {
      const res = await fetch(`/api/pods/${podId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.pod) {
        setPods((prev) => prev.map((p) => (p.id === podId ? data.pod : p)));
        showToast(`Agent Pod "${data.pod.name}" configuration updated.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePod = async (podId: string) => {
    try {
      await fetch(`/api/pods/${podId}`, { method: 'DELETE' });
      setPods((prev) => prev.filter((p) => p.id !== podId));
      showToast('Custom Agent Pod removed.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLead = async (leadData: Partial<BusinessLead>) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      const data = await res.json();
      if (data.lead) {
        setLeads((prev) => [data.lead, ...prev]);
        showToast(`New Lead "${data.lead.name}" (₹${data.lead.value.toLocaleString('en-IN')}) saved into CRM.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLeadStage = async (leadId: string, stage: LeadStage) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const data = await res.json();
      if (data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        showToast(`Lead stage updated to ${stage.replace('_', ' ')}.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderServiceDirect = (service: BusinessServiceOrProduct) => {
    handleCreateLead({
      name: 'Enterprise Client',
      phone: '+91 98201 00000',
      email: 'founder@enterprise.co',
      company: 'Digital Growth Enterprise',
      serviceOfInterest: service.name,
      value: service.price,
      assignedPodId: 'pod-01',
      assignedPodName: 'Dr. Ritu Verma (Inbound Reception)',
      stage: 'won',
      notes: `Direct license activation for ${service.name}. TAT: ${service.tat}.`,
      source: 'web_chat',
    });
    showToast(`License Activated: ${service.name} (₹${service.price.toLocaleString('en-IN')})!`);
  };

  const handleLaunchVoiceTest = (pod: AgentPod) => {
    setActivePodId(pod.id);
    setActiveTab('copilot');
    showToast(`Loaded "${pod.name}" into Voice Webphone. Press "Start Live Call" to speak.`);
  };

  const handleLaunchWhatsAppTest = (pod: AgentPod) => {
    setActivePodId(pod.id);
    setActiveTab('whatsapp');
    showToast(`Loaded "${pod.name}" into WhatsApp Gateway.`);
  };

  const handleTriggerVoiceCall = (phone: string, name: string) => {
    setActiveTab('copilot');
    showToast(`Loaded ${name} (${phone}) into Voice Webphone.`);
  };

  const handleTriggerWhatsApp = (phone: string, name: string) => {
    setActiveTab('whatsapp');
    showToast(`Opened WhatsApp chat for ${name} (${phone}).`);
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickCall={() => setActiveTab('copilot')}
        onOpenNewLead={() => setIsNewLeadModalOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={cinematicSpring}
            className="fixed bottom-20 md:bottom-5 right-5 z-50 bg-[#0b1220] text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-2.5 text-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />

      {/* Main Viewport with Cinematic Depth-Zoom Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={depthZoomViewVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {/* Tab 1: Central Executive Dashboard with 3D Holographic Core */}
            {activeTab === 'dashboard' && (
              <ExecutiveDashboardView
                pods={pods}
                leads={leads}
                onNavigateTab={setActiveTab}
                onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
                onOrderServiceDirect={handleOrderServiceDirect}
                onOpenSqlModal={() => setIsSqlModalOpen(true)}
              />
            )}

            {/* Tab 2: Agent Pod Studio */}
            {activeTab === 'studio' && (
              <AgentStudioView
                pods={pods}
                onLaunchVoiceTest={handleLaunchVoiceTest}
                onLaunchWhatsAppTest={handleLaunchWhatsAppTest}
                onCreatePod={handleCreatePod}
                onUpdatePod={handleUpdatePod}
                onDeletePod={handleDeletePod}
              />
            )}

            {/* Tab 3: Voice Telephony Webphone (<140ms) */}
            {activeTab === 'copilot' && (
              <VoiceWebphone
                pods={pods}
                activePodId={activePodId}
                onSelectPod={setActivePodId}
                onLeadCreated={handleCreateLead}
              />
            )}

            {/* Tab 4: 5-Tier Multi-LLM Free/Trending Fallback Stack */}
            {activeTab === 'multillm' && (
              <MultiLlmDashboard />
            )}

            {/* Tab 5: WhatsApp Business Suite */}
            {activeTab === 'whatsapp' && (
              <WhatsAppSuiteView
                leads={leads}
                onTriggerVoiceCall={handleTriggerVoiceCall}
              />
            )}

            {/* Tab 6: Universal Business CRM */}
            {activeTab === 'crm' && (
              <CrmManagerView
                leads={leads}
                onUpdateLeadStage={handleUpdateLeadStage}
                onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
                onTriggerCall={handleTriggerVoiceCall}
                onTriggerWhatsApp={handleTriggerWhatsApp}
              />
            )}

            {/* Tab 7: Growth Bots & SEO/GEO */}
            {activeTab === 'marketing' && (
              <GrowthManagerView />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* New Enterprise Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        pods={pods}
        onLeadCreated={handleCreateLead}
      />

      {/* Supabase / PostgreSQL SQL Schema Modal */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Mobile Bottom Navigation with Elevated Center Floating Dashboard Button */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMoreMenu={() => setIsMoreSheetOpen(true)}
      />

      {/* Mobile More Sheet Drawer */}
      <MobileMoreSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* Desktop Clean Footer (Zero-Pill Discipline) */}
      <footer className="hidden md:block bg-[#050811] border-t border-white/10 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-display">PODS 2026 · AUTONOMOUS AGENT CORE</span>
            <span className="text-slate-600">·</span>
            <span>Universal Multi-Channel Voice & WhatsApp Enterprise Platform</span>
          </div>
          <div className="flex items-center gap-4 font-mono-numbers">
            <span className="text-emerald-400">&lt;140ms Groq + Gemini 2.5 Flash + Kokoro TTS</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400">Progressive Web App Offline Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
