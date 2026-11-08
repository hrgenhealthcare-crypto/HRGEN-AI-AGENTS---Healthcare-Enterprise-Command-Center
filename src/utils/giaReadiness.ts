/**
 * Evidence-only GIA readiness register.
 * These are fixed results from an offline, isolated archive review on 2026-11-08.
 * NEVER treat these records as evidence of today's PC/GIA runtime or hosted staging.
 * No patient data, access keys, or internal Drive URLs belong in this frontend.
 */
export type GiaGateState = 'OFFLINE_PASS' | 'HOLD';
export interface GiaEvidence {
  id: string;
  title: string;
  state: GiaGateState;
  scope: string;
  evidence: string;
  nextAction: string;
}
export const GIA_SNAPSHOT = {
  checkedAt: '2026-11-08',
  archivalPeriod: '2026-08',
  source: 'Drive-owned GIA-PC-v1.2 and standalone agent archives',
  archiveSha256: {
    giaPc: 'e7898c12d9786e4dbf516dfb14685e1690630c17c8bce0375e5756ba671bcfdf',
    agents: 'e017ceb1fac91eb7a701151bf8d250ac3f57f2e8f8934f2f324ed6ad7ef55110',
  },
  productionConnected: false,
  privateStagingConnected: false,
  autoProvisionAllowed: false,
} as const;
export const GIA_EVIDENCE: readonly GiaEvidence[] = [
  {
    id:'gia-archive-py',
    title:'GIA-PC v1.2 source / isolated tests',
    state:'OFFLINE_PASS',
    scope:'Historical archive only',
    evidence:'14/14 archived Python tests passed in a temporary, isolated copy.',
    nextAction:'Compare to the installed Windows PC GIA version before claiming current functionality.',
  },
  {
    id:'agents-archive',
    title:'CEO + Project Manager archive identities',
    state:'OFFLINE_PASS',
    scope:'Agent JSON configuration only',
    evidence:'12 unique agent IDs; independent CEO and PM roles; no duplicate JSON keys.',
    nextAction:'Read the current server/agents/registry.js and run real Express boot + RBAC checks.',
  },
  {
    id:'gia-runtime',
    title:'Current GIA service and Windows PC bridge',
    state:'HOLD',
    scope:'Running service not authenticated or reached',
    evidence:'No current runtime boot, source commit, session/auth protocol or PC read-only baseline.',
    nextAction:'Connect an authorized, read-only GIA runtime endpoint and capture a signed version/health snapshot.',
  },
  {
    id:'staging-provider',
    title:'Private Supabase staging / signed staff sessions',
    state:'HOLD',
    scope:'Hosted provider proof required',
    evidence:'Isolated RLS/browser CI is not live Supabase Auth/PostgREST proof.',
    nextAction:'Approve a distinct private staging project; read-only baseline and backup first, then synthetic A/B signed-JWT tests.',
  },
  {
    id:'tenant-hosted',
    title:'Ten-lab data isolation and rollback',
    state:'HOLD',
    scope:'Hosted tenant boundary unverified',
    evidence:'No independently verified hosted negative cross-tenant query, member revocation or restore checkpoint.',
    nextAction:'Run approved staging isolation, role revocation and backup-restore acceptance tests.',
  },
  {
    id:'commercial-activation',
    title:'Licenses, payments, WhatsApp and public launch',
    state:'HOLD',
    scope:'External actions require explicit approval',
    evidence:'No accepted commercial agreement, verified payment webhook, signed APK or authorized release.',
    nextAction:'Keep all external execution disabled until quote, agreement, payment and human release gates are proven.',
  },
] as const;

/** Source review never silently converts live/staging HOLD to PASSED. */
export function giaReadinessVerdict(entries: readonly GiaEvidence[]=GIA_EVIDENCE) {
  const holds=entries.filter(x=>x.state==='HOLD');
  return {
    release:'HOLD' as const,
    offlinePass:entries.filter(x=>x.state==='OFFLINE_PASS').length,
    blockerCount:holds.length,
    blockers:holds.map(x=>x.id),
    note:'No live GIA or hosted staging credentials are connected by this UI.',
  };
}
export function giaReadinessDraft() {
  const verdict=giaReadinessVerdict();
  return {
    schema:'HRGEN-GIA-READINESS-v0.1',
    status:'DRAFT_NO_LIVE_CONNECTION',
    snapshot:GIA_SNAPSHOT,
    evidence:GIA_EVIDENCE,
    verdict,
    restrictions:{
      noCredentialsInBrowser:true,
      noPatientData:true,
      noExternalWrite:true,
      noProductionDeploy:true,
    },
  };
}
