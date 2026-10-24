import React, { useState } from 'react';
import {
  Megaphone,
  Search,
  Share2,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  Globe2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { MarketingCampaign, SeoGeoOptimization, BusinessAuditReport } from '../types';
import { AgentAvatar } from './AgentAvatar';

interface GrowthManagerViewProps {
  initialChannel?: 'meta' | 'google' | 'social' | 'seo_geo' | 'auditor';
}

export const GrowthManagerView: React.FC<GrowthManagerViewProps> = ({
  initialChannel = 'meta',
}) => {
  const [selectedChannel, setSelectedChannel] = useState<
    'meta' | 'google' | 'social' | 'seo_geo' | 'auditor'
  >(initialChannel);
  const [businessName, setBusinessName] = useState('HRGen Enterprise Workspace');
  const [targetProduct, setTargetProduct] = useState('Multi-Modal AI Agent Pods');
  const [location, setLocation] = useState('India & Global SMEs');
  const [budget, setBudget] = useState(25000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [campaign, setCampaign] = useState<MarketingCampaign>({
    title: 'LOCAL CAMPAIGN DRAFT: Enterprise Voice & Automation Seat',
    channel: 'meta',
    targetAudience: 'SME Business Owners, Clinic Directors, Agencies, E-commerce Founders',
    budget: '₹25,000/month (Simulated Allocation)',
    adSets: [
      {
        headline: 'Deploy AI Voice & CRM Agents in Minutes',
        primaryText:
          'Local ad copy draft: Answer inbound customer inquiries, capture leads into your CRM, and coordinate follow-ups.',
        hindiHeadline: 'अपने बिज़नेस के लिए AI वॉइस और CRM एजेंट लगाएँ',
        hindiText:
          'ग्राहकों के कॉल्स का जवाब दें, अपॉइंटमेंट नोट करें और लीड्स को अपने सीआरएम में सुरक्षित रखें।',
        creativePrompt:
          'Modern workspace showing clean dashboard with incoming call notification and structured lead pipeline.',
        cta: 'Book Live Demo',
        projectedCPL: '₹140 (Simulated Est.)',
        projectedLeads: 150,
        estimatedROAS: '4.8x (Simulated Est.)',
      },
    ],
    keywords: [
      'enterprise voice ai agents',
      'ai receptionist for business',
      'whatsapp automation crm',
      'automated customer support bot',
    ],
    negativeKeywords: ['free voice changers mp3', 'cracked software download', 'call center jobs'],
  });

  const [seoGeoData, setSeoGeoData] = useState<SeoGeoOptimization>({
    brandName: 'HRGen Enterprise Workspace',
    googleRankScore: 0,
    geoScore: 0,
    aeoScore: 0,
    targetKeywords: [
      'Enterprise Voice AI Agent Pods',
      'Multi-Modal Agentic Workspace',
      'WhatsApp Business Cloud API Concierge',
      'Automated Inbound Receptionist AI',
    ],
    schemaMarkupJson: JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'HRGen Enterprise Workspace',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, Android, iOS PWA',
        description:
          'Local Schema.org JSON-LD draft for manual site embedding. Not automatically injected into external search or AI answer engines.',
      },
      null,
      2
    ),
    citationPrompts: [
      'What features should an enterprise evaluate when choosing AI voice agents?',
      'How does structured Schema.org JSON-LD help search crawlers understand software applications?',
    ],
    localCitations: [
      { name: 'Local Schema.org JSON-LD Draft', status: 'Generated Locally (Copy to Site)' },
      { name: 'Google Search Console API', status: 'Not Connected (No OAuth Session)' },
      { name: 'Perplexity / ChatGPT Search Index', status: 'Not Connected (External Crawl Only)' },
      { name: 'Google Business Profile Graph', status: 'Not Connected (Manual Setup Required)' },
    ],
  });

  const [auditReport] = useState<BusinessAuditReport>({
    id: 'LOCAL-TEMPLATE-01',
    score: 85,
    leadConversionRate: 'Local Template',
    avgResponseTime: '< 200ms Target',
    monthlyAdSpend: 25000,
    calculatedROAS: 'Simulated',
    bottlenecks: [
      'Manual outbound follow-up calls are often delayed when staff is off duty',
      'Weekend lead inquiries require automated triage rules',
      'Missing Schema.org JSON-LD markup on public landing pages reduces structured crawler context',
    ],
    actionItems: [
      {
        priority: 'High',
        recommendation:
          'Configure Pod-02 (Vikramaditya Singh) for structured B2B lead qualification.',
      },
      {
        priority: 'High',
        recommendation:
          'Configure WhatsApp Cloud API credentials in Settings before dispatching live templates.',
      },
      {
        priority: 'Medium',
        recommendation:
          'Copy the generated Schema.org JSON-LD markup below into your website <head>.',
      },
    ],
  });

  const handleGenerateCampaign = async () => {
    setIsGenerating(true);
    try {
      if (selectedChannel === 'seo_geo') {
        const res = await fetch('/api/marketing/seo-geo-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: businessName,
            industry: targetProduct,
            location,
          }),
        });
        const data = await res.json();
        if (data.audit) {
          setSeoGeoData(data.audit);
        }
      } else {
        const res = await fetch('/api/marketing/generate-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: selectedChannel,
            businessName,
            campaignGoal: 'lead_generation',
            targetAudience: `Decision makers & SMEs interested in ${targetProduct}`,
            budget: `₹${budget.toLocaleString('en-IN')} / month`,
          }),
        });
        const data = await res.json();
        if (data.campaign) {
          setCampaign(data.campaign);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const activeSpecialistPodId = selectedChannel === 'seo_geo' ? 'pod-04' : 'pod-03';
  const activeSpecialistName =
    selectedChannel === 'seo_geo' ? 'Rohan Kapoor' : 'Priya Nair';
  const activeSpecialistRole =
    selectedChannel === 'seo_geo'
      ? 'SEO / GEO / AEO Architect (Local Schema Drafts)'
      : 'Growth & Campaign Copy Specialist (Local Sandbox)';

  return (
    <div className="space-y-6">
      {/* Specialist Header & Channel Switcher */}
      <div className="bg-[#0b1220]/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <AgentAvatar
            podId={activeSpecialistPodId}
            name={activeSpecialistName}
            role={activeSpecialistRole}
            size="md"
            status="online"
            rounded="2xl"
          />
          <div>
            <div className="font-extrabold text-white text-sm font-display">
              {activeSpecialistName}
            </div>
            <div className="text-[11px] text-slate-400">{activeSpecialistRole}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'meta', label: 'Meta Ad Drafts', icon: Megaphone },
            { id: 'google', label: 'Search Ad Drafts', icon: Search },
            { id: 'social', label: 'Social Copy', icon: Share2 },
            { id: 'seo_geo', label: 'Schema.org JSON-LD', icon: Globe2 },
            { id: 'auditor', label: 'Playbook Checklist', icon: ShieldCheck },
          ].map((ch) => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id as any)}
                className={`min-h-[38px] px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  selectedChannel === ch.id
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleGenerateCampaign}
          disabled={isGenerating}
          className="min-h-[40px] px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating Draft...' : 'Generate Local Draft'}</span>
        </button>
      </div>

      {/* Honest Provenance Banner */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Provenance Disclosure:</strong> Ad copy, budget projections, and Schema.org JSON-LD blocks below are generated locally as drafts for manual review. External ad networks (Meta/Google Ads) and search indexes (Google Search Console, ChatGPT, Perplexity) are not connected or mutated.
        </span>
      </div>

      {/* Ad Copy & Campaign Draft View */}
      {(selectedChannel === 'meta' ||
        selectedChannel === 'google' ||
        selectedChannel === 'social') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Local Draft Parameters
            </h3>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Company / Brand Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Product / Service Focus
              </label>
              <input
                type="text"
                value={targetProduct}
                onChange={(e) => setTargetProduct(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Target Geography
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Simulated Monthly Budget: ₹{budget.toLocaleString('en-IN')}
              </label>
              <input
                type="range"
                min={10000}
                max={200000}
                step={5000}
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <button
              onClick={handleGenerateCampaign}
              disabled={isGenerating}
              className="w-full py-2.5 bg-slate-900 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Generate Ad Copy Draft</span>
            </button>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {campaign.adSets.map((ad, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-teal-700 uppercase tracking-wider">
                    Draft Ad Copy Variant #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                      Est. CPL: {ad.projectedCPL}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      Simulated ROAS: {ad.estimatedROAS}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      English Ad Copy Draft
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{ad.headline}</h4>
                    <p className="text-slate-600 leading-relaxed">{ad.primaryText}</p>
                    <button
                      onClick={() =>
                        copyToClipboard(`${ad.headline}\n\n${ad.primaryText}`, idx * 2)
                      }
                      className="mt-2 text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIndex === idx * 2 ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy English Text</span>
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      हिंदी विज्ञापन ड्राफ्ट
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{ad.hindiHeadline}</h4>
                    <p className="text-slate-600 leading-relaxed">{ad.hindiText}</p>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${ad.hindiHeadline}\n\n${ad.hindiText}`,
                          idx * 2 + 1
                        )
                      }
                      className="mt-2 text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIndex === idx * 2 + 1 ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy Hindi Text</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO / GEO / AEO Local Schema Draft View (Zero Fake Search Console or Perplexity/ChatGPT Verified Claims) */}
      {selectedChannel === 'seo_geo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              External Search & Index Integration Status
            </h3>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
              <div className="font-bold text-xs">No Live External Index Connection</div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                External platforms (Google Search Console, ChatGPT Search, Perplexity) cannot be injected without verified OAuth/API credentials and domain ownership. Use the local JSON-LD generator on the right to copy structured markup into your site manually.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Integration & Provenance Status
              </span>
              {seoGeoData.localCitations.map((cit, idx) => {
                const isLocalReady = cit.status.includes('Generated Locally');
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 gap-2"
                  >
                    <span className="text-slate-800 font-semibold">{cit.name}</span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        isLocalReady
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {cit.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Local Schema.org JSON-LD Draft Artifact
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Copy and paste this JSON-LD block into your website &lt;head&gt; tag.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(seoGeoData.schemaMarkupJson, 99)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
              >
                {copiedIndex === 99 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied JSON-LD</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON-LD</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
              {seoGeoData.schemaMarkupJson}
            </pre>
          </div>
        </div>
      )}

      {/* Business Playbook Checklist View */}
      {selectedChannel === 'auditor' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Operational Readiness Playbook (Template)
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Recommended checklist for configuring voice, CRM, and WhatsApp workflows.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold">
              Static Playbook Checklist
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2">
              <span className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Common Operational Bottlenecks</span>
              </span>
              <ul className="space-y-1.5 text-rose-800">
                {auditReport.bottlenecks.map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 space-y-2">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Recommended Configuration Steps</span>
              </span>
              <ul className="space-y-1.5 text-teal-800">
                {auditReport.actionItems.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-teal-200/80 text-teal-900 text-[9px] font-bold uppercase shrink-0 mt-0.5">
                      {act.priority}
                    </span>
                    <span>{act.recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
