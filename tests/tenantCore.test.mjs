import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createTenantCore } from '../src/server/tenantCore.mjs';

function fixture(t) {
  const dir=mkdtempSync(path.join(os.tmpdir(),'hrgen-core-'));
  let core=createTenantCore({dir,bootstrapEmail:'admin@hrgen.invalid',bootstrapPassword:'VeryStrongPassword123!'});
  t.after(()=>{core.close();rmSync(dir,{recursive:true,force:true});});
  const admin=core.session(core.login('admin@hrgen.invalid','VeryStrongPassword123!').token);
  const A=core.createTenant(admin,{slug:'alpha-lab',name:'Alpha Labs',phone:'9876543210',ownerEmail:'alpha@lab.invalid',ownerPassword:'AnotherStrongPassword!'});
  const B=core.createTenant(admin,{slug:'beta-lab',name:'Beta Labs',phone:'9876543210',ownerEmail:'beta@lab.invalid',ownerPassword:'AnotherStrongPassword!'});
  const aToken=core.login('alpha@lab.invalid','AnotherStrongPassword!').token;
  const bToken=core.login('beta@lab.invalid','AnotherStrongPassword!').token;
  return {get core(){return core},setCore:c=>core=c,dir,admin,A,B,aToken,bToken,a:core.session(aToken),b:core.session(bToken)};
}
const errCode=(fn,code)=>assert.throws(fn,{code});

