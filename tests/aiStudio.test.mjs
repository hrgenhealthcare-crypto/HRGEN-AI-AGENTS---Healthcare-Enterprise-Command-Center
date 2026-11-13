import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTenantCore } from '../src/server/tenantCore.mjs';
import { makeGrowthPrompt, makeGeminiGenerator, safeProviderResult } from '../src/server/aiStudio.mjs';
import { Script } from 'node:vm';
import { workspaceHtml, bookingHtml } from '../src/server/tenantUI.mjs';

function setup(t){
 const dir=mkdtempSync(path.join(os.tmpdir(),'hrgen-ai-unit-'));
 let c=createTenantCore({dir,bootstrapEmail:'founder@hrgen.invalid',bootstrapPassword:'SuperSafeFounderPassword12!'});
 t.after(()=>{c.close();rmSync(dir,{recursive:true,force:true});});
 const founder=c.session(c.login('founder@hrgen.invalid','SuperSafeFounderPassword12!').token);
 const A=c.createTenant(founder,{slug:'alpha-lab',name:'Alpha Labs',ownerEmail:'owner-a@lab.invalid',ownerPassword:'SuperSafeOwnerPassword12!'});
 const B=c.createTenant(founder,{slug:'beta-lab',name:'Beta Labs',ownerEmail:'owner-b@lab.invalid',ownerPassword:'SuperSafeOwnerPassword12!'});
 const a=c.session(c.login('owner-a@lab.invalid','SuperSafeOwnerPassword12!').token);
 const b=c.session(c.login('owner-b@lab.invalid','SuperSafeOwnerPassword12!').token);
 return {c,founder,A,B,a,b,dir};
}

test('AI prompt uses public business name + active services only, no stored leads or bookings',t=>{
 const x=setup(t);
 x.c.addService(x.a,undefined,{name:'CBC',priceInr:390});
 x.c.addLead(x.a,undefined,{name:'Private Patient',phone:'9876543210',company:'Private Lab'});
 const ctx=x.c.aiContext(x.a);
 const prompt=makeGrowthPrompt({kind:'social_post',brief:'Hindi, professional',ctx});
 assert.match(prompt,/Alpha Labs/);assert.match(prompt,/CBC/);
 assert.doesNotMatch(prompt,/9876543210|Private Patient|Private Lab/);
 assert.throws(()=>x.c.beginAiDraft(x.a,undefined,{kind:'social_post',brief:'Call 9876543210'}),{code:'AI_PRIVACY_BLOCK'});
});

test('AI drafts remain tenant-scoped with owner approval and no automatic send',t=>{
 const x=setup(t);
 const d=x.c.beginAiDraft(x.a,undefined,{kind:'seo_pack',brief:'Hindi, simple'});
 const saved=x.c.finishAiDraft(x.a,undefined,d.id,{text:'Local laboratory service information draft; verify all details with owner.',model:'fake-test',inputTokens:85,outputTokens:100});
 assert.equal(saved.status,'review');
 assert.equal(x.c.listAiDrafts(x.b).length,0);
 assert.throws(()=>x.c.reviewAiDraft(x.b,undefined,d.id,'approved'),{code:'AI_REVIEW_FAILED'});
 const approved=x.c.reviewAiDraft(x.a,undefined,d.id,'approved');
 assert.deepEqual(approved,{id:d.id,status:'approved',autoPublished:false});
 assert.equal(x.c.aiUsage(x.a).inputTokens,85);
 assert.equal(x.c.aiUsage(x.b).used,0);
 assert.throws(()=>x.c.reviewAiDraft(x.a,undefined,d.id,'approved'),{code:'AI_REVIEW_FAILED'});
});

test('AI quota, failed provider and staff privileges fail closed',t=>{
 const x=setup(t);
 const s=x.c.addUser(x.a,undefined,{email:'staff-a@lab.invalid',password:'StrongStaffPassword12!'});
 const staff=x.c.session(x.c.login('staff-a@lab.invalid','StrongStaffPassword12!').token);
 assert.equal(s.role,'staff');
 assert.throws(()=>x.c.aiUsage(staff),{code:'FORBIDDEN'});
 assert.throws(()=>x.c.beginAiDraft(staff,undefined,{kind:'seo_pack',brief:'English, professional'}),{code:'FORBIDDEN'});
 for(let i=0;i<10;i++){
   const d=x.c.beginAiDraft(x.a,undefined,{kind:'seo_pack',brief:'English, professional'});
   x.c.failAiDraft(x.a,undefined,d.id);
 }
 assert.equal(x.c.aiUsage(x.a).remaining,0);
 assert.throws(()=>x.c.beginAiDraft(x.a,undefined,{kind:'seo_pack',brief:'English, professional'}),{code:'AI_DAILY_LIMIT'});
});

test('real Gemini HTTP request adapter records usage from actual provider-shaped response',async()=>{
 let seen;
 const generate=makeGeminiGenerator({apiKey:'unit-test-key',model:'gemini-2.5-flash',fetchImpl:async(url,opt)=>{
   seen={url,opt};return {ok:true,json:async()=>({modelVersion:'gemini-2.5-flash',candidates:[{content:{parts:[{text:'Marketing content must be approved by the client owner.'}]}}],usageMetadata:{promptTokenCount:102,candidatesTokenCount:13}})};
 }});
 const r=await generate({prompt:'Public business information',signal:AbortSignal.timeout(2000)});
 assert.equal(r.inputTokens,102);assert.equal(r.outputTokens,13);
 assert.match(seen.url,/generativelanguage.googleapis.com/);
 assert.equal(seen.opt.headers['x-goog-api-key'],'unit-test-key');
 assert.ok(!seen.url.includes('unit-test-key'));
 assert.equal(JSON.parse(seen.opt.body).contents[0].parts[0].text,'Public business information');
 assert.equal(safeProviderResult(r).model,'gemini-2.5-flash');
});

test('provider failure is not simulated as AI success',async()=>{
 assert.throws(()=>makeGeminiGenerator({}),/not configured/);
 const generate=makeGeminiGenerator({apiKey:'unit-test-key',fetchImpl:async()=>({ok:false,status:429})});
 await assert.rejects(generate({prompt:'Only business data'}),/AI_PROVIDER_HTTP_429/);
 assert.throws(()=>safeProviderResult({text:''}),/no usable text/);
});


test('workspace and booking browser scripts parse, AI controls exist',()=>{
  for(const page of [workspaceHtml,bookingHtml]){
    const match=page.match(/<script>([\s\S]*?)<\/script>/i);
    assert.ok(match,'inline application script exists');
    assert.doesNotThrow(()=>new Script(match[1]));
  }
  assert.match(workspaceHtml,/AI Growth Studio/);
  assert.match(workspaceHtml,/aiGenerateBtn/);
  assert.match(workspaceHtml,/loadAi/);
});
