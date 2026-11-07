import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import express from 'express';
import {
  createLocalJWKSet, exportJWK, generateKeyPair, SignJWT,
} from 'jose';
import { makeStaffVerifier } from '../security/staffJwt';
import { createStaffCrmRouter, createSyntheticLeadStore } from '../security/staffRoutes';

const issuer = 'https://synthetic-lab-auth.invalid/auth/v1';
const tenantA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const tenantB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const staffA = '11111111-1111-4111-8111-111111111111';
const staffB = '22222222-2222-4222-8222-222222222222';
const viewerId = '33333333-3333-4333-8333-333333333333';

test('verified, tenant-scoped staff CRM HTTP integration: two synthetic labs', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const { privateKey: attackerKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  const keys = createLocalJWKSet({
    keys: [{ ...jwk, kid: 'test-key-1', alg: 'RS256', use: 'sig' }],
  });
  const verifier = makeStaffVerifier(keys, issuer);
  const store = createSyntheticLeadStore();

  const app = express();
  app.use(express.json());
  app.use('/api/staff', createStaffCrmRouter(verifier, store));
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/staff`;

  const makeToken = async ({
    sub = staffA, tenantId = tenantA, role = 'sales',
    userTenant = tenantB, signingKey = privateKey, exp = '30m',
  }: {
    sub?: string; tenantId?: string | null; role?: string | null;
    userTenant?: string; signingKey?: typeof privateKey; exp?: string;
  } = {}) =>
    new SignJWT({
      app_metadata: tenantId === null ? {} : {
        tenant_id: tenantId, ...(role === null ? {} : { hrgen_role: role }),
      },
      user_metadata: { tenant_id: userTenant, hrgen_role: 'owner' },
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
      .setSubject(sub).setIssuer(issuer).setAudience('authenticated')
      .setIssuedAt().setExpirationTime(exp)
      .sign(signingKey);

  const tokenA = await makeToken();
  const tokenB = await makeToken({ sub: staffB, tenantId: tenantB, role: 'admin' });
  const tokenViewer = await makeToken({ sub: viewerId, role: 'viewer' });
  const badSignature = await makeToken({ signingKey: attackerKey });
  const appMetadataMissing = await makeToken({ tenantId: null });
  const wrongRole = await makeToken({ role: 'client' });
  const expired = await makeToken({ exp: '-5m' });

  const request = async (path: string, token?: string, method = 'GET', body?: unknown) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  };

  try {
    assert.equal((await request('/leads')).status, 401, 'Anonymous users denied');
    assert.equal((await request('/leads', badSignature)).status, 401, 'Forged signatures denied');
    assert.equal((await request('/leads', appMetadataMissing)).status, 401, 'Do not fall back to user metadata');
    assert.equal((await request('/leads', wrongRole)).status, 401, 'Client role cannot use staff API');
    assert.equal((await request('/leads', expired)).status, 401, 'Expired JWT denied');

    let result = await request('/session', tokenA);
    assert.equal(result.status, 200);
    assert.equal(result.body.tenantId, tenantA, 'Trusted claim determines identity');
    assert.equal(result.body.role, 'sales');
    assert.equal(result.headers.get('cache-control'), 'no-store');

    const leadA = await request('/leads', tokenA, 'POST',
      { name: 'Synthetic Lab A', company: 'Demo A', tenantId: tenantB });
    assert.equal(leadA.status, 201);
    assert.equal(leadA.body.lead.tenantId, tenantA, 'Client-supplied tenant never trusted');

    const leadB = await request('/leads', tokenB, 'POST',
      { name: 'Synthetic Lab B', company: 'Demo B' });
    assert.equal(leadB.status, 201);
    assert.equal(leadB.body.lead.tenantId, tenantB);
    assert.equal(store.size, 2);

    result = await request('/leads', tokenA);
    assert.equal(result.status, 200);
    assert.equal(result.body.leads.length, 1);
    assert.equal(result.body.leads[0].name, 'Synthetic Lab A');

    result = await request('/leads', tokenB);
    assert.equal(result.status, 200);
    assert.equal(result.body.leads.length, 1);
    assert.equal(result.body.leads[0].name, 'Synthetic Lab B');

    assert.equal((await request(`/leads/${leadB.body.lead.id}`, tokenA,
      'PATCH', { stage: 'won' })).status, 404, 'Cross-tenant mutation hidden');
    assert.equal(store.get(leadB.body.lead.id)?.stage, 'new', 'No mutation on denial');

    assert.equal((await request('/leads', tokenViewer, 'POST',
      { name: 'Forbidden', company: 'Demo' })).status, 403);
    assert.equal((await request(`/leads/${leadA.body.lead.id}`, tokenViewer,
      'PATCH', { stage: 'won' })).status, 403, 'Viewer read-only');
    assert.equal(store.size, 2);

    assert.equal((await request(`/leads/${leadA.body.lead.id}`, tokenA,
      'PATCH', { tenantId: tenantB })).status, 400, 'No tenant reassignment');
    assert.equal((await request(`/leads/${leadA.body.lead.id}`, tokenA,
      'PATCH', { stage: 'contacted' })).status, 200, 'Own-tenant change allowed');
    assert.equal(store.get(leadA.body.lead.id)?.stage, 'contacted');
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve()));
  }
});

test('staff API fails closed without configured verifier', async () => {
  const app = express();
  app.use('/api/staff', createStaffCrmRouter(null, createSyntheticLeadStore()));
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    const result = await fetch(`http://127.0.0.1:${address.port}/api/staff/leads`);
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('cache-control'), 'no-store');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
