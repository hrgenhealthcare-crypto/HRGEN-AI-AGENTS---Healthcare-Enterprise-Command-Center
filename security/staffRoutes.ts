/**
 * PRIVATE STAGING ONLY: authenticated, tenant-scoped synthetic lead workflow.
 * In-memory storage is deliberately disabled in NODE_ENV=production.
 * A persistent, RLS-tested database is required for production usage.
 */
import { randomUUID } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import type { StaffIdentity, StaffVerifier } from './staffJwt';
import type { StaffMembershipChecker } from './staffMembership';

type LeadStage = 'new' | 'contacted' | 'demo_scheduled' | 'proposal_sent' | 'won' | 'lost';
const stages = new Set<LeadStage>(['new','contacted','demo_scheduled','proposal_sent','won','lost']);
export type StaffLead = {
  id: string; tenantId: string; name: string; company: string;
  stage: LeadStage; createdAt: string; updatedAt: string;
};
export type LeadStore = Map<string, StaffLead>;
export const createSyntheticLeadStore = (): LeadStore => new Map();
type VerifiedResponse = import('express').Response<any, { staff: StaffIdentity }>;

export function createStaffCrmRouter(
  verifier: StaffVerifier | null,
  store: LeadStore,
  membershipCheck: StaffMembershipChecker | null = null,
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!verifier || !membershipCheck) {
      return res.status(503).json({ error: 'Staff access unavailable: trusted membership provider not configured' });
    }
    next();
  });

  const authenticate: RequestHandler = async (req, res, next) => {
    const authorization = req.get('authorization') || '';
    if (!/^Bearer [^\s]+$/i.test(authorization)) {
      res.status(401).json({ error: 'Unauthorized' }); return;
    }
    let staff: StaffIdentity;
    try {
      staff = await verifier!(authorization.slice(7));
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify CURRENT membership after checking signature, issuer and expiry.
    // Any role/tenant change or disablement immediately invalidates old token.
    try {
      if (!(await membershipCheck!(staff))) {
        res.status(403).json({ error: 'Staff access revoked or changed' });
        return;
      }
    } catch {
      // Fail closed: missing or failed database reads cannot use cached JWT role.
      res.status(503).json({ error: 'Staff authorization unavailable' });
      return;
    }
    (res as VerifiedResponse).locals.staff = staff;
    next();
  };
  router.use(authenticate);

  router.get('/session', (_req, res) => {
    const { userId, tenantId, role } = (res as VerifiedResponse).locals.staff;
    res.json({ userId, tenantId, role, syntheticOnly: true });
  });

  router.get('/leads', (_req, res) => {
    const { tenantId } = (res as VerifiedResponse).locals.staff;
    const leads = [...store.values()].filter((l) => l.tenantId === tenantId);
    res.json({ success: true, leads, syntheticOnly: true });
  });

  router.post('/leads', (req, res) => {
    const staff = (res as VerifiedResponse).locals.staff;
    if (staff.role === 'viewer') return res.status(403).json({ error: 'Forbidden' });
    const name = req.body?.name, company = req.body?.company;
    if (typeof name !== 'string' || !name.trim() || name.length > 140 ||
        typeof company !== 'string' || company.length > 140) {
      return res.status(400).json({ error: 'Invalid lead input' });
    }
    const now = new Date().toISOString();
    const lead: StaffLead = {
      id: randomUUID(), tenantId: staff.tenantId, name: name.trim(),
      company: company.trim(), stage: 'new', createdAt: now, updatedAt: now,
    };
    store.set(lead.id, lead);
    res.status(201).json({ success: true, lead, syntheticOnly: true });
  });

  router.patch('/leads/:id', (req, res) => {
    const staff = (res as VerifiedResponse).locals.staff;
    if (staff.role === 'viewer') return res.status(403).json({ error: 'Forbidden' });
    const lead = store.get(req.params.id);
    // An authenticated but out-of-tenant identity learns nothing about the record.
    if (!lead || lead.tenantId !== staff.tenantId) {
      return res.status(404).json({ error: 'Not found' });
    }
    const keys = Object.keys(req.body ?? {});
    if (keys.length !== 1 || keys[0] !== 'stage' || !stages.has(req.body.stage)) {
      return res.status(400).json({ error: 'Only stage changes are permitted' });
    }
    const updated: StaffLead = { ...lead, stage: req.body.stage, updatedAt: new Date().toISOString() };
    store.set(lead.id, updated);
    res.json({ success: true, lead: updated, syntheticOnly: true });
  });

  return router;
}
