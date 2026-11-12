import { CoreError, createTenantCore } from './tenantCore.mjs';
import { workspaceHtml, bookingHtml } from './tenantUI.mjs';

// Mount BEFORE any legacy /api routes and before the SPA catch-all.
export function mountTenantRoutes(app,{dir,bootstrapEmail,bootstrapPassword}) {
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
  app.get('/workspace',(_req,res)=>{res.set('Cache-Control','no-store');res.type('html').send(workspaceHtml);});
  app.get('/book/:slug',(_req,res)=>{res.set('Cache-Control','no-store');res.type('html').send(bookingHtml);});
  app.get('/api/v1/health',route(()=>({service:'hrgen-client-core',version:'1.0.0',status:'running'})));
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
  app.get('/api/v1/workspace/bookings',route((req)=>core.bookings(user(req),tenant(req))));
  app.patch('/api/v1/workspace/bookings/:id',route((req)=>core.setBookingStatus(user(req),tenant(req),req.params.id,req.body?.status)));
  app.get('/api/v1/workspace/leads',route((req)=>core.listLeads(user(req),tenant(req))));
  app.post('/api/v1/workspace/leads',route((req)=>core.addLead(user(req),tenant(req),req.body||{})));
  app.patch('/api/v1/workspace/leads/:id',route((req)=>core.setLeadStage(user(req),tenant(req),req.params.id,req.body?.stage)));
  app.get('/api/v1/workspace/audit',route((req)=>core.listAudit(user(req),tenant(req))));
  app.get('/api/v1/public/:slug',route((req)=>core.configBySlug(req.params.slug)));
  app.get('/api/v1/public/:slug/services',route((req)=>core.servicesBySlug(req.params.slug)));
  app.post('/api/v1/public/:slug/bookings',route((req)=>{limit(req,'book',12,60*60*1000);return core.book(req.params.slug,req.body||{});}));
  return core;
}
