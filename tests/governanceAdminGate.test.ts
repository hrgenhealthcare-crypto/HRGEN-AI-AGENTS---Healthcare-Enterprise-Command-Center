import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import express from 'express';
import {adminApiGate,isValidAdminApiToken} from '../server/governance/adminApiGate';

const TEST_TOKEN='hrgen-test-token-not-a-real-secret-01234567890123456789';

test('rejects missing, weak, malformed or incorrect bearer authorization',()=>{
  assert.equal(isValidAdminApiToken(undefined,TEST_TOKEN),false);
  assert.equal(isValidAdminApiToken('Bearer '+TEST_TOKEN,'short'),false);
  assert.equal(isValidAdminApiToken('Basic '+TEST_TOKEN,TEST_TOKEN),false);
  assert.equal(isValidAdminApiToken('Bearer wrong-token-aaaaaaaaaaaaaaaaaaaaaaaaaa',TEST_TOKEN),false);
  assert.equal(isValidAdminApiToken('Bearer '+TEST_TOKEN,TEST_TOKEN),true);
});

test('all API routes fail closed without secret, then require correct bearer; no unauthorized write',async()=>{
  let writes=0;
  const app=express();
  app.use(express.json());
  app.use('/api',adminApiGate);
  app.get('/api/leads',(_,res)=>res.json({leads:[{name:'PRIVATE_TEST_FIXTURE'}]}));
  app.post('/api/settings',(_,res)=>{writes++;res.json({success:true});});
  const server=await new Promise<ReturnType<typeof app.listen>>(resolve=>{
    const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));
  });
  const addr=server.address();
  if(!addr||typeof addr==='string')throw Error('No test port');
  const base='http://127.0.0.1:'+addr.port;
  const previous=process.env.HRGEN_ADMIN_API_TOKEN;
  try{
    delete process.env.HRGEN_ADMIN_API_TOKEN;
    let response=await fetch(base+'/api/leads');
    assert.equal(response.status,503);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.doesNotMatch(JSON.stringify(await response.json()),/PRIVATE_TEST_FIXTURE/);
    process.env.HRGEN_ADMIN_API_TOKEN=TEST_TOKEN;
    response=await fetch(base+'/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fake:'payload'})});
    assert.equal(response.status,401);
    assert.equal(writes,0);
    assert.equal(response.headers.get('www-authenticate'),'Bearer realm="HRGen Private API"');
    response=await fetch(base+'/api/leads',{headers:{authorization:'Bearer invalid-invalid-invalid-invalid-invalid'}});
    assert.equal(response.status,401);
    response=await fetch(base+'/api/leads',{headers:{authorization:'Bearer '+TEST_TOKEN}});
    assert.equal(response.status,200);
    const data=await response.json() as {leads:Array<{name:string}>};
    assert.equal(data.leads[0].name,'PRIVATE_TEST_FIXTURE');
    response=await fetch(base+'/api/settings',{method:'POST',headers:{authorization:'Bearer '+TEST_TOKEN,'Content-Type':'application/json'},body:'{}'});
    assert.equal(response.status,200);
    assert.equal(writes,1);
  }finally{
    if(previous===undefined)delete process.env.HRGEN_ADMIN_API_TOKEN;else process.env.HRGEN_ADMIN_API_TOKEN=previous;
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  }
});

test('source has guard before sensitive routes and no client-side credential material',()=>{
  const server=readFileSync('server.ts','utf8');
  const app=readFileSync('src/App.tsx','utf8');
  const installer=readFileSync('src/components/PWAInstallButton.tsx','utf8');
  assert.ok(server.indexOf("app.use('/api',adminApiGate)")>=0);
  assert.ok(server.indexOf("app.use('/api',adminApiGate)")<server.indexOf("app.get('/api/settings'"));
  assert.match(server,/app\.use\('\/webhook'/);
  assert.doesNotMatch(app,/License Activated:/);
  assert.doesNotMatch(app,/Direct license activation for/);
  assert.doesNotMatch(installer,/markInstalled\(\)/);
  assert.match(app,/private-api-locked/);
  assert.doesNotMatch(app,/HRGEN_ADMIN_API_TOKEN/);
});

test('settings and exported bundle have visible locked-state UI instead of fake success',()=>{
  const settings=readFileSync('src/components/SystemSettingsDrawer.tsx','utf8');
  const installer=readFileSync('src/components/PWAInstallButton.tsx','utf8');
  assert.match(settings,/Settings were NOT saved/);
  assert.match(settings,/Voice and LLM provider readiness still needs separate tests/);
  assert.match(installer,/HTML launcher downloaded\. This is not an installed PWA or Android APK/);
  assert.match(installer,/Private agent bundle export blocked/);
});
