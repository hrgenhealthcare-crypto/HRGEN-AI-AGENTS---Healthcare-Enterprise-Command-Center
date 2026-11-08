/**
 * Test-only localhost Auth fixture + real Express Staff CRM router.
 * NEVER import into production server.ts or ship in a deployment.
 * Uses ephemeral asymmetric keys and fully synthetic users/tenants.
 */
import express from 'express';
import path from 'node:path';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createStaffCrmRouter, createSyntheticLeadStore } from '../../../security/staffRoutes';
import { makeStaffVerifier } from '../../../security/staffJwt';
import { createStaffMembershipChecker, type StaffMembership } from '../../../security/staffMembership';
import { requireInternalApiKey } from '../../../security/internalApiGuard';
import { quarantineUnverifiedWebhook } from '../../../security/quarantineWebhook';

if (process.env.CI !== 'true' || process.env.NODE_ENV === 'production') {
  throw new Error('Synthetic identity harness requires CI=true and non-production NODE_ENV');
}
const PORT = 4182;
const issuer = 'https://synthetic-idp.invalid/auth/v1';
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const roles = {
  'a-sales@synthetic.invalid': { id: '11111111-1111-4111-8111-111111111111', tenantId: A, role: 'sales' },
  'a-viewer@synthetic.invalid': { id: '33333333-3333-4333-8333-333333333333', tenantId: A, role: 'viewer' },
  'b-admin@synthetic.invalid': { id: '22222222-2222-4222-8222-222222222222', tenantId: B, role: 'admin' },
  'b-viewer@synthetic.invalid': { id: '44444444-4444-4444-8444-444444444444', tenantId: B, role: 'viewer' },
  'a-revoke-desktop@synthetic.invalid': { id:'55555555-5555-4555-8555-555555555551', tenantId:A, role:'sales' },
  'a-revoke-mobile@synthetic.invalid': { id:'55555555-5555-4555-8555-555555555552', tenantId:A, role:'sales' },
  'b-rotate-desktop@synthetic.invalid': { id:'66666666-6666-4666-8666-666666666661', tenantId:B, role:'admin' },
  'b-rotate-mobile@synthetic.invalid': { id:'66666666-6666-4666-8666-666666666662', tenantId:B, role:'admin' },
} as const;
const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
const verifier = makeStaffVerifier(createLocalJWKSet({
  keys: [{ ...jwk, alg: 'RS256', kid: 'synthetic-ci-key', use: 'sig' }],
}), issuer);
const membershipData = new Map<string, StaffMembership>(
  Object.values(roles).map(user => [user.id, { userId:user.id, tenantId:user.tenantId, role:user.role, active:true }]),
);
const currentMembership = createStaffMembershipChecker(async id => membershipData.get(id) ?? null);
const app = express();
app.use(express.json({limit: '8kb'}));
const store = createSyntheticLeadStore();
const initialDate = new Date().toISOString();
store.set('aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa', {
  id: 'aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa',
  tenantId: A, name: 'Synthetic Lab A baseline', company: 'Demo A',
  stage: 'new', createdAt: initialDate, updatedAt: initialDate,
});
store.set('bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb', {
  id: 'bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb',
  tenantId: B, name: 'Synthetic Lab B baseline', company: 'Demo B',
  stage: 'new', createdAt: initialDate, updatedAt: initialDate,
});

app.post('/__synthetic/login', async (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;
  if (password !== 'synthetic-ci-password-only' ||
      typeof email !== 'string' ||
      !(email in roles)) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid credentials' });
  }
  const user = roles[email as keyof typeof roles];
  const expiresIn = 3600;
  const now = Math.floor(Date.now() / 1000);
  const appMetadata = { tenant_id: user.tenantId, hrgen_role: user.role };
  const jwt = await new SignJWT({
    role: 'authenticated',
    app_metadata: appMetadata,
    user_metadata: { tenant_id: user.tenantId === A ? B : A, hrgen_role: 'owner' },
  })
    .setProtectedHeader({ alg:'RS256', kid:'synthetic-ci-key', typ:'JWT' })
    .setSubject(user.id).setIssuer(issuer).setAudience('authenticated')
    .setIssuedAt(now).setExpirationTime(now + expiresIn)
    .sign(privateKey);
  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    access_token:jwt, token_type:'bearer', expires_in: expiresIn,
    expires_at:now + expiresIn, refresh_token:'synthetic-not-reusable',
    user: {
      id:user.id, aud:'authenticated', role:'authenticated', email,
      app_metadata:appMetadata, user_metadata:{},
      created_at:initialDate, updated_at:initialDate,
      is_anonymous:false,
    },
  });
});
// Test-only grant controls: loopback and CI-only harness; never ship to production.
app.post('/__synthetic/membership', (req, res) => {
  if (req.get('x-synthetic-control') !== 'ci-fixture-only') return res.status(403).end();
  const email = req.body?.email;
  if (typeof email !== 'string' || !(email in roles)) return res.status(404).end();
  const fixture = roles[email as keyof typeof roles];
  const existing = membershipData.get(fixture.id)!;
  const changed: StaffMembership = {
    userId: fixture.id,
    tenantId: req.body?.tenantId === A || req.body?.tenantId === B ? req.body.tenantId : existing.tenantId,
    role: req.body?.role === 'viewer' ? 'viewer' : existing.role,
    active: req.body?.active === false ? false : req.body?.active === true ? true : existing.active,
  };
  membershipData.set(fixture.id, changed);
  return res.json({ synthetic:true, active:changed.active, role:changed.role });
});
app.use('/api/staff', createStaffCrmRouter(verifier, store, currentMembership));
app.use('/api', requireInternalApiKey);
app.use('/webhook', quarantineUnverifiedWebhook);
app.use(express.static(path.resolve(process.cwd(),'dist'), {index:false}));
app.get('*', (_req, res) => res.sendFile(path.resolve(process.cwd(),'dist/index.html')));
app.listen(PORT, '127.0.0.1', () => {
  console.log('Synthetic staff identity E2E harness on loopback only');
});
