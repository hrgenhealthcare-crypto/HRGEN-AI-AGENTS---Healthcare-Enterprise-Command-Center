import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { createTenantCore } from '../src/server/tenantCore.mjs';

function fixture(t) {
  const dir=mkdtempSync(path.join(os.tmpdir(),'hrgen-core-'));
  let core=createTenantCore({dir,bootstrapEmail:'admin@hrgen.invalid',bootstrapPassword:'VeryStrongPassword123!'});
  t.after(()=>{core.close();rmSync(dir,{recursive:true,force:true});});
  const admin=core.session(core.login('admin@hrgen.invalid','VeryStrongPassword123!').token);
  const A=core.createTenant(admin,{slug:'alpha-lab',name:'Alpha Labs',phone:'9876543210',ownerEmail:'alpha@lab.invalid',ownerPassword:'AnotherStrongPassword!'});
  const B=core.createTenant(admin,{slug:'beta-lab',name:'Beta Labs',phone:'9876543210',ownerEmail:'beta@lab.invalid',ownerPassword:'AnotherStrongPassword!'});
  core.updateConfig(admin,A.id,{privacyUrl:'https://alpha.example/privacy',bookingEnabled:true});
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
  errCode(()=>x.core.book('beta-lab',{serviceId:svc.id,customerName:'Sample User',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true}),'BOOKING_DISABLED');
  x.core.updateConfig(x.admin,x.B.id,{privacyUrl:'https://beta.example/privacy',bookingEnabled:true});
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
  errCode(()=>x.core.listAudit(staff),'FORBIDDEN');
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

test('public booking is disabled by default and cannot be enabled without valid privacy policy', t=>{
  const x=fixture(t);
  const svc=x.core.addService(x.b,undefined,{name:'ECG',priceInr:450});
  assert.equal(x.core.configBySlug('beta-lab').bookingEnabled,0);
  assert.deepEqual(x.core.servicesBySlug('beta-lab'),[]);
  errCode(()=>x.core.updateConfig(x.b,undefined,{bookingEnabled:true}),'PRIVACY_POLICY_REQUIRED');
  errCode(()=>x.core.updateConfig(x.b,undefined,{privacyUrl:'http://beta.example/privacy'}),'INVALID_PRIVACY_URL');
  const cfg=x.core.updateConfig(x.b,undefined,{privacyUrl:'https://beta.example/privacy',bookingEnabled:true});
  assert.equal(cfg.bookingEnabled,1);
  assert.equal(x.core.servicesBySlug('beta-lab').length,1);
  const booking=x.core.book('beta-lab',{serviceId:svc.id,customerName:'Test Patient',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  assert.equal(booking.status,'new');
  assert.equal(x.core.bookings(x.b).length,1);
  x.core.updateConfig(x.b,undefined,{bookingEnabled:false});
  errCode(()=>x.core.book('beta-lab',{serviceId:svc.id,customerName:'Test Patient',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true}),'BOOKING_DISABLED');
  assert.equal(x.core.bookings(x.b).length,1);
});

test('owner-confirm-assign-collect lifecycle persists with booking audit events', t=>{
  const x=fixture(t);
  const staff=x.core.addUser(x.a,undefined,{email:'phlebo@alpha.invalid',password:'SafePassword1234!'});
  const staffToken=x.core.session(x.core.login('phlebo@alpha.invalid','SafePassword1234!').token);
  const service=x.core.addService(x.a,undefined,{name:'CBC',priceInr:310});
  const booking=x.core.book('alpha-lab',{serviceId:service.id,customerName:'Sample Patient',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  assert.equal(x.core.bookingEvents(x.a,undefined,booking.id)[0].kind,'requested');
  errCode(()=>x.core.setBookingStatus(x.a,undefined,booking.id,'collected'),'INVALID_TRANSITION');
  errCode(()=>x.core.assignBooking(x.a,undefined,booking.id,staff.id),'INVALID_TRANSITION');
  assert.equal(x.core.setBookingStatus(x.a,undefined,booking.id,'confirmed').status,'confirmed');
  assert.equal(x.core.assignBooking(x.a,undefined,booking.id,staff.id).status,'assigned');
  assert.equal(x.core.bookings(x.a)[0].assignedTo,staff.id);
  assert.equal(x.core.setBookingStatus(staffToken,undefined,booking.id,'collected').status,'collected');
  errCode(()=>x.core.setBookingStatus(x.a,undefined,booking.id,'cancelled'),'INVALID_TRANSITION');
  const kinds=x.core.bookingEvents(x.a,undefined,booking.id).map(x=>x.kind);
  assert.deepEqual(kinds,['requested','confirmed','assigned','collected']);
});

test('staff assignment requires owning client, owner permissions, and appropriate staff', t=>{
  const x=fixture(t);
  const aStaff=x.core.addUser(x.a,undefined,{email:'a.staff@alpha.invalid',password:'AnotherStrongPassword!' });
  const bStaff=x.core.addUser(x.b,undefined,{email:'b.staff@beta.invalid',password:'AnotherStrongPassword!' });
  const other=x.core.addUser(x.a,undefined,{email:'a.other@alpha.invalid',password:'AnotherStrongPassword!' });
  const one=x.core.session(x.core.login('a.staff@alpha.invalid','AnotherStrongPassword!').token);
  const two=x.core.session(x.core.login('a.other@alpha.invalid','AnotherStrongPassword!').token);
  const svc=x.core.addService(x.a,undefined,{name:'CBC',priceInr:250});
  const b=x.core.book('alpha-lab',{serviceId:svc.id,customerName:'Synthetic Contact',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  x.core.setBookingStatus(x.a,undefined,b.id,'confirmed');
  errCode(()=>x.core.assignBooking(one,undefined,b.id,aStaff.id),'FORBIDDEN');
  errCode(()=>x.core.assignBooking(x.a,undefined,b.id,bStaff.id),'STAFF_NOT_FOUND');
  errCode(()=>x.core.assignBooking(x.b,undefined,b.id,bStaff.id),'NOT_FOUND');
  assert.deepEqual(x.core.listStaff(x.a).map(s=>s.email).sort(),['a.other@alpha.invalid','a.staff@alpha.invalid']);
  errCode(()=>x.core.listStaff(one),'FORBIDDEN');
  x.core.assignBooking(x.a,undefined,b.id,aStaff.id);
  errCode(()=>x.core.setBookingStatus(two,undefined,b.id,'collected'),'FORBIDDEN');
  errCode(()=>x.core.bookingEvents(x.b,undefined,b.id),'NOT_FOUND');
  assert.equal(x.core.setBookingStatus(one,undefined,b.id,'collected').status,'collected');
});

test('branding update retains prior contact on partial updates', t=>{
  const x=fixture(t);
  assert.equal(x.core.config(x.a).phone,'9876543210');
  const cfg=x.core.updateConfig(x.a,undefined,{tagline:'Fast local services'});
  assert.equal(cfg.phone,'9876543210');
  assert.equal(cfg.privacyUrl,'https://alpha.example/privacy');
  assert.equal(cfg.bookingEnabled,1);
});


test('existing records survive previous-schema migration, booking stays disabled pending consent policy',t=>{
  const x=fixture(t);
  const svc=x.core.addService(x.a,undefined,{name:'Clinical Chemistry',priceInr:650});
  const b=x.core.book('alpha-lab',{serviceId:svc.id,customerName:'Historical User',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  x.core.close();
  const platform=new DatabaseSync(path.join(x.dir,'platform.sqlite'));
  platform.exec('ALTER TABLE tenants DROP COLUMN booking_enabled');
  platform.exec('ALTER TABLE tenants DROP COLUMN privacy_url');
  platform.close();
  const td=new DatabaseSync(path.join(x.dir,'tenants',x.A.id+'.sqlite'));
  td.exec('ALTER TABLE bookings DROP COLUMN assigned_to');
  td.exec('DROP TABLE booking_events');
  td.close();
  const migrated=createTenantCore({dir:x.dir});x.setCore(migrated);
  const a=migrated.session(migrated.login('alpha@lab.invalid','AnotherStrongPassword!').token);
  assert.equal(migrated.bookings(a)[0].id,b.id);
  assert.equal(migrated.config(a).bookingEnabled,0);
  errCode(()=>migrated.book('alpha-lab',{serviceId:svc.id,customerName:'New User',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true}),'BOOKING_DISABLED');
  migrated.updateConfig(a,undefined,{privacyUrl:'https://alpha.example/privacy',bookingEnabled:true});
  assert.equal(migrated.bookings(a).length,1);
  assert.equal(migrated.book('alpha-lab',{serviceId:svc.id,customerName:'New User',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true}).status,'new');
});

test('private client export includes real records, no password hashes, and is inaccessible to staff/other clients',t=>{
  const x=fixture(t);
  x.core.addLead(x.a,undefined,{name:'Real lead',phone:'9876543210'});
  const service=x.core.addService(x.a,undefined,{name:'CBC',priceInr:350});
  x.core.book('alpha-lab',{serviceId:service.id,customerName:'Real booking',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  const exportA=x.core.exportTenant(x.a);
  assert.equal(exportA.bookings.length,1);
  assert.equal(exportA.leads.length,1);
  assert.equal(exportA.client.slug,'alpha-lab');
  assert.equal(JSON.stringify(exportA).includes('passhash'),false);
  errCode(()=>x.core.exportTenant(x.b,x.A.id),'FORBIDDEN');
  x.core.addUser(x.a,undefined,{email:'staff.export@alpha.invalid',password:'PasswordNotForProd!' });
  const staff=x.core.session(x.core.login('staff.export@alpha.invalid','PasswordNotForProd!').token);
  errCode(()=>x.core.exportTenant(staff),'FORBIDDEN');
});

test('SQLite backups pass integrity checks and detect corrupt snapshot',async t=>{
  const x=fixture(t);
  const { spawnSync }=await import('node:child_process');
  const { writeFileSync }=await import('node:fs');
  const backupDir=path.join(os.tmpdir(),'hrgen-backup-'+Date.now()+'-'+Math.random().toString(16).slice(2));
  t.after(()=>rmSync(backupDir,{recursive:true,force:true}));
  const script=new URL('../scripts/core-backup.mjs',import.meta.url).pathname;
  const run=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  const created=run('backup',x.dir,backupDir);
  assert.equal(created.status,0,created.stderr);
  const verified=run('verify',backupDir);
  assert.equal(verified.status,0,verified.stderr);
  assert.equal(JSON.parse(verified.stdout).files,3);
  writeFileSync(path.join(backupDir,'tenant-'+x.A.id+'.sqlite'),'corrupted');
  const corrupt=run('verify',backupDir);
  assert.notEqual(corrupt.status,0);
});


test('staff booking visibility and events are limited to their assignments',t=>{
  const x=fixture(t);
  const assigned=x.core.addUser(x.a,undefined,{email:'assigned@alpha.invalid',password:'StrongStaffPassword!'});
  const other=x.core.addUser(x.a,undefined,{email:'other@alpha.invalid',password:'StrongStaffPassword!'});
  const s1=x.core.session(x.core.login('assigned@alpha.invalid','StrongStaffPassword!').token);
  const s2=x.core.session(x.core.login('other@alpha.invalid','StrongStaffPassword!').token);
  const svc=x.core.addService(x.a,undefined,{name:'CBC',priceInr:200});
  const b1=x.core.book('alpha-lab',{serviceId:svc.id,customerName:'Person 1',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  const b2=x.core.book('alpha-lab',{serviceId:svc.id,customerName:'Person 2',customerPhone:'9876543210',preferredDate:'2026-12-20',consent:true});
  errCode(()=>x.core.setBookingStatus(s1,undefined,b1.id,'confirmed'),'FORBIDDEN');
  assert.equal(x.core.bookings(s1).length,0);
  for(const b of [b1,b2])x.core.setBookingStatus(x.a,undefined,b.id,'confirmed');
  x.core.assignBooking(x.a,undefined,b1.id,assigned.id);
  x.core.assignBooking(x.a,undefined,b2.id,other.id);
  assert.deepEqual(x.core.bookings(s1).map(x=>x.id),[b1.id]);
  assert.deepEqual(x.core.bookings(s2).map(x=>x.id),[b2.id]);
  errCode(()=>x.core.bookingEvents(s1,undefined,b2.id),'FORBIDDEN');
  errCode(()=>x.core.setBookingStatus(s1,undefined,b2.id,'collected'),'FORBIDDEN');
  assert.equal(x.core.bookingEvents(s1,undefined,b1.id).length,3);
});
