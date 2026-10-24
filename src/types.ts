export type AgentChannel = 'voice' | 'whatsapp' | 'web_chat' | 'omnichannel';

export type AgentRoleType = 
  | 'Inbound Receptionist Pod' 
  | 'Outbound Sales Closer Pod' 
  | 'WhatsApp Business Bot' 
  | 'SEO/GEO/AEO Optimizer' 
  | 'Financial Leakage Auditor Pod' 
  | 'E-Commerce Operations & Inventory Pod' 
  | 'Social Media Marketing Agent' 
  | 'Google Web Agent' 
  | 'Branding Agent' 
  | 'Graphic Designer Agent'
  | 'Inbound Receptionist'
  | 'Outbound Sales Closer'
  | 'Customer Support'
  | 'Custom Knowledge Bot';

export type IndustryType = 
  | 'Universal Business' 
  | 'Healthcare & Clinic Desk' 
  | 'Real Estate & Property' 
  | 'Agency & Digital Services' 
  | 'Retail & E-commerce' 
  | 'Gym & Wellness';

export interface PromptEvolutionLog {
  id: string;
  podId: string;
  timestamp: string;
  version: number;
  previousPrompt: string;
  evolvedPrompt: string;
  reasoning: string;
  optimizations: string[];
  performanceScore: number;
}

export interface AgentPod {
  id: string;
  name: string;
  title: string;
  role: AgentRoleType;
  channel: AgentChannel;
  avatar: string;
  voiceId: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Aoede';
  systemPrompt: string;
  greeting: string;
  brevityWordsLimit: number;
  industryFocus: IndustryType;
  status: 'Active' | 'Standby' | 'Training';
  knowledgeBaseSummary: string;
  evolutionVersion?: number;
  evolutionHistory?: PromptEvolutionLog[];
  stats: {
    interactions: number;
    satisfaction: string;
    avgDuration?: string;
    leadsCaptured: number;
  };
}

export type LeadStage = 'new' | 'contacted' | 'demo_scheduled' | 'proposal_sent' | 'won' | 'lost';

export interface BusinessLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  industry: IndustryType;
  serviceOfInterest: string;
  stage: LeadStage;
  value: number;
  assignedPodId: string;
  assignedPodName: string;
  notes: string;
  source: 'voice_agent' | 'whatsapp' | 'web_chat' | 'ad_campaign';
  createdAt: string;
  lastContact: string;
}

export interface BusinessServiceOrProduct {
  id: string;
  name: string;
  category: 'Enterprise Voice & Telephony' | 'WhatsApp Cloud Suite' | 'Digital Growth & SEO/GEO' | 'Client Care Retainer';
  type: 'saas_license' | 'voice_seat' | 'growth_package' | 'support_plan';
  price: number;
  mrp: number;
  tat: string;
  description: string;
  features: string[];
}

export interface CallMessage {
  id: string;
  role: 'agent' | 'user';
  text: string;
  timestamp: string;
  latencyMs?: number;
}

export interface CallLogItem {
  id: string;
  podId: string;
  podName: string;
  clientName: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  duration: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'interested' | 'converted';
  summary: string;
  leadCaptured: boolean;
  messages: CallMessage[];
  audioUrl?: string;
  managerHandover?: boolean;
  metrics?: {
    avgLatencyMs: number;
    totalTurns: number;
    avgWordsPerTurn: number;
  };
}

export interface WhatsAppMessage {
  id: string;
  phone: string;
  recipientName: string;
  direction: 'inbound' | 'outbound';
  body: string;
  templateName?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  attachmentType?: 'brochure_pdf' | 'payment_link' | 'calendar_invite' | 'none';
}

export interface AdCreative {
  headline: string;
  primaryText: string;
  hindiHeadline?: string;
  hindiText?: string;
  creativePrompt?: string;
  cta: string;
  projectedCPL: string;
  projectedLeads: number;
  estimatedROAS: string;
}

export interface MarketingCampaign {
  title: string;
  channel: 'meta' | 'google' | 'social';
  targetAudience: string;
  budget: string;
  adSets: AdCreative[];
  keywords?: string[];
  negativeKeywords?: string[];
  growthTips?: string[];
}

export interface SeoGeoOptimization {
  brandName: string;
  googleRankScore: number;
  geoScore: number; // Generative Engine Optimization for ChatGPT & Gemini
  aeoScore: number; // Answer Engine Optimization for Perplexity & Voice Assistants
  targetKeywords: string[];
  schemaMarkupJson: string;
  citationPrompts: string[];
  localCitations: { name: string; status: 'Verified' | 'Pending' }[];
}

export interface BusinessAuditReport {
  id: string;
  score: number;
  leadConversionRate: string;
  avgResponseTime: string;
  monthlyAdSpend: number;
  calculatedROAS: string;
  bottlenecks: string[];
  actionItems: { priority: 'High' | 'Medium'; recommendation: string }[];
}
