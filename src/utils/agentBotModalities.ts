export type AgentModalityType =
  | 'VOICE_WEBPHONE'
  | 'SWAN_CLI_ADS'
  | 'SEO_GEO_AEO_BROWSER'
  | 'SWARM_TUI_LOGISTICS'
  | 'FINANCE_CLI_LEDGER'
  | 'HR_BROWSER_ATS'
  | 'DEVOPS_CLI_DIAGNOSTICS'
  | 'WHATSAPP_CRM_BOT'
  | 'SWARM_MASTER_LUCAS';

export interface BotPresetTask {
  id: string;
  label: string;
  cliCommand: string;
  targetPlatform: string;
  expectedOutcome: string;
}

export interface AgentModalityProfile {
  podId: string;
  modality: AgentModalityType;
  badgeLabel: string;
  shortLabel: string;
  engineName: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  accentColor: string;
  platforms: string[];
  browserTargetUrl: string;
  defaultCliPrompt: string;
  presetTasks: BotPresetTask[];
}

export const AGENT_MODALITY_MAP: Record<string, AgentModalityProfile> = {
  'pod-01': {
    podId: 'pod-01',
    modality: 'VOICE_WEBPHONE',
    badgeLabel: 'VOICE WEBPHONE + HUD',
    shortLabel: 'Live Voice Agent',
    engineName: 'WebRTC + Gemini Live Audio',
    primaryButtonText: 'Launch Voice Call',
    secondaryButtonText: 'Bot CLI Console',
    accentColor: 'emerald',
    platforms: ['WebRTC SIP', 'Inbound Desk', 'WhatsApp Voice'],
    browserTargetUrl: 'local://voice-gateway/inbound-queue',
    defaultCliPrompt: 'hrgen-voice --pod=pod-01 --inspect-queue --dry-run',
    presetTasks: [
      {
        id: 'v-1',
        label: 'Inspect Inbound Voice Queue',
        cliCommand: 'hrgen-voice --pod=pod-01 --check-sip-status --dry-run',
        targetPlatform: 'Local Voice SIP Router',
        expectedOutcome: 'Verifies local WebRTC session state & call log store',
      },
      {
        id: 'v-2',
        label: 'Run Self-Test Audit (Dry-Run)',
        cliCommand: 'audit-self-test --dry-run --nonce=HRGEN7429 --no-network',
        targetPlatform: 'Internal Read-Only Self-Test',
        expectedOutcome: 'Executes deterministic read-only self-test with nonce verification',
      },
    ],
  },
  'pod-02': {
    podId: 'pod-02',
    modality: 'VOICE_WEBPHONE',
    badgeLabel: 'B2B CLOSER + LUCAS OPT',
    shortLabel: 'Voice + Deal Closer',
    engineName: 'Outbound Voice + Lucas Deal Optimizer',
    primaryButtonText: 'Call B2B Lead',
    secondaryButtonText: 'Deal CLI Bot',
    accentColor: 'indigo',
    platforms: ['Outbound SIP', 'CRM Pipeline', 'LinkedIn Sequence'],
    browserTargetUrl: 'local://crm-pipeline/b2b-enterprise-deals',
    defaultCliPrompt: 'lucas-opt --pod=pod-02 --score-pipeline --dry-run',
    presetTasks: [
      {
        id: 'b2b-1',
        label: 'Score Local CRM Pipeline Leads',
        cliCommand: 'lucas-opt --pod=pod-02 --score-pipeline --dry-run',
        targetPlatform: 'In-Memory CRM Store',
        expectedOutcome: 'Computes deterministic deal qualification score from persisted leads',
      },
      {
        id: 'b2b-2',
        label: 'Generate Proposal Draft Artifact',
        cliCommand: 'swan-cli --pod=pod-02 --draft-proposal --format=markdown',
        targetPlatform: 'Local Proposal Generator',
        expectedOutcome: 'Generates local B2B proposal template without external network mutation',
      },
    ],
  },
  'pod-03': {
    podId: 'pod-03',
    modality: 'SWAN_CLI_ADS',
    badgeLabel: 'META / GOOGLE / INSTA ADS BOT',
    shortLabel: 'Ads & Lucas Optimizer',
    engineName: 'Swan CLI v4.2 + Lucas ROAS Optimizer',
    primaryButtonText: 'Launch Ads Bot CLI',
    secondaryButtonText: 'Voice Briefing',
    accentColor: 'rose',
    platforms: ['Ad Copy Generator', 'UTM Builder', 'Budget Simulator'],
    browserTargetUrl: 'local://ads-simulator/campaign-drafts',
    defaultCliPrompt: 'lucas-opt --campaign="Q4_Growth_Draft" --simulate-roas --dry-run',
    presetTasks: [
      {
        id: 'ads-1',
        label: 'Simulate Campaign Budget Allocation',
        cliCommand: 'lucas-opt --campaign="Q4_Growth_Draft" --simulate-roas --dry-run',
        targetPlatform: 'Local Lucas Budget Simulator',
        expectedOutcome: 'Calculates projected CPA/ROAS allocation locally (Not connected to live Meta/Google API)',
      },
      {
        id: 'ads-2',
        label: 'Generate Ad Creative Copy Variants',
        cliCommand: 'swan-cli --generate-ad-copy --channels=meta,search --dry-run',
        targetPlatform: 'Local Creative Draft Store',
        expectedOutcome: 'Builds structured ad headlines & UTM tags for manual review',
      },
      {
        id: 'ads-3',
        label: 'Run Read-Only Audit Self-Test',
        cliCommand: 'audit-self-test --dry-run --nonce=HRGEN7429 --no-network',
        targetPlatform: 'Internal Read-Only Self-Test',
        expectedOutcome: 'Verifies local state with zero network calls',
      },
    ],
  },
  'pod-04': {
    podId: 'pod-04',
    modality: 'SEO_GEO_AEO_BROWSER',
    badgeLabel: 'SEO / GEO / AEO ARCHITECT BOT',
    shortLabel: 'SEO/GEO/AEO Bot',
    engineName: 'Local Schema.org & Sitemap Generator',
    primaryButtonText: 'Open SEO/AEO Bot',
    secondaryButtonText: 'Voice Briefing',
    accentColor: 'cyan',
    platforms: ['Schema.org JSON-LD', 'Robots.txt Validator', 'FAQ Structure'],
    browserTargetUrl: 'local://seo-inspector/schema-draft',
    defaultCliPrompt: 'swan-cli --pod=pod-04 --generate-jsonld --type=Organization --dry-run',
    presetTasks: [
      {
        id: 'seo-1',
        label: 'Generate Local Schema.org JSON-LD Draft',
        cliCommand: 'swan-cli --pod=pod-04 --generate-jsonld --type=Organization --dry-run',
        targetPlatform: 'Local JSON-LD Artifact Generator',
        expectedOutcome: 'Produces copy-ready Schema.org JSON-LD markup for manual site embedding (No external search index injection)',
      },
      {
        id: 'seo-2',
        label: 'Validate Local Robots & Sitemap Rules',
        cliCommand: 'swan-cli --pod=pod-04 --validate-robots --dry-run --no-network',
        targetPlatform: 'Local Static Rule Linter',
        expectedOutcome: 'Checks robots.txt directives for standard search & AI crawlers locally',
      },
      {
        id: 'seo-3',
        label: 'Run Read-Only Audit Self-Test',
        cliCommand: 'audit-self-test --dry-run --nonce=HRGEN7429 --no-network',
        targetPlatform: 'Internal Read-Only Self-Test',
        expectedOutcome: 'Verifies internal state and echoes nonce with zero network access',
      },
    ],
  },
  'pod-05': {
    podId: 'pod-05',
    modality: 'SWARM_TUI_LOGISTICS',
    badgeLabel: 'SWARM TUI LOGISTICS BOT',
    shortLabel: 'Swarm TUI Dispatch',
    engineName: 'Swarm TUI Cluster + Route Simulator',
    primaryButtonText: 'Open Swarm TUI',
    secondaryButtonText: 'Voice Dispatch',
    accentColor: 'amber',
    platforms: ['Route Simulator', 'NDR Triage Rule Engine', 'Pin-Code Check'],
    browserTargetUrl: 'local://logistics-simulator/ndr-queue',
    defaultCliPrompt: 'swan-tui --cluster=logistics --simulate-ndr --dry-run',
    presetTasks: [
      {
        id: 'log-1',
        label: 'Simulate NDR Triage Rules',
        cliCommand: 'swan-tui --cluster=logistics --simulate-ndr --dry-run',
        targetPlatform: 'Local NDR Rule Simulator',
        expectedOutcome: 'Evaluates local delivery retry rules without external courier API calls',
      },
      {
        id: 'log-2',
        label: 'Run Read-Only Audit Self-Test',
        cliCommand: 'audit-self-test --dry-run --nonce=HRGEN7429 --no-network',
        targetPlatform: 'Internal Read-Only Self-Test',
        expectedOutcome: 'Executes read-only self-test with nonce verification',
      },
    ],
  },
  'pod-06': {
    podId: 'pod-06',
    modality: 'FINANCE_CLI_LEDGER',
    badgeLabel: 'FINANCE & LEDGER CLI BOT',
    shortLabel: 'Ledger & Invoice Bot',
    engineName: 'Swan Ledger CLI + AR Ageing Calculator',
    primaryButtonText: 'Launch Ledger CLI',
    secondaryButtonText: 'Voice Reminder',
    accentColor: 'purple',
    platforms: ['AR Ageing Calculator', 'Invoice Reminder Draft', 'GST Validator'],
    browserTargetUrl: 'local://finance-ledger/ar-ageing-preview',
    defaultCliPrompt: 'swan-cli --ledger=ar-ageing --bucket=15-30d --dry-run',
    presetTasks: [
      {
        id: 'fin-1',
        label: 'Compute Local AR Ageing Summary',
        cliCommand: 'swan-cli --ledger=ar-ageing --bucket=15-30d --dry-run',
        targetPlatform: 'Local Ledger Calculator',
        expectedOutcome: 'Computes overdue invoice ageing buckets from local records',
      },
      {
        id: 'fin-2',
        label: 'Draft Payment Reminder Template',
        cliCommand: 'swan-cli --draft-payment-reminder --format=text --dry-run',
        targetPlatform: 'Local Template Generator',
        expectedOutcome: 'Generates courteous payment reminder copy without sending external messages',
      },
    ],
  },
  'pod-07': {
    podId: 'pod-07',
    modality: 'HR_BROWSER_ATS',
    badgeLabel: 'BROWSER ATS + TALENT BOT',
    shortLabel: 'Browser ATS Bot',
    engineName: 'Local Candidate Rubric Evaluator',
    primaryButtonText: 'Open ATS Console',
    secondaryButtonText: 'Voice Screen',
    accentColor: 'pink',
    platforms: ['Rubric Scorer', 'Interview Slot Draft', 'JD Parser'],
    browserTargetUrl: 'local://talent-ats/rubric-scorer',
    defaultCliPrompt: 'swan-browser --ats-score --role="Senior_Frontend_Lead" --dry-run',
    presetTasks: [
      {
        id: 'hr-1',
        label: 'Evaluate Sample Candidate Rubric',
        cliCommand: 'swan-browser --ats-score --role="Senior_Frontend_Lead" --dry-run',
        targetPlatform: 'Local ATS Rubric Scorer',
        expectedOutcome: 'Scores candidate skills against local role rubric',
      },
      {
        id: 'hr-2',
        label: 'Generate Interview Question Bank',
        cliCommand: 'swan-cli --generate-interview-rubric --level=L5 --dry-run',
        targetPlatform: 'Local HR Question Generator',
        expectedOutcome: 'Produces structured technical screening prompts locally',
      },
    ],
  },
  'pod-08': {
    podId: 'pod-08',
    modality: 'DEVOPS_CLI_DIAGNOSTICS',
    badgeLabel: 'L2 DEVOPS CLI + TRIAGE BOT',
    shortLabel: 'DevOps CLI Bot',
    engineName: 'Swan Diagnostics CLI + Local Health Inspector',
    primaryButtonText: 'Open DevOps CLI',
    secondaryButtonText: 'Voice Escalation',
    accentColor: 'blue',
    platforms: ['Local API Health', 'Memory Store Check', 'Hermes Config Audit'],
    browserTargetUrl: 'local://devops-inspector/runtime-health',
    defaultCliPrompt: 'audit-self-test --dry-run --nonce=HRGEN7429 --no-network',
    presetTasks: [
      {
        id: 'dev-1',
        label: 'Run Read-Only Self-Test with Nonce',
        cliCommand: 'audit-self-test --dry-run --nonce=HRGEN7429 --no-network',
        targetPlatform: 'Internal Runtime Self-Test',
        expectedOutcome: 'Audits local server state and echoes nonce with zero network access',
      },
      {
        id: 'dev-2',
        label: 'Inspect In-Memory Store Counts',
        cliCommand: 'swan-cli --inspect-stores --read-only --no-network',
        targetPlatform: 'Local Express Memory Store',
        expectedOutcome: 'Reports live counts of pods, CRM leads, call logs, and RAG memories',
      },
    ],
  },
  'pod-09': {
    podId: 'pod-09',
    modality: 'WHATSAPP_CRM_BOT',
    badgeLabel: 'VIP RETENTION & CRM BOT',
    shortLabel: 'Retention Bot',
    engineName: 'Local Churn Risk Scorer + Retention Playbook',
    primaryButtonText: 'Open Retention Bot',
    secondaryButtonText: 'VIP Voice Call',
    accentColor: 'teal',
    platforms: ['Churn Risk Rubric', 'VIP Playbook Draft', 'NPS Analyzer'],
    browserTargetUrl: 'local://retention-crm/cohort-analysis',
    defaultCliPrompt: 'hrgen-wa-bot --cohort=vip-enterprise --score-churn --dry-run',
    presetTasks: [
      {
        id: 'ret-1',
        label: 'Calculate Local Cohort Churn Risk',
        cliCommand: 'hrgen-wa-bot --cohort=vip-enterprise --score-churn --dry-run',
        targetPlatform: 'Local Retention Scorer',
        expectedOutcome: 'Evaluates account health indicators from local CRM store',
      },
      {
        id: 'ret-2',
        label: 'Draft VIP Renewal Playbook',
        cliCommand: 'lucas-opt --pod=pod-09 --draft-renewal-offer --dry-run',
        targetPlatform: 'Local Playbook Generator',
        expectedOutcome: 'Creates structured renewal talking points for account managers',
      },
    ],
  },
  'pod-10': {
    podId: 'pod-10',
    modality: 'SWARM_MASTER_LUCAS',
    badgeLabel: 'SWARM MASTER + LUCAS CORE',
    shortLabel: 'Swarm Master CLI',
    engineName: 'Aryan Swarm Orchestrator + Hermes State Inspector',
    primaryButtonText: 'Open Swarm Master',
    secondaryButtonText: 'Voice Command',
    accentColor: 'violet',
    platforms: ['Swarm State Inspector', 'Hermes Version Check', 'RAG Store Audit'],
    browserTargetUrl: 'local://swarm-orchestrator/cluster-topology',
    defaultCliPrompt: 'audit-self-test --dry-run --nonce=HRGEN7429 --no-network',
    presetTasks: [
      {
        id: 'sw-1',
        label: 'Execute Read-Only Audit Self-Test',
        cliCommand: 'audit-self-test --dry-run --nonce=HRGEN7429 --no-network',
        targetPlatform: 'Internal Read-Only Self-Test',
        expectedOutcome: 'Verifies all 10 pods, Hermes versions, and RAG stores without network calls',
      },
      {
        id: 'sw-2',
        label: 'Inspect Hermes Version History',
        cliCommand: 'swan-tui --swarm=all-10-pods --inspect-hermes --dry-run',
        targetPlatform: 'Local Hermes Config Store',
        expectedOutcome: 'Lists active Hermes version and rollback history across pods',
      },
    ],
  },
};

