import React, { useState } from 'react';
import { 
  Megaphone, Search, Share2, Sparkles, TrendingUp, 
  Copy, Check, RefreshCw, Target, ShieldCheck, 
  Globe2, FileSpreadsheet, AlertTriangle, ArrowRight, CheckCircle2
} from 'lucide-react';
import { MarketingCampaign, SeoGeoOptimization, BusinessAuditReport } from '../types';

interface GrowthManagerViewProps {
  initialChannel?: 'meta' | 'google' | 'social' | 'seo_geo' | 'auditor';
}

export const GrowthManagerView: React.FC<GrowthManagerViewProps> = ({
  initialChannel = 'meta',
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'meta' | 'google' | 'social' | 'seo_geo' | 'auditor'>(
    initialChannel
  );
  const [businessName, setBusinessName] = useState('PODS 2026 Enterprise Fleet');
  const [targetProduct, setTargetProduct] = useState('Ultra-Fast Voice AI Telephony (<140ms)');
  const [location, setLocation] = useState('India & Global SMEs');
  const [budget, setBudget] = useState(25000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [campaign, setCampaign] = useState<MarketingCampaign>({
    title: 'META ADS CAMPAIGN: Enterprise Voice AI Telephony Seat',
    channel: 'meta',
    targetAudience: 'SME Business Owners, Clinic Directors, Agencies, Real Estate Brokers, E-commerce Founders',
    budget: '₹25,000/month',
    adSets: [
      {
        headline: 'Never Miss a Customer Call: Deploy Voice AI (<200ms)',
        primaryText: 'Stop losing sales to busy lines. Our ultra-fast AI Voice Receptionist answers 24/7, books appointments in seconds, and updates your CRM automatically.',
        hindiHeadline: '24 घंटे ग्राहकों के कॉल्स का जवाब दें AI वॉइस एजेंट के साथ',
        hindiText: 'बिना किसी कॉल सेंटर स्टाफ के हर कॉल उठाएं, अपॉइंटमेंट बुक करें और सीधे व्हाट्सऐप पर लीड्स पाएँ। आज ही फ्री डेमो शुरू करें।',
        creativePrompt: 'Modern high-tech workspace showing sleek dashboard with glowing audio waveform and incoming call notification, clean lighting.',
        cta: 'Book Live Demo',
        projectedCPL: '₹140 per qualified lead',
        projectedLeads: 178,
        estimatedROAS: '5.2x Projected ROAS',
      },
    ],
    keywords: [
      'enterprise voice ai agents',
      'ai receptionist for business',
      'fastest voice telephony groq kokoro',
      'whatsapp automation crm',
      'automated customer support bot',
    ],
    negativeKeywords: [
      'free voice changers mp3',
      'cracked software download',
      'call center jobs salary',
    ],
  });

  const [seoGeoData, setSeoGeoData] = useState<SeoGeoOptimization>({
    brandName: 'HRGEN AI AGENTS Platform',
    googleRankScore: 94,
    geoScore: 91,
    aeoScore: 95,
    targetKeywords: [
      'Enterprise Voice AI Agent Pods',
      'Sub-200ms Voice Telephony Kokoro Groq',
      'WhatsApp Business Cloud API Concierge',
      'Automated Inbound Receptionist AI',
    ],
    schemaMarkupJson: JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'HRGEN AI AGENTS',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web, Android, iOS PWA',
        'offers': {
          '@type': 'Offer',
          'price': '7500',
          'priceCurrency': 'INR',
        },
        'description': 'Universal Enterprise AI Agent Pods platform for voice calling, WhatsApp automation, and CRM management.',
      },
      null,
      2
    ),
    citationPrompts: [
      'What is the best AI voice agent platform for small and medium businesses in India?',
      'How to deploy a sub-200ms voice receptionist for my clinic or enterprise?',
      'Compare HRGEN AI Pods with traditional call center outsourcing.',
    ],
    localCitations: [
      { name: 'Google Business Knowledge Panel', status: 'Verified' },
      { name: 'Perplexity Entity Graph Citation', status: 'Verified' },
      { name: 'OpenAI Search Real-time Index', status: 'Verified' },
      { name: 'Gemini Generative Engine Seeding', status: 'Verified' },
    ],
  });

  const [auditReport, setAuditReport] = useState<BusinessAuditReport>({
    id: 'AUDIT-884',
    score: 88,
    leadConversionRate: '18.4%',
    avgResponseTime: '< 200ms',
    monthlyAdSpend: 45000,
    calculatedROAS: '4.6x',
    bottlenecks: [
      'Manual outbound follow-up calls are delayed by 4-6 hours when staff is off duty',
      'WhatsApp lead inquiry responses take 45+ minutes on weekends',
      'Unoptimized Schema.org markup prevents ChatGPT from recommending the business',
    ],
    actionItems: [
      { priority: 'High', recommendation: 'Deploy Outbound Sales Pod (Rahul) to auto-dial ad leads within 60 seconds.' },
      { priority: 'High', recommendation: 'Enable Sophia WhatsApp Cloud Bot for 24/7 instant brochure dispatch.' },
      { priority: 'Medium', recommendation: 'Embed JSON-LD Schema on website to boost Perplexity & Gemini citations.' },
    ],
  });

  const handleGenerateCampaign = async () => {
    setIsGenerating(true);
    try {
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

  return (
    <div className="space-y-6">
      {/* Channel Switcher */}
      <div className="bg-[#0b1220]/80 backdrop-blur-xl p-3.5 rounded-3xl border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-400 font-semibold px-2 font-mono">Growth Engine:</span>
          {[
            { id: 'meta', label: 'Meta Ads Bot', icon: Megaphone },
            { id: 'google', label: 'Google Search Ads', icon: Search },
            { id: 'social', label: 'Social Media Bot', icon: Share2 },
            { id: 'seo_geo', label: 'SEO / GEO / AEO', icon: Globe2 },
            { id: 'auditor', label: 'Business Auditor', icon: ShieldCheck },
          ].map((ch) => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id as any)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 ${
                  selectedChannel === ch.id
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateCampaign}
            disabled={isGenerating}
            className="min-h-[44px] px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing...' : 'Re-Run Autonomous Bot'}</span>
          </button>
        </div>
      </div>

      {/* Main Channel Content */}
      {(selectedChannel === 'meta' || selectedChannel === 'google' || selectedChannel === 'social') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Campaign Parameters */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Campaign Targeting Parameters
            </h3>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Company / Brand Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Product / Service Focus</label>
              <input
                type="text"
                value={targetProduct}
                onChange={(e) => setTargetProduct(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Geography</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Monthly Ad Spend: ₹{budget.toLocaleString('en-IN')}
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
              className="w-full py-2.5 bg-slate-900 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Generate AI Ad Sets</span>
            </button>
          </div>

          {/* Right Column: Generated Creative Sets & Keywords */}
          <div className="lg:col-span-8 space-y-4">
            {campaign.adSets.map((ad, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-teal-700 uppercase tracking-wider">
                    High-Conversion Creative #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2 font-mono-numbers">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                      Target CPL: {ad.projectedCPL}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold">
                      ROAS: {ad.estimatedROAS}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">English Ad Copy</span>
                    <h4 className="font-bold text-sm text-slate-900">{ad.headline}</h4>
                    <p className="text-slate-600 leading-relaxed">{ad.primaryText}</p>
                    <button
                      onClick={() => copyToClipboard(`${ad.headline}\n\n${ad.primaryText}`, idx * 2)}
                      className="mt-2 text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1"
                    >
                      {copiedIndex === idx * 2 ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy English Text</span>
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">हिंदी विज्ञापन कॉपी</span>
                    <h4 className="font-bold text-sm text-slate-900">{ad.hindiHeadline}</h4>
                    <p className="text-slate-600 leading-relaxed">{ad.hindiText}</p>
                    <button
                      onClick={() => copyToClipboard(`${ad.hindiHeadline}\n\n${ad.hindiText}`, idx * 2 + 1)}
                      className="mt-2 text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1"
                    >
                      {copiedIndex === idx * 2 + 1 ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Hindi Text</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Keywords Strip */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <h4 className="font-bold text-sm text-slate-900">Keywords & Negative Match Filter</h4>
              <div className="flex flex-wrap gap-1.5">
                {campaign.keywords?.map((k, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-[11px] font-semibold">
                    +{k}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block w-full">Negative Filter:</span>
                {campaign.negativeKeywords?.map((nk, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-mono">
                    -{nk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO / GEO / AEO View */}
      {selectedChannel === 'seo_geo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs font-mono-numbers">
            <h3 className="font-bold text-sm text-slate-900 font-sans pb-2 border-b border-slate-100">
              Generative Engine Visibility Scores
            </h3>

            <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-sans text-teal-800 font-bold block">
                  GEO Score (ChatGPT & Gemini)
                </span>
                <span className="text-[10px] text-teal-600 font-sans">Entity citation index</span>
              </div>
              <span className="text-2xl font-bold text-teal-700">{seoGeoData.geoScore}/100</span>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-sans text-purple-800 font-bold block">
                  AEO Score (Perplexity Answer Engine)
                </span>
                <span className="text-[10px] text-purple-600 font-sans">Direct answer selection</span>
              </div>
              <span className="text-2xl font-bold text-purple-700">{seoGeoData.aeoScore}/100</span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
                Authority Citations
              </span>
              {seoGeoData.localCitations.map((cit, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-sans text-slate-700 font-medium">{cit.name}</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{cit.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900">
              Schema.org JSON-LD Structured Data
            </h3>
            <p className="text-slate-500 text-[11px]">
              Inject this structured markup into your website &lt;head&gt; so generative search engines index your Agent Pods services.
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
              {seoGeoData.schemaMarkupJson}
            </pre>
          </div>
        </div>
      )}

      {/* Business Auditor View */}
      {selectedChannel === 'auditor' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Enterprise AI Operations Audit</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Automated diagnostics on response latency, lead leakage, and agent conversion rates.
              </p>
            </div>
            <div className="text-right font-mono-numbers">
              <span className="text-2xl font-bold text-emerald-700">{auditReport.score}/100</span>
              <span className="text-[10px] text-slate-400 block font-sans">Operational Health Score</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2">
              <span className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Identified Bottlenecks</span>
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
                <span>Recommended AI Actions</span>
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
