import { CoreError, createTenantCore } from './tenantCore.mjs';
import { workspaceHtml, bookingHtml } from './tenantUI.mjs';
import { makeGrowthPrompt, safeProviderResult } from './aiStudio.mjs';

// Mount BEFORE any legacy /api routes and before the SPA catch-all.
/**
 * @param {import('express').Express} app
 * @param {{dir:string,bootstrapEmail?:string,bootstrapPassword?:string,aiEnabled?:boolean,generateAi?: ((args:{prompt:string,signal:AbortSignal})=>Promise<{text:string,model?:string,inputTokens?:number,outputTokens?:number}>) | null}} config
 */
export function mountTenantRoutes(app,{dir,bootstrapEmail,bootstrapPassword,generateAi=null,aiEnabled=false}) {
  const core=createTenantCore({dir,bootstrapEmail,bootstrapPassword});
  const limiters=new Map();
  const limit=(req,bucket,max,windowMs)=>{
    const key=bucket+':'+req.ip;
    const state=limiters.get(key) || {count:0,until:Date.now()+windowMs};
    if(Date.now()>state.until){state.count=0;state.until=Date.now()+windowMs;}
    state.count+=1;limiters.set(key,state);
    if(limiters.size>20000){for(const [k,v] of limiters)if(v.until<Date.now())limiters.delete(k);}
    if(state.count>max)throw new CoreError('RATE_LIMIT','Too many attempts; retry later',429);
  };
  const route=(fn)=>(req,res)=>{
    try { const data=fn(req);res.set('Cache-Control','no-store');res.json({ok:true,data}); }
    catch(e){ const known=e instanceof CoreError;res.status(known?e.status:500).json({ok:false,error:known?e.code:'INTERNAL_ERROR',message:known?e.message:'Request failed'}); }
  };
  const user=(req)=>{const m=/^Bearer (\S+)$/.exec(req.get('authorization')||'');return core.session(m?.[1]);};
  const tenant=(req)=>req.query.tenantId || undefined;
  app.get('/workspace',(_req,res)=>{res.set('Cache-Control','no-store');res.set('Referrer-Policy','no-referrer');res.set('X-Content-Type-Options','nosniff');res.type('html').send(workspaceHtml);});
  app.get('/book/:slug',(_req,res)=>{res.set('Cache-Control','no-store');res.set('Referrer-Policy','no-referrer');res.set('X-Content-Type-Options','nosniff');res.type('html').send(bookingHtml);});
  app.get('/api/v1/health',route(()=>({service:'hrgen-client-core',version:'3.0.0',status:'running'})));
  app.post('/api/v1/auth/login',route((req)=>{limit(req,'login',8,15*60*1000);return core.login(req.body?.email,req.body?.password); }));
  app.post('/api/v1/auth/logout',route((req)=>{const match=/^Bearer (\S+)$/.exec(req.get('authorization')||'');user(req);core.logout(match[1]);return {signedOut:true};}));
  app.post('/api/v1/auth/password',route((req)=>core.changePassword(user(req),req.body?.oldPassword,req.body?.newPassword)));
  app.get('/api/v1/auth/me',route((req)=>{const u=user(req);return {id:u.id,email:u.email,role:u.role,tenantId:u.tenant_id};}));
  app.get('/api/v1/platform/tenants',route((req)=>core.listTenants(user(req))));
  app.post('/api/v1/platform/tenants',route((req)=>core.createTenant(user(req),req.body||{})));
  app.post('/api/v1/platform/users',route((req)=>core.addUser(user(req),req.body?.tenantId,req.body||{})));
  app.get('/api/v1/workspace/config',route((req)=>core.config(user(req),tenant(req))));
  app.patch('/api/v1/workspace/config',route((req)=>core.updateConfig(user(req),tenant(req),req.body||{})));
  app.get('/api/v1/workspace/services',route((req)=>core.listServices(user(req),tenant(req))));
  app.post('/api/v1/workspace/services',route((req)=>core.addService(user(req),tenant(req),req.body||{})));
  app.patch('/api/v1/workspace/services/:id',route((req)=>core.setServiceActive(user(req),tenant(req),req.params.id,req.body?.active)));
  app.get('/api/v1/workspace/staff',route((req)=>core.listStaff(user(req),tenant(req))));
  app.get('/api/v1/workspace/bookings',route((req)=>core.bookings(user(req),tenant(req))));
  app.post('/api/v1/workspace/bookings/:id/assign',route((req)=>core.assignBooking(user(req),tenant(req),req.params.id,req.body?.staffId)));
  app.get('/api/v1/workspace/bookings/:id/events',route((req)=>core.bookingEvents(user(req),tenant(req),req.params.id)));
  app.patch('/api/v1/workspace/bookings/:id',route((req)=>core.setBookingStatus(user(req),tenant(req),req.params.id,req.body?.status)));
  app.get('/api/v1/workspace/leads',route((req)=>core.listLeads(user(req),tenant(req))));
  app.post('/api/v1/workspace/leads',route((req)=>core.addLead(user(req),tenant(req),req.body||{})));
  app.patch('/api/v1/workspace/leads/:id',route((req)=>core.setLeadStage(user(req),tenant(req),req.params.id,req.body?.stage)));
  app.get('/api/v1/workspace/export',route((req)=>core.exportTenant(user(req),tenant(req))));
  app.get('/api/v1/workspace/audit',route((req)=>core.listAudit(user(req),tenant(req))));
  // AI Growth Studio — no public AI endpoints, no patient or CRM data to models.
  app.get('/api/v1/workspace/ai/status',route(req=>({enabled:Boolean(aiEnabled && generateAi),...core.aiUsage(user(req),tenant(req))})));
  app.get('/api/v1/workspace/ai/drafts',route(req=>core.listAiDrafts(user(req),tenant(req))));
  app.get('/api/v1/workspace/followups',route(req=>core.leadFollowupQueue(user(req),tenant(req))));
  app.patch('/api/v1/workspace/ai/drafts/:id',route(req=>core.reviewAiDraft(user(req),tenant(req),req.params.id,req.body?.status)));
  app.post('/api/v1/workspace/ai/generate',async(req,res)=>{
    let started=null,actor=null;
    try {
      actor=user(req);
      const requested=tenant(req);
      core.aiContext(actor,requested); // auth enforced BEFORE provider checks
      if(!aiEnabled || typeof generateAi!=='function') throw new CoreError('AI_NOT_CONFIGURED','AI provider is not enabled; configure server credentials and opt in',503);
      limit(req,'ai',12,60*60*1000);
      started=core.beginAiDraft(actor,requested,req.body||{});
      const prompt=makeGrowthPrompt(started);
      // No mocked responses. Provider errors do not masquerade as successful AI.
      const timer=AbortSignal.timeout(20000);
      const result=safeProviderResult(await generateAi({prompt,signal:timer}));
      const draft=core.finishAiDraft(actor,requested,started.id,result);
      res.set('Cache-Control','no-store').json({ok:true,data:draft});
    } catch(e) {
      if(started && actor)try{core.failAiDraft(actor,started.ctx.tenantId,started.id)}catch{}
      const known=e instanceof CoreError;
      res.status(known?e.status:503).set('Cache-Control','no-store').json({ok:false,error:known?e.code:'AI_PROVIDER_ERROR',message:known?e.message:'AI provider unavailable; no draft published'});
    }
  });
  app.get('/api/v1/public/:slug',route((req)=>core.configBySlug(req.params.slug)));
  app.get('/api/v1/public/:slug/services',route((req)=>core.servicesBySlug(req.params.slug)));
  app.post('/api/v1/public/:slug/bookings',route((req)=>{limit(req,'book',12,60*60*1000);return core.book(req.params.slug,req.body||{});}));
  return core;
}