export function getAgentModality(podId: string): AgentModalityProfile {
  return AGENT_MODALITY_MAP[podId] || AGENT_MODALITY_MAP['pod-01'];
}


export interface AgentBotDescriptorCompat {
  podId: string;
  modality: 'voice_pod' | 'whatsapp_bot' | 'ads_meta_google' | 'seo_geo_aeo' | 'browser_bot' | 'swarm_cli';
  badgeLabel: string;
  actionLabel: string;
  shortEngineTag: string;
  accentColor: string;
  cliCommand: string;
  defaultTaskPrompt: string;
  browserTargetUrl: string;
  presetTasks: BotPresetTask[];
}

export function getAgentBotDescriptor(pod: { id: string } | string): AgentBotDescriptorCompat {
  const id = typeof pod === 'string' ? pod : pod?.id || 'pod-01';
  const prof = getAgentModality(id);
  const modalityMap: Record<AgentModalityType, AgentBotDescriptorCompat['modality']> = {
    VOICE_WEBPHONE: 'voice_pod',
    SWAN_CLI_ADS: 'ads_meta_google',
    SEO_GEO_AEO_BROWSER: 'seo_geo_aeo',
    SWARM_TUI_LOGISTICS: 'swarm_cli',
    FINANCE_CLI_LEDGER: 'swarm_cli',
    HR_BROWSER_ATS: 'browser_bot',
    DEVOPS_CLI_DIAGNOSTICS: 'swarm_cli',
    WHATSAPP_CRM_BOT: 'whatsapp_bot',
    SWARM_MASTER_LUCAS: 'swarm_cli',
  };
  const colorHexMap: Record<string, string> = {
    emerald: '#10b981',
    indigo: '#6366f1',
    rose: '#f43f5e',
    cyan: '#06b6d4',
    amber: '#f59e0b',
    purple: '#a855f7',
    pink: '#ec4899',
    blue: '#3b82f6',
    teal: '#14b8a6',
    violet: '#8b5cf6',
  };
  return {
    podId: id,
    modality: modalityMap[prof.modality] || 'voice_pod',
    badgeLabel: prof.badgeLabel,
    actionLabel: prof.primaryButtonText,
    shortEngineTag: prof.shortLabel,
    accentColor: colorHexMap[prof.accentColor] || '#10b981',
    cliCommand: prof.defaultCliPrompt,
    defaultTaskPrompt: prof.defaultCliPrompt,
    browserTargetUrl: prof.browserTargetUrl,
    presetTasks: prof.presetTasks || [],
  };
}
