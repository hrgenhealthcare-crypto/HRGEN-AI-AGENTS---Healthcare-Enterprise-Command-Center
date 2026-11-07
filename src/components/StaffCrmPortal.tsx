import React, { useState } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { ShieldCheck, LockKeyhole, LogOut, RefreshCw } from 'lucide-react';

type LeadStage = 'new' | 'contacted' | 'demo_scheduled' | 'proposal_sent' | 'won' | 'lost';
type SyntheticLead = {
  id: string; tenantId: string; name: string; company: string;
  stage: LeadStage; createdAt: string; updatedAt: string;
};
type Identity = { userId: string; tenantId: string; role: 'owner' | 'admin' | 'sales' | 'viewer'; syntheticOnly: true };
const projectUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const identityProvider: SupabaseClient | null =
  projectUrl && anonKey && /^https:\/\//i.test(projectUrl)
    ? createClient(projectUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;
const stageValues: LeadStage[] =
  ['new', 'contacted', 'demo_scheduled', 'proposal_sent', 'won', 'lost'];

export const StaffCrmPortal: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [leads, setLeads] = useState<SyntheticLead[]>([]);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');

  const api = async (path: string, token: string, method = 'GET', body?: unknown) => {
    const response = await fetch('/api/staff' + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(
      response.status === 503 ? 'Private CRM is not enabled on this server.' :
      response.status === 401 ? 'Session expired or invalid.' :
      response.status === 403 ? 'This staff role cannot perform that action.' :
      'Request unavailable; check access or input.'
    );
    return data;
  };

  const refresh = async (token: string) => {
    const result = await api('/leads', token);
    setLeads(Array.isArray(result.leads) ? result.leads : []);
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!identityProvider || working) return;
    setWorking(true); setNotice('');
    try {
      const { data, error } = await identityProvider.auth.signInWithPassword({ email, password });
      setPassword('');
      if (error || !data.session) throw new Error('Credentials or identity provider not accepted.');
      const verified: Identity = await api('/session', data.session.access_token);
      await refresh(data.session.access_token);
      setIdentity(verified);
      setSession(data.session);
    } catch (error) {
      await identityProvider.auth.signOut().catch(() => undefined);
      setSession(null); setIdentity(null); setLeads([]);
      setNotice(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setWorking(false);
    }
  };

  const logout = async () => {
    setSession(null); setIdentity(null); setLeads([]);
    await identityProvider?.auth.signOut().catch(() => undefined);
    setNotice('Signed out. No browser session is persisted.');
  };

  const createLead = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session || !identity || identity.role === 'viewer' || working) return;
    setWorking(true); setNotice('');
    try {
      await api('/leads', session.access_token, 'POST', { name, company });
      await refresh(session.access_token);
      setName(''); setCompany('');
      setNotice('Synthetic lead recorded in isolated staging memory.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to create lead.'); }
    finally { setWorking(false); }
  };

  const setStage = async (id: string, stage: LeadStage) => {
    if (!session || identity?.role === 'viewer' || working) return;
    setWorking(true); setNotice('');
    try {
      await api('/leads/' + encodeURIComponent(id), session.access_token, 'PATCH', { stage });
      await refresh(session.access_token);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to update lead.'); }
    finally { setWorking(false); }
  };

  const inputClass = 'w-full rounded-xl border border-fuchsia-500/20 bg-slate-950 px-3 py-3 text-sm text-white focus:border-fuchsia-400 focus:outline-none';
  const buttonClass = 'rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50';

  return (
    <section className="max-w-5xl mx-auto p-4 sm:p-7 space-y-5 text-white">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] text-fuchsia-400 uppercase">HRGen Enterprise OS / Private</p>
          <h2 className="text-2xl font-bold mt-2 flex items-center gap-2"><ShieldCheck size={24}/> Staff CRM</h2>
          <p className="text-xs text-slate-400 mt-2">Identity-checked staging workflow. Synthetic records only; no real client data or paid revenue.</p>
        </div>
        {session && <button onClick={logout} className="px-4 py-2 rounded-xl border border-white/20 flex gap-2 items-center text-sm"><LogOut size={15}/> Sign out</button>}
      </div>
      {notice && <p role="status" className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/20 p-3 text-sm">{notice}</p>}
      {!identityProvider ? (
        <div className="rounded-2xl border border-amber-400/30 bg-slate-950 p-6 space-y-3">
          <LockKeyhole className="text-amber-300"/>
          <h3 className="font-semibold">Staff identity provider not connected</h3>
          <p className="text-sm text-slate-400">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY only for a private staging build. Configure server SUPABASE_URL independently, provision staff app_metadata. Do not use production client records.</p>
        </div>
      ) : !session || !identity ? (
        <form onSubmit={login} className="rounded-2xl border border-fuchsia-500/20 bg-slate-950/90 p-5 max-w-md space-y-4">
          <h3 className="font-semibold">Authorized staff sign in</h3>
          <label className="block text-xs text-slate-300">Email
            <input className={inputClass + ' mt-2'} type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>
          <label className="block text-xs text-slate-300">Password
            <input className={inputClass + ' mt-2'} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </label>
          <button className={buttonClass} type="submit" disabled={working}>{working ? 'Checking identity…' : 'Sign in'}</button>
          <p className="text-xs text-slate-400">No session is saved after a page reload. Valid signed JWT and trusted staff role are required server-side.</p>
        </form>
      ) : (
        <>
          <div className="rounded-xl border border-fuchsia-500/20 bg-slate-950 p-4 flex gap-3 items-center flex-wrap text-xs">
            <span className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-fuchsia-300">Role: {identity.role}</span>
            <span className="text-slate-400">Tenant: {identity.tenantId}</span>
            <span className="text-amber-300 font-semibold">SYNTHETIC • NON-PERSISTENT</span>
            <button className="ml-auto flex gap-2 items-center text-slate-200" disabled={working} onClick={()=>refresh(session.access_token).catch(()=>setNotice('Session unavailable.'))}><RefreshCw size={14}/> Refresh</button>
          </div>
          {identity.role !== 'viewer' && (
            <form onSubmit={createLead} className="rounded-xl border border-fuchsia-500/20 bg-slate-950 p-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-slate-300">Synthetic lead name
                <input className={inputClass + ' mt-2'} value={name} onChange={e=>setName(e.target.value)} maxLength={140} required/>
              </label>
              <label className="text-xs text-slate-300">Company
                <input className={inputClass + ' mt-2'} value={company} onChange={e=>setCompany(e.target.value)} maxLength={140} required/>
              </label>
              <div className="self-end"><button className={buttonClass} disabled={working}>Add demo lead</button></div>
            </form>
          )}
          <div className="rounded-xl border border-fuchsia-500/20 bg-slate-950 overflow-hidden">
            <div className="p-4 border-b border-white/10 font-semibold">Tenant-scoped synthetic leads ({leads.length})</div>
            {leads.map(lead => (
              <div key={lead.id} className="p-4 border-b border-white/10 flex flex-wrap gap-2 justify-between items-center">
                <div><b className="text-sm">{lead.name}</b><p className="text-xs text-slate-400">{lead.company}</p></div>
                {identity.role === 'viewer' ? <span className="text-xs">{lead.stage}</span> : (
                  <select className={inputClass + ' max-w-48'} disabled={working} value={lead.stage} onChange={e=>setStage(lead.id,e.target.value as LeadStage)}>
                    {stageValues.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}
                  </select>
                )}
              </div>
            ))}
            {!leads.length && <p className="p-4 text-sm text-slate-400">No synthetic records for this tenant.</p>}
          </div>
        </>
      )}
    </section>
  );
};
