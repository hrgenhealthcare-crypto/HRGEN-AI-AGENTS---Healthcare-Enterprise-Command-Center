// HRGen Reusable Client Core v1 — production data, not seed/demo data.
// Node >=22.13 required for built-in SQLite. Use persistent local disk/volume.
import { DatabaseSync } from 'node:sqlite';
import { randomUUID, randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export class CoreError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
const fail = (code, message, status = 400) => { throw new CoreError(code, message, status); };
const now = () => new Date().toISOString();
const digest = (value) => createHash('sha256').update(value).digest('hex');
const cleaned = (value, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const phone = (v) => { const p = cleaned(v, 24).replace(/^\+91[ -]?/, '').replace(/[ -]/g, ''); if (!/^[6-9][0-9]{9}$/.test(p)) fail('INVALID_PHONE', 'A valid Indian mobile number is required'); return p; };
const email = (v) => { const e = cleaned(v, 190).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail('INVALID_EMAIL', 'Valid email required'); return e; };
const required = (v, field, max = 160) => { const x = cleaned(v, max); if (!x) fail('VALIDATION', field + ' is required'); return x; };
const slugValue = (v) => { const x = cleaned(v, 64).toLowerCase(); if (!/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(x)) fail('INVALID_SLUG','Use 2-50 lowercase letters, numbers and hyphens'); return x; };
const logoValue = (v) => { const x=cleaned(v,400); if(!x)return ''; try { const u=new URL(x); if(u.protocol!=='https:' || u.username || u.password)fail('INVALID_LOGO','Logo must be an HTTPS image URL'); return u.toString(); } catch(e){ if(e instanceof CoreError)throw e; fail('INVALID_LOGO','Logo must be an HTTPS image URL'); } };
const colorValue = (v) => { const x = cleaned(v, 8); if (!/^#[0-9a-fA-F]{6}$/.test(x)) fail('INVALID_COLOR', 'Accent must be six-digit hex color'); return x.toLowerCase(); };
const hashPassword = (password) => { if (typeof password !== 'string' || password.length < 12 || password.length > 200) fail('WEAK_PASSWORD', 'Password must have 12-200 characters'); const salt=randomBytes(16).toString('hex'); return 'scrypt$'+salt+'$'+scryptSync(password,salt,64).toString('hex'); };
const verifyPassword = (password, stored) => { try { const [alg,salt,hash] = stored.split('$'); if (alg !== 'scrypt') return false; const a=scryptSync(password,salt,64), b=Buffer.from(hash,'hex'); return a.length===b.length && timingSafeEqual(a,b); } catch { return false; } };
const openDatabase = (filename) => { const db=new DatabaseSync(filename); db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;'); return db; };
const tenantSchema = `
 CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', price_inr INTEGER NOT NULL CHECK(price_inr >= 0), active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, ref TEXT UNIQUE NOT NULL, service_id TEXT NOT NULL REFERENCES services(id), customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, preferred_date TEXT NOT NULL, address TEXT NOT NULL DEFAULT '', consent_at TEXT NOT NULL, consent_version TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('new','confirmed','assigned','collected','cancelled')), created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, company TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', stage TEXT NOT NULL CHECK(stage IN ('new','contacted','proposal_sent','won','lost')), created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS booking_events (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL REFERENCES bookings(id), kind TEXT NOT NULL, actor_id TEXT, detail TEXT NOT NULL DEFAULT '', at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS ix_booking_events_booking ON booking_events(booking_id,at);
 CREATE INDEX IF NOT EXISTS ix_bookings_created ON bookings(created_at DESC);
 CREATE INDEX IF NOT EXISTS ix_leads_created ON leads(created_at DESC);
`;

export function createTenantCore({dir, bootstrapEmail, bootstrapPassword} = {}) {
  if (!dir || !path.isAbsolute(dir)) fail('STORAGE_CONFIG','HRGEN_CORE_DB_DIR must be an absolute persistent directory',500);
  mkdirSync(dir,{recursive:true,mode:0o700});
  const tenDir=path.join(dir,'tenants'); mkdirSync(tenDir,{recursive:true,mode:0o700});
  const db=openDatabase(path.join(dir,'platform.sqlite'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, accent TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', tagline TEXT NOT NULL DEFAULT '', logo_url TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), email TEXT UNIQUE NOT NULL, passhash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('super_admin','owner','staff')), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS ix_sessions_exp ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, tenant_id TEXT, actor_id TEXT, action TEXT NOT NULL, target_id TEXT NOT NULL DEFAULT '', at TEXT NOT NULL);
  `);
  const count=db.prepare('SELECT COUNT(*) AS n FROM users WHERE role=?').get('super_admin').n;
  if (!count) {
    if (!bootstrapEmail || !bootstrapPassword) fail('BOOTSTRAP_REQUIRED','Set HRGEN_BOOTSTRAP_EMAIL and HRGEN_BOOTSTRAP_PASSWORD for first launch',503);
    db.prepare('INSERT INTO users(id,tenant_id,email,passhash,role,created_at) VALUES (?,NULL,?,?,?,?)').run(randomUUID(),email(bootstrapEmail),hashPassword(bootstrapPassword),'super_admin',now());
  }
  // Safe forward migrations for existing v1 installations (do not discard client records).
  const tenantColumns=db.prepare('PRAGMA table_info(tenants)').all().map(x=>x.name);
  if (!tenantColumns.includes('privacy_url')) db.exec("ALTER TABLE tenants ADD COLUMN privacy_url TEXT NOT NULL DEFAULT ''");
  if (!tenantColumns.includes('booking_enabled')) db.exec('ALTER TABLE tenants ADD COLUMN booking_enabled INTEGER NOT NULL DEFAULT 0');
  const cache=new Map();
  function tenantDb(tenantId) {
    if (!db.prepare('SELECT id FROM tenants WHERE id=?').get(tenantId)) fail('TENANT_NOT_FOUND','Unknown client workspace',404);
    if (!cache.has(tenantId)) {
      const td=openDatabase(path.join(tenDir,tenantId+'.sqlite'));
      td.exec(tenantSchema);
      if (!td.prepare('PRAGMA table_info(bookings)').all().some(x=>x.name==='assigned_to')) {
        td.exec('ALTER TABLE bookings ADD COLUMN assigned_to TEXT');
      }
      cache.set(tenantId,td);
    }
    return cache.get(tenantId);
  }
  function audit(actor, action, targetId='',tenantId=null){db.prepare('INSERT INTO audit VALUES (?,?,?,?,?,?)').run(randomUUID(),tenantId ?? actor?.tenant_id ?? null,actor?.id??null,action,targetId,now());}
  function login(userEmail,password){
    const u=db.prepare('SELECT * FROM users WHERE email=?').get(email(userEmail));
    if (!u || !verifyPassword(password,u.passhash)) fail('LOGIN_FAILED','Invalid email or password',401);
    const token=randomBytes(32).toString('base64url');
    const expiry=Date.now()+12*60*60*1000;
    db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token),u.id,expiry);
    audit(u,'auth.login');
    return {token,expiresAt:new Date(expiry).toISOString(),user:{id:u.id,tenantId:u.tenant_id,role:u.role,email:u.email}};
  }
  function session(token){
    if (typeof token!=='string' || token.length<32 || token.length>256) fail('UNAUTHORIZED','Authentication required',401);
    const u=db.prepare('SELECT u.id,u.tenant_id,u.email,u.role,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(digest(token));
    if (!u || u.expires_at<=Date.now()) fail('UNAUTHORIZED','Session expired; sign in again',401);
    return u;
  }
  function logout(token){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));}
  function changePassword(user,oldPassword,newPassword){const row=db.prepare('SELECT passhash FROM users WHERE id=?').get(user.id);if(!row||!verifyPassword(oldPassword,row.passhash))fail('LOGIN_FAILED','Old password incorrect',401);const passhash=hashPassword(newPassword);db.prepare('UPDATE users SET passhash=? WHERE id=?').run(passhash,user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);audit(user,'auth.password_change');return {passwordChanged:true,allSessionsRevoked:true};}
  function onlySuper(user){if(user.role!=='super_admin') fail('FORBIDDEN','Founder access required',403);}
  function selectedTenant(user,requestedTenant){
    if(user.role==='super_admin') { if(!requestedTenant) fail('TENANT_REQUIRED','Select a client workspace',400); return requestedTenant; }
    if(!user.tenant_id || (requestedTenant && requestedTenant!==user.tenant_id)) fail('FORBIDDEN','Cross-client access denied',403);
    return user.tenant_id;
  }
  function onlyOwner(user){if(!['owner','super_admin'].includes(user.role)) fail('FORBIDDEN','Owner permission required',403);}
  function createTenant(actor,{slug,name,accent='#e90074',phone:contact='',tagline='',logoUrl='',ownerEmail,ownerPassword}){
    onlySuper(actor);
    const s=slugValue(slug), n=required(name,'Business name'), c=colorValue(accent), p=contact ? phone(contact):'';
    const ownerMail=email(ownerEmail), ownerHash=hashPassword(ownerPassword);
    if(db.prepare('SELECT 1 FROM tenants WHERE slug=?').get(s)) fail('DUPLICATE','Client slug already exists',409);
    if(db.prepare('SELECT 1 FROM users WHERE email=?').get(ownerMail)) fail('DUPLICATE','Owner email already exists',409);
    const tid=randomUUID(), uid=randomUUID(), created=now();
    db.exec('BEGIN IMMEDIATE');
    try{
      db.prepare('INSERT INTO tenants(id,slug,name,accent,phone,tagline,logo_url,created_at) VALUES(?,?,?,?,?,?,?,?)').run(tid,s,n,c,p,cleaned(tagline,180),logoValue(logoUrl),created);
      db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(uid,tid,ownerMail,ownerHash,'owner',created);
      tenantDb(tid);
      db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    audit(actor,'tenant.create',tid,tid);
    return {id:tid,slug:s,name:n,accent:c,phone:p,logoUrl:logoValue(logoUrl),ownerEmail:ownerMail,bookingPath:'/book/'+s};
  }
  function listTenants(actor){onlySuper(actor);return db.prepare('SELECT id,slug,name,accent,phone,tagline,logo_url AS logoUrl,privacy_url AS privacyUrl,booking_enabled AS bookingEnabled,created_at FROM tenants ORDER BY created_at DESC').all();}
  function configBySlug(slug){const t=db.prepare('SELECT id,slug,name,accent,phone,tagline,logo_url AS logoUrl,privacy_url AS privacyUrl,booking_enabled AS bookingEnabled FROM tenants WHERE slug=?').get(slugValue(slug));if(!t)fail('TENANT_NOT_FOUND','No such business',404);return t;}
  function config(user,requested){const id=selectedTenant(user,requested);const t=db.prepare('SELECT id,slug,name,accent,phone,tagline,logo_url AS logoUrl,privacy_url AS privacyUrl,booking_enabled AS bookingEnabled FROM tenants WHERE id=?').get(id);if(!t)fail('TENANT_NOT_FOUND','No such client',404);return t;}
  function safePrivacyUrl(value){
    const v=cleaned(value,700);
    if (!v) return '';
    try { const u=new URL(v); if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')) fail('INVALID_PRIVACY_URL','Use a valid public HTTPS privacy policy URL'); return u.toString(); }
    catch(e){if(e instanceof CoreError)throw e;fail('INVALID_PRIVACY_URL','Use a valid public HTTPS privacy policy URL');}
  }
  function updateConfig(user,requested,data){
    onlyOwner(user);const t=config(user,requested);
    const name=required(data.name??t.name,'Name');const accent=colorValue(data.accent??t.accent);
    const p=data.phone===undefined?t.phone:(data.phone ? phone(data.phone):'');
    const tagline=cleaned(data.tagline??t.tagline,180),logoUrl=logoValue(data.logoUrl??t.logoUrl);
    const privacyUrl=safePrivacyUrl(data.privacyUrl??t.privacyUrl);
    const bookingEnabled=data.bookingEnabled===undefined?Boolean(t.bookingEnabled):data.bookingEnabled;
    if (typeof bookingEnabled !== 'boolean') fail('INVALID_BOOKING_ENABLED','Booking enabled must be a boolean');
    if(bookingEnabled&&!privacyUrl)fail('PRIVACY_POLICY_REQUIRED','Set an approved HTTPS privacy URL before accepting bookings',409);
    db.prepare('UPDATE tenants SET name=?,accent=?,phone=?,tagline=?,logo_url=?,privacy_url=?,booking_enabled=? WHERE id=?').run(name,accent,p,tagline,logoUrl,privacyUrl,bookingEnabled?1:0,t.id);
    audit(user,'tenant.branding',t.id,t.id);return config(user,t.id);
  }
  function addUser(actor,requested,{email:userEmail,password,role='staff'}){
    onlyOwner(actor);const tid=selectedTenant(actor,requested);if(!['staff','owner'].includes(role))fail('INVALID_ROLE','Only staff or owner roles permitted');
    if(actor.role!=='super_admin' && role==='owner')fail('FORBIDDEN','Only founder can issue new owner accounts',403);
    const id=randomUUID(),e=email(userEmail),h=hashPassword(password);
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(id,tid,e,h,role,now());audit(actor,'user.create',id,tid);
    return {id,email:e,role,tenantId:tid};
  }
  function servicesBySlug(slug){const t=configBySlug(slug);if(!t.bookingEnabled)return [];return tenantDb(t.id).prepare('SELECT id,name,description,price_inr AS priceInr FROM services WHERE active=1 ORDER BY created_at DESC').all();}
  function listServices(actor,requested){const id=selectedTenant(actor,requested);return tenantDb(id).prepare('SELECT id,name,description,price_inr AS priceInr,active,created_at AS createdAt FROM services ORDER BY created_at DESC').all();}
  function addService(actor,requested,{name,description='',priceInr}){
    onlyOwner(actor);const tid=selectedTenant(actor,requested),n=required(name,'Service name');
    if(!Number.isSafeInteger(priceInr)||priceInr<0||priceInr>10000000)fail('INVALID_PRICE','Price must be integer INR amount');
    const svc={id:randomUUID(),name:n,description:cleaned(description,500),priceInr,active:1,createdAt:now()};
    tenantDb(tid).prepare('INSERT INTO services VALUES (?,?,?,?,?,?)').run(svc.id,svc.name,svc.description,svc.priceInr,1,svc.createdAt);
    audit(actor,'service.create',svc.id,tid);return svc;
  }
  function setServiceActive(actor,requested,id,active){onlyOwner(actor);const tid=selectedTenant(actor,requested);if(typeof active!=='boolean')fail('INVALID_ACTIVE','Boolean required');const res=tenantDb(tid).prepare('UPDATE services SET active=? WHERE id=?').run(active?1:0,id);if(!res.changes)fail('NOT_FOUND','Service not found',404);audit(actor,'service.status',id,tid);return {id,active};}
  function book(slug,{serviceId,customerName,customerPhone,preferredDate,address='',consent}){
    const t=configBySlug(slug);if(!t.bookingEnabled||!t.privacyUrl)fail('BOOKING_DISABLED','This business is not accepting online bookings',409);const td=tenantDb(t.id);
    const svc=td.prepare('SELECT id FROM services WHERE id=? AND active=1').get(serviceId);
    if(!svc)fail('NOT_FOUND','Service unavailable',404);
    if(consent!==true)fail('CONSENT_REQUIRED','Consent required to process booking details');
    const date=required(preferredDate,'Date',10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)fail('INVALID_DATE','Use a valid YYYY-MM-DD date');
    const todayIST=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(date<todayIST)fail('INVALID_DATE','Preferred date cannot be in the past');
    const id=randomUUID(), ref='HRG-'+randomBytes(6).toString('hex').toUpperCase(),stamp=now();
    td.prepare('INSERT INTO bookings(id,ref,service_id,customer_name,customer_phone,preferred_date,address,consent_at,consent_version,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,ref,serviceId,required(customerName,'Customer name'),phone(customerPhone),date,cleaned(address,350),stamp,'booking-consent-v1','new',stamp);
    td.prepare('INSERT INTO booking_events(id,booking_id,kind,actor_id,detail,at) VALUES(?,?,?,?,?,?)').run(randomUUID(),id,'requested',null,'Consent: booking-consent-v1; '+t.privacyUrl,stamp);
    audit(null,'booking.public_create',id,t.id);
    return {id,reference:ref,status:'new'};
  }
  function bookings(actor,requested){
    const tid=selectedTenant(actor,requested);
    const sql=`SELECT b.id,b.ref AS reference,s.name AS service,b.customer_name AS customerName,b.customer_phone AS customerPhone,b.preferred_date AS preferredDate,b.address,b.status,b.assigned_to AS assignedTo,b.created_at AS createdAt FROM bookings b JOIN services s ON s.id=b.service_id`;
    // Staff see only their own assigned appointments; owners/founder see whole client queue.
    return actor.role==='staff' ? tenantDb(tid).prepare(sql+' WHERE b.assigned_to=? ORDER BY b.created_at DESC LIMIT 200').all(actor.id) : tenantDb(tid).prepare(sql+' ORDER BY b.created_at DESC LIMIT 200').all();
  }
  // Deliberately restrict state transitions: collection requires an assigned staff member.
  const transitions={new:['confirmed','cancelled'],confirmed:['cancelled'],assigned:['collected','cancelled'],collected:[],cancelled:[]};
  function setBookingStatus(actor,requested,id,status){
    const tid=selectedTenant(actor,requested);if(!['confirmed','collected','cancelled'].includes(status))fail('INVALID_STATUS','Unsupported booking transition');
    const td=tenantDb(tid),old=td.prepare('SELECT id,status,assigned_to AS assignedTo FROM bookings WHERE id=?').get(id);
    if(!old)fail('NOT_FOUND','Booking not found',404);
    if(actor.role==='staff'&&old.assignedTo!==actor.id)fail('FORBIDDEN','Staff may update only their assigned bookings',403);
    if(!transitions[old.status]?.includes(status))fail('INVALID_TRANSITION','Booking status transition is not allowed',409);
    if(old.status==='assigned'&&actor.role==='staff'&&old.assignedTo!==actor.id)fail('FORBIDDEN','Only assigned staff may complete or cancel this booking',403);
    const result=td.prepare('UPDATE bookings SET status=? WHERE id=? AND status=?').run(status,id,old.status);
    if(!result.changes)fail('CONFLICT','Booking changed; reload',409);
    td.prepare('INSERT INTO booking_events VALUES(?,?,?,?,?,?)').run(randomUUID(),id,status,actor.id,'',now());
    audit(actor,'booking.status',id,tid);return {id,status};
  }
  function listStaff(actor,requested){
    onlyOwner(actor);const tid=selectedTenant(actor,requested);
    return db.prepare("SELECT id,email,role FROM users WHERE tenant_id=? AND role='staff' ORDER BY email").all(tid);
  }
  function assignBooking(actor,requested,bookingId,staffId){
    onlyOwner(actor);const tid=selectedTenant(actor,requested),td=tenantDb(tid);
    const staff=db.prepare("SELECT id FROM users WHERE id=? AND tenant_id=? AND role='staff'").get(staffId,tid);
    if(!staff)fail('STAFF_NOT_FOUND','Select staff from this client',404);
    const booking=td.prepare('SELECT status FROM bookings WHERE id=?').get(bookingId);
    if(!booking)fail('NOT_FOUND','Booking not found',404);
    if(booking.status!=='confirmed')fail('INVALID_TRANSITION','Confirm request before assigning staff',409);
    const result=td.prepare("UPDATE bookings SET assigned_to=?,status='assigned' WHERE id=? AND status='confirmed'").run(staffId,bookingId);
    if(!result.changes)fail('CONFLICT','Booking changed; reload',409);
    td.prepare('INSERT INTO booking_events VALUES(?,?,?,?,?,?)').run(randomUUID(),bookingId,'assigned',actor.id,staffId,now());
    audit(actor,'booking.assigned',bookingId,tid);return {id:bookingId,status:'assigned',assignedTo:staffId};
  }
  function bookingEvents(actor,requested,bookingId){
    const tid=selectedTenant(actor,requested),td=tenantDb(tid);
    const booking=td.prepare('SELECT id FROM bookings WHERE id=?').get(bookingId);
    if(!booking)fail('NOT_FOUND','Booking not found',404);
    if(actor.role==='staff'&&!td.prepare('SELECT id FROM bookings WHERE id=? AND assigned_to=?').get(bookingId,actor.id))fail('FORBIDDEN','Staff may view only assigned booking events',403);
    return td.prepare('SELECT kind,actor_id AS actorId,at FROM booking_events WHERE booking_id=? ORDER BY at,id').all(bookingId);
  }
  function listLeads(actor,requested){const tid=selectedTenant(actor,requested);return tenantDb(tid).prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 200').all();}
  function addLead(actor,requested,{name,phone:mobile,company='',note=''}){const tid=selectedTenant(actor,requested);const lead={id:randomUUID(),name:required(name,'Lead name'),phone:phone(mobile),company:cleaned(company,150),note:cleaned(note,600),stage:'new',created_at:now()};tenantDb(tid).prepare('INSERT INTO leads VALUES (?,?,?,?,?,?,?)').run(lead.id,lead.name,lead.phone,lead.company,lead.note,lead.stage,lead.created_at);audit(actor,'lead.create',lead.id,tid);return lead;}
  function setLeadStage(actor,requested,id,stage){if(!['new','contacted','proposal_sent','won','lost'].includes(stage))fail('INVALID_STAGE','Unsupported lead stage');const tid=selectedTenant(actor,requested);const res=tenantDb(tid).prepare('UPDATE leads SET stage=? WHERE id=?').run(stage,id);if(!res.changes)fail('NOT_FOUND','Lead not found',404);audit(actor,'lead.stage',id,tid);return {id,stage};}
  function exportTenant(actor,requested){
    onlyOwner(actor);const tid=selectedTenant(actor,requested),td=tenantDb(tid);
    const snapshot={
      format:'hrgen-client-export-v1',createdAt:now(),
      client:config(actor,tid),
      services:td.prepare('SELECT * FROM services ORDER BY created_at').all(),
      bookings:td.prepare('SELECT * FROM bookings ORDER BY created_at').all(),
      bookingEvents:td.prepare('SELECT * FROM booking_events ORDER BY at').all(),
      leads:td.prepare('SELECT * FROM leads ORDER BY created_at').all(),
      staff:listStaff(actor,tid),
      audit:db.prepare('SELECT * FROM audit WHERE tenant_id=? ORDER BY at').all(tid)
    };
    audit(actor,'tenant.export',tid,tid);
    return snapshot;
  }
  function listAudit(actor,requested){onlyOwner(actor);const tid=selectedTenant(actor,requested);return db.prepare('SELECT action,target_id AS targetId,at FROM audit WHERE tenant_id=? ORDER BY at DESC LIMIT 100').all(tid);}
  function close(){for(const t of cache.values())t.close();db.close();}
  return {login,session,logout,changePassword,createTenant,listTenants,configBySlug,config,updateConfig,addUser,listStaff,servicesBySlug,listServices,addService,setServiceActive,book,bookings,setBookingStatus,assignBooking,bookingEvents,listLeads,addLead,setLeadStage,listAudit,exportTenant,close};
}
