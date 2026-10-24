import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, X, CheckCircle2, ShieldCheck, Zap, 
  PhoneCall, MessageSquare, Globe2, ArrowRight
} from 'lucide-react';
import { BusinessServiceOrProduct } from '../types';
import { modalBackdropVariants } from '../utils/motionTransitions';

interface ProductPricingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderService: (service: BusinessServiceOrProduct) => void;
}

export const ProductPricingDrawer: React.FC<ProductPricingDrawerProps> = ({
  isOpen,
  onClose,
  onOrderService,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'voice' | 'whatsapp' | 'growth'>('all');

  const enterpriseServices: BusinessServiceOrProduct[] = [
    {
      id: 'SERV-01',
      name: 'Ultra-Fast Autonomous Voice Telephony Seat (<140ms)',
      category: 'Enterprise Voice & Telephony',
      type: 'voice_seat',
      price: 7500,
      mrp: 15000,
      tat: 'Instant Activation',
      description: 'Ultra-low latency conversational voice agent on Groq STT + Gemini Flash 2.5 + Kokoro TTS with hold chime audio transfer and manager alert.',
      features: ['<140ms Voice Processing Latency', '15-20 Words Strict Brevity Limit', 'Hold Chime Audio Transfer', 'Manager Handover Alert Card', 'Full Webphone & SIP Bench'],
    },
    {
      id: 'SERV-02',
      name: 'WhatsApp Business Cloud API Suite & Automation',
      category: 'WhatsApp Cloud Suite',
      type: 'saas_license',
      price: 4999,
      mrp: 9000,
      tat: 'Instant Setup',
      description: 'Official WhatsApp Business Cloud API with 2-way AI concierge, auto-brochure dispatch, and instant UPI/Card checkout link generation.',
      features: ['Official Meta Cloud API Verified', 'Two-Way AI Triage Bot', 'Instant UPI & Card Checkout Links', '1-Tap Escalate to Live Call', 'Zero Infrastructure Overhead'],
    },
    {
      id: 'SERV-03',
      name: 'AEO / GEO (Generative Engine Optimization) Pack',
      category: 'Digital Growth & SEO/GEO',
      type: 'growth_package',
      price: 14999,
      mrp: 28000,
      tat: '48h Deployment',
      description: 'Deploys structured JSON-LD Schema entities to rank your enterprise as the #1 recommended solution on ChatGPT, Gemini, Perplexity, and Apple Intelligence.',
      features: ['Schema.org JSON-LD Entities', 'Perplexity Answer Citation', 'Google Local Map Pack Boost', 'FAQ Search Knowledge Graph'],
    },
    {
      id: 'SERV-04',
      name: 'Meta Ads & Google Search Ads Autonomous Retainer',
      category: 'Digital Growth & SEO/GEO',
      type: 'growth_package',
      price: 11999,
      mrp: 22000,
      tat: '24h Launch',
      description: 'Autonomous ad generation and negative keyword curation across Meta Ads and Google Search with bilingual copy and instant call triggers.',
      features: ['Bilingual Ad Creatives (Hindi & English)', 'Negative Keyword Defense', 'Instant Voice Lead Dial', 'Live ROAS Tracking'],
    },
    {
      id: 'SERV-05',
      name: 'Custom Dedicated Agent Fine-Tuning & SIP Trunk',
      category: 'Enterprise Voice & Telephony',
      type: 'voice_seat',
      price: 24999,
      mrp: 45000,
      tat: '72h Turnaround',
      description: 'Private fine-tuned agent trained on your proprietary sales playbooks, objection matrices, and custom company pricing sheets.',
      features: ['Proprietary Company Fine-Tuning', 'Dedicated Voice Clone (Kore/Zephyr)', 'Private SIP Trunk DID Routing', 'Self-Evolution Engine'],
    },
    {
      id: 'SERV-06',
      name: '24/7 Multi-Tenant Client Support Pod Retainer',
      category: 'Client Care Retainer',
      type: 'support_plan',
      price: 8999,
      mrp: 18000,
      tat: 'Instant Boot',
      description: 'Automated 24/7 omnichannel customer care resolving tickets, shipment queries, and scheduling meetings with CRM synchronization.',
      features: ['Automated Ticket Resolution', 'Omnichannel Voice & WhatsApp', 'Live CRM Pipeline Integration', '99.5% First-Turn Accuracy'],
    },
  ];

  const filteredServices = enterpriseServices.filter((item) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'voice') return item.category.includes('Voice');
    if (categoryFilter === 'whatsapp') return item.category.includes('WhatsApp');
    if (categoryFilter === 'growth') return item.category.includes('Growth');
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Slide-Over Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-lg bg-[#080d1a] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl text-slate-100 overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-semibold">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>HRGEN COMMERCIAL SOFTWARE LICENSES</span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1 font-display">
                      Pricing & Commercial Retainers
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Commercial license activation catalog for enterprise voice seats, WhatsApp pipelines, and AEO growth engines.
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl text-xs">
                  {[
                    { id: 'all', label: 'All Packages' },
                    { id: 'voice', label: 'Voice Seats' },
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'growth', label: 'AEO Growth' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCategoryFilter(tab.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-colors text-center ${
                        categoryFilter === tab.id
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Package Cards List */}
                <div className="space-y-4">
                  {filteredServices.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-[#050811] border border-white/10 hover:border-emerald-500/40 transition-colors space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">
                            {prod.category}
                          </span>
                          <h3 className="font-bold text-sm text-white font-display mt-0.5">
                            {prod.name}
                          </h3>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-white/5 px-2 py-0.5 rounded">
                          {prod.tat}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {prod.description}
                      </p>

                      <div className="space-y-1.5 pt-1">
                        {prod.features.slice(0, 3).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300 font-sans">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 line-through mr-1 font-mono">
                            ₹{prod.mrp.toLocaleString('en-IN')}
                          </span>
                          <span className="text-base font-extrabold text-emerald-400 font-mono-numbers">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            onOrderService(prod);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all"
                        >
                          <span>Activate License</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drawer Footer Notice */}
              <div className="pt-6 border-t border-white/10 text-center">
                <span className="text-[11px] text-slate-400 font-sans">
                  Direct license activation connects with hrgen enterprise billing & CRM.
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