test('bootstrapping has no default admin or password',t=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'hrgen-boot-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  errCode(()=>createTenantCore({dir}),'BOOTSTRAP_REQUIRED');
});
test('different clients have physically separated services and real bookings',t=>{
  const x=fixture(t);
  const svc=x.core.addService(x.a,undefined,{name:'CBC',priceInr:350,description:'Blood count'});
  assert.equal(x.core.listServices(x.a).length,1);
  assert.equal(x.core.listServices(x.b).length,0);
  assert.equal(x.core.servicesBySlug('alpha-lab').length,1);
  assert.equal(x.core.servicesBySlug('beta-lab').length,0);
  errCode(()=>x.core.book('beta-lab',{serviceId:svc.id,customerName:'Sample User',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true}),'NOT_FOUND');
  errCode(()=>x.core.book('alpha-lab',{serviceId:svc.id,customerName:'Sample User',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:false}),'CONSENT_REQUIRED');
  const booking=x.core.book('alpha-lab',{serviceId:svc.id,customerName:'Sample User',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  assert.match(booking.reference,/^HRG-[A-F0-9]{12}$/);
  assert.equal(x.core.bookings(x.a).length,1);
  assert.equal(x.core.bookings(x.b).length,0);
  errCode(()=>x.core.setBookingStatus(x.b,undefined,booking.id,'confirmed'),'NOT_FOUND');
  assert.equal(x.core.setBookingStatus(x.a,undefined,booking.id,'confirmed').status,'confirmed');
});
test('non-founder cannot read or write other clients, even by supplying ID',t=>{
  const x=fixture(t);
  errCode(()=>x.core.listServices(x.a,x.B.id),'FORBIDDEN');
  errCode(()=>x.core.config(x.a,x.B.id),'FORBIDDEN');
  errCode(()=>x.core.updateConfig(x.a,x.B.id,{name:'Hijack'}),'FORBIDDEN');
  errCode(()=>x.core.addLead(x.a,x.B.id,{name:'Intruder',phone:'9876543210'}),'FORBIDDEN');
  errCode(()=>x.core.bookings(x.a,x.B.id),'FORBIDDEN');
  errCode(()=>x.core.listAudit(x.a,x.B.id),'FORBIDDEN');
  errCode(()=>x.core.createTenant(x.a,{slug:'third-lab'}),'FORBIDDEN');
});
test('owner can change brand without affecting booking engine or other brands',t=>{
  const x=fixture(t);
  const changed=x.core.updateConfig(x.a,undefined,{name:'Alpha Diagnostics',accent:'#ff0088',phone:'9876543210',tagline:'At home booking'});
  assert.equal(changed.name,'Alpha Diagnostics');
  assert.equal(changed.accent,'#ff0088');
  assert.equal(x.core.configBySlug('alpha-lab').name,'Alpha Diagnostics');
  assert.equal(x.core.configBySlug('beta-lab').name,'Beta Labs');
  errCode(()=>x.core.updateConfig(x.a,undefined,{accent:'red'}),'INVALID_COLOR');
  assert.equal(x.core.configBySlug('alpha-lab').accent,'#ff0088');
});
test('staff can operate bookings and leads but cannot alter catalogue or branding',t=>{
  const x=fixture(t);
  x.core.addUser(x.a,undefined,{email:'staff@lab.invalid',password:'StrongStaffPassword!'});
  const staff=x.core.session(x.core.login('staff@lab.invalid','StrongStaffPassword!').token);
  x.core.addLead(staff,undefined,{name:'Person',phone:'9876543210'});
  assert.equal(x.core.listLeads(staff).length,1);
  errCode(()=>x.core.addService(staff,undefined,{name:'CBC',priceInr:200}),'FORBIDDEN');
  errCode(()=>x.core.updateConfig(staff,undefined,{name:'Changed'}),'FORBIDDEN');
  errCode(()=>x.core.addUser(staff,undefined,{email:'bad@lab.invalid',password:'StrongPassword123!'}),'FORBIDDEN');
  assert.equal(x.core.listAudit(staff).some(r=>r.action==='lead.create'),true);
});
test('lead stages cannot leak across tenants',t=>{
  const x=fixture(t);
  const lead=x.core.addLead(x.a,undefined,{name:'Business',phone:'9876543210',company:'Company'});
  errCode(()=>x.core.setLeadStage(x.b,undefined,lead.id,'won'),'NOT_FOUND');
  assert.equal(x.core.setLeadStage(x.a,undefined,lead.id,'contacted').stage,'contacted');
  assert.equal(x.core.listLeads(x.b).length,0);
});
test('logout revokes token and invalid passwords are rejected',t=>{
  const x=fixture(t);
  errCode(()=>x.core.login('alpha@lab.invalid','wrongpassword'),'LOGIN_FAILED');
  x.core.logout(x.aToken);
  errCode(()=>x.core.session(x.aToken),'UNAUTHORIZED');
});
test('records persist across database restart',t=>{
  const x=fixture(t);
  const added=x.core.addService(x.a,undefined,{name:'Lipid Profile',priceInr:650});
  x.core.book('alpha-lab',{serviceId:added.id,customerName:'Sample User',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  x.core.close();
  const reopened=createTenantCore({dir:x.dir});x.setCore(reopened);
  const owner=reopened.session(reopened.login('alpha@lab.invalid','AnotherStrongPassword!').token);
  assert.equal(reopened.listServices(owner).length,1);
  assert.equal(reopened.bookings(owner).length,1);
  assert.equal(reopened.listServices(reopened.session(reopened.login('beta@lab.invalid','AnotherStrongPassword!').token)).length,0);
});
test('invalid contact, price, consent and status fail closed',t=>{
  const x=fixture(t);
  errCode(()=>x.core.addService(x.a,undefined,{name:'Test',priceInr:-1}),'INVALID_PRICE');
  errCode(()=>x.core.addLead(x.a,undefined,{name:'Person',phone:'000'}),'INVALID_PHONE');
  errCode(()=>x.core.setBookingStatus(x.a,undefined,'badid','released'),'INVALID_STATUS');
  errCode(()=>x.core.createTenant(x.admin,{slug:'../escape',name:'Escape',ownerEmail:'escape@test.invalid',ownerPassword:'ValidPassword123!'}),'INVALID_SLUG');
});
