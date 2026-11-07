import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import express from 'express';
import { requireInternalApiKey } from '../security/internalApiGuard';
import { quarantineUnverifiedWebhook } from '../security/quarantineWebhook';

const secret = 'Synthetic-backend-only-secret-0123456789-ABCDEFG';
const previous = process.env.HRGEN_INTERNAL_API_TOKEN;

test('source topology: staff JWT mounted before global API quarantine; all legacy API routes after guard', () => {
  const source = readFileSync('server.ts', 'utf8');
  const staffIndex = source.indexOf("app.use('/api/staff', createStaffCrmRouter");
  const guardIndex = source.indexOf("app.use('/api', requireInternalApiKey);");
  const webhookIndex = source.indexOf("app.use('/webhook', quarantineUnverifiedWebhook);");
  const firstApiRoute = source.indexOf("app.get('/api/calls'");
  assert.ok(staffIndex > 0 && guardIndex > staffIndex, 'Signed staff router must precede legacy gate');
  assert.ok(firstApiRoute > guardIndex, 'All legacy API routes must be after API quarantine');
  assert.ok(webhookIndex > guardIndex, 'External callbacks must be quarantined');
  const routeDeclarations = [...source.matchAll(/app\.(?:get|post|patch|put|delete)\(\s*['"`]\/api\//g)];
  assert.ok(routeDeclarations.length >= 30, 'Guard applies to current legacy API inventory');
  for (const match of routeDeclarations) {
    assert.ok(match.index! > guardIndex, 'A legacy endpoint cannot precede guard');
  }
});

test('anonymous and invalid-key HTTP requests to sensitive routes cannot read or mutate state', async () => {
  let state = 0;
  const app = express();
  app.use(express.json());
  app.use('/api', requireInternalApiKey);
  app.get('/api/settings', (_req, res) => res.json({ setting: 'private' }));
  app.put('/api/settings', (_req, res) => { state++; res.json({ ok: true }); });
  app.get('/api/export/bundle', (_req, res) => res.json({ agents: ['private'] }));
  app.get('/api/pods', (_req, res) => res.json({ privatePrompt: 'private' }));
  app.post('/api/agent/train', (_req, res) => { state++; res.json({ ok: true }); });
  app.get('/api/analytics/realtime', (_req, res) => res.json({ confidential: true }));
  app.post('/api/marketing/generate-campaign', (_req, res) => { state++; res.json({ ok: true }); });

  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  assert.ok(addr && typeof addr !== 'string');
  const origin = `http://127.0.0.1:${addr.port}`;
  const attempts: Array<[string,string]> = [
    ['GET', '/api/settings'],
    ['PUT', '/api/settings'],
    ['GET', '/api/export/bundle'],
    ['GET', '/api/pods'],
    ['POST', '/api/agent/train'],
    ['GET', '/api/analytics/realtime'],
    ['POST', '/api/marketing/generate-campaign'],
  ];
  const request = async (method:string,path:string,key?:string) => fetch(origin + path, {
    method, headers: { ...(key ? { 'x-hrgen-internal-key': key } : {}) },
  });

  try {
    delete process.env.HRGEN_INTERNAL_API_TOKEN;
    for (const [method,path] of attempts) {
      const r = await request(method,path);
      assert.equal(r.status,503, `${method} ${path} must fail when server secret absent`);
      assert.equal(r.headers.get('cache-control'),'no-store');
    }
    process.env.HRGEN_INTERNAL_API_TOKEN = secret;
    for (const [method,path] of attempts) {
      assert.equal((await request(method,path)).status,401,`anonymous ${method} ${path}`);
      assert.equal((await request(method,path,'wrong')).status,401,`wrong key ${method} ${path}`);
    }
    assert.equal(state,0,'No denied mutations');
    const success = await request('GET','/api/settings',secret);
    assert.equal(success.status,200,'Valid server-to-server key only');
  } finally {
    if (previous === undefined) delete process.env.HRGEN_INTERNAL_API_TOKEN;
    else process.env.HRGEN_INTERNAL_API_TOKEN=previous;
    await new Promise<void>((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  }
});

test('unsigned external webhooks are quarantined even with an API key', async () => {
  const app = express();
  app.use('/webhook', quarantineUnverifiedWebhook);
  app.post('/webhook/sip/incoming', (_req,res)=>res.json({ shouldNotRun: true }));
  const server = createServer(app);
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const addr=server.address();
  assert.ok(addr && typeof addr !== 'string');
  try {
    const r=await fetch(`http://127.0.0.1:${addr.port}/webhook/sip/incoming`,{
      method:'POST',headers:{'x-hrgen-internal-key':secret},
    });
    assert.equal(r.status,503);
    assert.equal(r.headers.get('cache-control'),'no-store');
    assert.deepEqual(await r.json(),{error:'Webhook integration not released'});
  } finally {
    await new Promise<void>((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  }
});
