import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import express from 'express';
import { mountTenantRoutes } from '../src/server/tenantRoutes.mjs';

test('AI HTTP: real owner auth, cross-tenant denial, draft review, no auto publish', async t => {
  const dir=mkdtempSync(path.join(os.tmpdir(),'hrgen-ai-http-'));
  let prompts=[];
  const app=express();app.use(express.json());
  const core=mountTenantRoutes(app,{
    dir,bootstrapEmail:'founder@hrgen.invalid',bootstrapPassword:'StrongFounderPassword!13',
    aiEnabled:true,
    generateAi:async ({prompt})=>{
      prompts.push(prompt);
      return {text:'Proposed public-business marketing draft. Verify all claims before publishing.',model:'unit-test-provider',inputTokens:90,outputTokens:60};
    }
  });
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));core.close();rmSync(dir,{recursive:true,force:true});});
  const origin=`http://127.0.0.1:${server.address().port}`;
  async function req(method,url,body,token){const res=await fetch(origin+url,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};}
  const founder=(await req('POST','/api/v1/auth/login',{email:'founder@hrgen.invalid',password:'StrongFounderPassword!13'})).data.data.token;
  const add=(slug,email)=>req('POST','/api/v1/platform/tenants',{slug,name:slug,ownerEmail:email,ownerPassword:'StrongOwnerPass!123'},founder);
  const alpha=(await add('alpha-lab','owner-a@lab.invalid')).data.data;
  const beta=(await add('beta-lab','owner-b@lab.invalid')).data.data;
  const login=email=>req('POST','/api/v1/auth/login',{email,password:'StrongOwnerPass!123'});
  const a=(await login('owner-a@lab.invalid')).data.data.token;
  const b=(await login('owner-b@lab.invalid')).data.data.token;
  assert.equal((await req('GET','/api/v1/workspace/ai/status')).status,401);
  assert.equal((await req('GET','/api/v1/workspace/ai/status?tenantId='+beta.id,undefined,a)).status,403);
  assert.equal((await req('POST','/api/v1/workspace/ai/generate',{kind:'seo_pack',brief:'English, professional'})).status,401);
  assert.equal((await req('POST','/api/v1/workspace/ai/generate',{kind:'seo_pack',brief:'Contact me at 9876543210'},a)).status,400);
  const generated=await req('POST','/api/v1/workspace/ai/generate',{kind:'seo_pack',brief:'Hindi, simple'},a);
  assert.equal(generated.status,200,JSON.stringify(generated.data));
  const id=generated.data.data.id;
  assert.equal(generated.data.data.status,'review');
  assert.equal(prompts.length,1);
  assert.ok(prompts[0].includes('alpha-lab'));
  assert.equal((await req('GET','/api/v1/workspace/ai/drafts',undefined,b)).data.data.length,0);
  assert.equal((await req('PATCH','/api/v1/workspace/ai/drafts/'+id,{status:'approved'},b)).status,409);
  const approved=await req('PATCH','/api/v1/workspace/ai/drafts/'+id,{status:'approved'},a);
  assert.equal(approved.status,200);
  assert.equal(approved.data.data.autoPublished,false);
  assert.equal((await req('GET','/api/v1/workspace/ai/status',undefined,a)).data.data.outputTokens,60);
  const staff=(await req('POST','/api/v1/platform/users',{email:'staff@alpha.invalid',password:'StrongStaffPass!123',role:'staff'},a)).data.data;
  const st=(await req('POST','/api/v1/auth/login',{email:'staff@alpha.invalid',password:'StrongStaffPass!123'})).data.data.token;
  assert.equal(st.role,'staff');
  assert.equal((await req('GET','/api/v1/workspace/ai/drafts',undefined,st)).status,403);
  assert.equal((await req('GET','/api/v1/workspace/followups',undefined,st)).status,403);
  assert.equal(alpha.slug,'alpha-lab');
});

test('AI HTTP: provider unavailable means explicit 503, no fake draft', async t=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'hrgen-ai-off-'));
 const app=express();app.use(express.json());
 const core=mountTenantRoutes(app,{dir,bootstrapEmail:'founder@hrgen.invalid',bootstrapPassword:'StrongFounderPassword!13',aiEnabled:false});
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));core.close();rmSync(dir,{recursive:true,force:true});});
 const origin=`http://127.0.0.1:${server.address().port}`;
 const res=await fetch(origin+'/api/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'founder@hrgen.invalid',password:'StrongFounderPassword!13'})});
 const {data}=await res.json();
 const created=await fetch(origin+'/api/v1/platform/tenants',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+data.token},body:JSON.stringify({slug:'closed-lab',name:'Closed Lab',ownerEmail:'owner@lab.invalid',ownerPassword:'StrongOwnerPass!123'})});
 const tenant=(await created.json()).data;
 const r=await fetch(origin+'/api/v1/workspace/ai/generate?tenantId='+tenant.id,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+data.token},body:JSON.stringify({kind:'seo_pack',brief:'Hindi, simple'})});
 assert.equal(r.status,503);
 const result=await r.json();assert.equal(result.error,'AI_NOT_CONFIGURED');
});
