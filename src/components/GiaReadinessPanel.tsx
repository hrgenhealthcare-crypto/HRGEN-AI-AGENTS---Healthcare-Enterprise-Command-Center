import React, {useState} from 'react';
import {CheckCircle2, FileDown, GitBranch, LockKeyhole, ShieldAlert} from 'lucide-react';
import {GIA_EVIDENCE, GIA_SNAPSHOT, giaReadinessDraft, giaReadinessVerdict} from '../utils/giaReadiness';

/**
 * Client-rendered status preview, not an authenticated super-admin panel.
 * No secrets or private URLs are exposed. Do not wire a live API or deploy
 * from this component until the server implements genuine RBAC.
 */
export function GiaReadinessPanel(){
  const [opened,setOpened]=useState(false);
  const [message,setMessage]=useState('');
  const verdict=giaReadinessVerdict();
  const download=()=>{
    const text=JSON.stringify(giaReadinessDraft(),null,2);
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const a=document.createElement('a');
    a.href=url;
    a.download='HRGen_GIA_Readiness_DRAFT_2026-11-08.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Read-only evidence draft exported. No GIA or staging service was contacted.');
  };
  return <section className="hwt-gia-panel hwt-card" aria-label="GIA integration readiness">
    <div className="hwt-card-head">
      <strong><ShieldAlert size={17}/> GIA + Private Staging Readiness</strong>
      <span className="hwt-badge warning">LIVE RELEASE HOLD</span>
    </div>
    <div className="hwt-gia-intro">
      <div className="hwt-gia-metrics">
        <div><b>14/14</b><small>Archived Python tests</small></div>
        <div><b>12/12</b><small>Archived agent identities</small></div>
        <div><b>{verdict.blockerCount}</b><small>Open release gates</small></div>
      </div>
      <p className="hwt-hint">Source snapshots: {GIA_SNAPSHOT.archivalPeriod} · checked {GIA_SNAPSHOT.checkedAt}. Historical offline tests do not verify the running Windows PC, current CEO/PM permissions, live GIA, hosted tenant isolation or production security.</p>
      <div className="hwt-gia-primary">
        <button type="button" onClick={()=>setOpened(v=>!v)} aria-expanded={opened} aria-controls="hwt-gia-matrix">
          <GitBranch size={15}/>{opened?'Hide verification matrix':'Show verification matrix'}
        </button>
        <button type="button" onClick={download}><FileDown size={15}/> Export evidence draft</button>
      </div>
    </div>
    {opened&&<div id="hwt-gia-matrix" className="hwt-gia-matrix">
      {GIA_EVIDENCE.map(g=><div className="hwt-gia-gate" key={g.id}>
        <div className="hwt-gia-gate-head">
          <strong>{g.state==='OFFLINE_PASS'?<CheckCircle2 size={16}/>:<LockKeyhole size={16}/>} {g.title}</strong>
          <span className={'hwt-gia-state '+(g.state==='OFFLINE_PASS'?'is-archive':'is-hold')}>{g.state==='OFFLINE_PASS'?'Archived pass':'Hold'}</span>
        </div>
        <p><b>Evidence:</b> {g.evidence}</p>
        <p><b>Next:</b> {g.nextAction}</p>
      </div>)}
    </div>}
    <div className="hwt-gia-note">
      <LockKeyhole size={15}/>
      <span>Current connected GIA: <b>not verified</b> · Private Supabase: <b>not connected</b> · Payments/WhatsApp: <b>disabled</b></span>
    </div>
    {message&&<p role="status" className="hwt-message" style={{margin:'8px 13px'}}>{message}</p>}
  </section>;
}
