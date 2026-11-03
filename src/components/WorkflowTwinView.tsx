import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronRight, Download, GitBranch, Plus, RotateCcw, Search, ShieldAlert, Sparkles, X } from 'lucide-react';
import {
  EXTERNAL_GATES, MODULES, MODULE_BY_ID, PRESETS, STAGES,
  composeBlueprint, recommendFromText, validateBlueprint,
  type ModuleId
} from '../utils/workflowTwin';
import './WorkflowTwinView.css';

type Props = { onClose: () => void };
const stageColumns = STAGES.map((stage,index)=>({stage,x:25+index*228}));
function graphCoordinates(ids:ModuleId[]) {
  const positions=new Map<ModuleId,{x:number;y:number}>();
  for(const [column,stage] of STAGES.entries()){
    const current=MODULES.filter(m=>m.stage===stage&&ids.includes(m.id));
    current.forEach((m,i)=>positions.set(m.id,{x:24+228*column,y:71+i*98}));
  }
  return positions;
}
export function WorkflowTwinView({onClose}:Props) {
  const [selected,setSelected]=useState<ModuleId[]>(PRESETS.collection);
  const [active,setActive]=useState<ModuleId>('booking');
  const [view,setView]=useState<'customer'|'admin'>('customer');
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('');
  const [message,setMessage]=useState('Choose a service to see required modules and workflow dependencies.');
  const [validated,setValidated]=useState(false);
  const [simulated,setSimulated]=useState(false);
  const blueprint=useMemo(()=>composeBlueprint(selected),[selected]);
  const positions=useMemo(()=>graphCoordinates(blueprint.modules.map(m=>m.id)),[blueprint]);
  const integrity=useMemo(()=>validateBlueprint(blueprint),[blueprint]);
  const maxStageNodes=Math.max(3,...STAGES.map(s=>blueprint.modules.filter(m=>m.stage===s).length));
  const graphHeight=93+maxStageNodes*100;
  const activeModule=MODULE_BY_ID[active];
  const filtered=MODULES.filter(m=>(m.label+' '+m.description).toLowerCase().includes(filter.toLowerCase()));

  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();};
    window.addEventListener('keydown',key);
    return ()=>window.removeEventListener('keydown',key);
  },[onClose]);

  const resetValidation=()=>{setValidated(false);setSimulated(false);};
  const add=(id:ModuleId)=>{
    if(!selected.includes(id))setSelected(old=>[...old,id]);
    setActive(id);resetValidation();
    setMessage(MODULE_BY_ID[id].label+' added to blueprint. Dependencies and recommendations recalculated.');
  };
  const toggle=(id:ModuleId)=>{
    if(selected.includes(id)){
      setSelected(old=>old.filter(x=>x!==id));
      setMessage(MODULE_BY_ID[id].label+' removed from explicit selection; it may still be required by another module.');
    }else add(id);
    resetValidation();
  };
  const preset=(type:string)=>{
    const ids=PRESETS[type]||[];
    setSelected([...ids]);setActive(ids[0]||'booking');resetValidation();
    setMessage('Preset applied. This is a preview and does not enable any live integration.');
  };
  const prompt=()=>{
    const ids=recommendFromText(query.trim());
    if(!ids.length){setMessage('No matching keywords found. Select modules manually or use a preset.');return;}
    setSelected(ids);setActive(ids[0]);resetValidation();
    setMessage('Rule-based requirement parsing selected '+ids.length+' starting modules. No LLM call was made.');
  };
  const download=()=>{
    const data={
      schema:'hrgen-workflow-twin-v0.1',
      status:'DRAFT_NOT_DEPLOYED',
      selected:blueprint.selected,
      autoRequired:blueprint.required,
      modules:blueprint.modules.map(m=>({id:m.id,roles:m.roles,dependsOn:m.dependsOn})),
      edges:blueprint.edges,
      validation:{frontend:validated&&integrity.passed?'PASSED':'NOT_VERIFIED',external:'BLOCKED'},
      execution:{enabled:false,payments:false,messaging:false,deploy:false}
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;anchor.download='hrgen-workflow-twin-draft.json';anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Draft JSON exported locally. No automation was deployed.');
  };
  const edges=blueprint.edges.filter(e=>positions.has(e.from)&&positions.has(e.to));
  const yPoints=[...positions.values()];
  const top=113;
  return <div className="hwt-root" role="dialog" aria-modal="true" aria-label="HRGen Workflow Twin">
    <div className="hwt-shell">
      <header className="hwt-top">
        <div className="hwt-logo">HR<span>Gen</span></div>
        <div className="hwt-head-title"><strong>Workflow Twin</strong><small>Visual-first architecture composer · Draft sandbox</small></div>
        <div className="hwt-mode" role="group" aria-label="Workflow view">
          <button className={view==='customer'?'is-active':''} onClick={()=>setView('customer')}>Customer</button>
          <button className={view==='admin'?'is-active':''} onClick={()=>setView('admin')}>Super Admin</button>
        </div>
        <button className="hwt-close" type="button" aria-label="Close Workflow Twin" onClick={onClose}><X size={19}/></button>
      </header>
      <div className="hwt-body">
        <aside className="hwt-sidebar">
          <div className="hwt-section-title"><Sparkles size={15}/> Smart Requirement Input</div>
          <div className="hwt-prompt">
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')prompt();}} placeholder="e.g. Lab home collection + WhatsApp" aria-label="Describe business requirement"/>
            <button type="button" onClick={prompt}><Sparkles size={15}/> Compose</button>
          </div>
          <p className="hwt-hint">Hinglish keywords supported. Transparent rules; not a live AI model.</p>
          <div className="hwt-section-title">Quick-start</div>
          <div className="hwt-presets">
            <button onClick={()=>preset('collection')}>Lab Collection</button>
            <button onClick={()=>preset('marketing')}>Digital Growth</button>
            <button onClick={()=>preset('patient')}>Patient Reports</button>
          </div>
          <div className="hwt-section-title" style={{marginTop:15}}>Module Picker <span>{MODULES.length} modules</span></div>
          <div className="hwt-search"><Search size={16}/><input value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filter modules" placeholder="Search module..." /></div>
          <div className="hwt-library">
            {filtered.map(m=>{
              const chosen=selected.includes(m.id),auto=blueprint.required.includes(m.id);
              return <button key={m.id} onClick={()=>toggle(m.id)} aria-pressed={chosen} className={'hwt-module '+(chosen?'chosen':auto?'required':'')}>
                <span className="hwt-icon">{m.icon}</span><span className="hwt-module-copy"><b>{m.label}</b><small>{chosen?'Selected':auto?'Required dependency':m.stage}</small></span><span>{chosen?<Check size={15}/>:auto?'◆':<Plus size={14}/>}</span>
              </button>;
            })}
          </div>
          <p className="hwt-hint">Modules shown here are design choices; their backend integrations are not activated.</p>
        </aside>
        <section className="hwt-main">
          <div className="hwt-hero"><div><div className="hwt-badge">Visual solution architect</div><h2>Pick a service. See the entire pipeline.</h2><p>Configure modules, inspect dependencies, understand roles and preview verification gates before implementation.</p></div><Sparkles className="hwt-hero-icon" size={35}/></div>
          <div className="hwt-stats">
            <div><small>Module stack</small><strong>{blueprint.modules.length}</strong></div>
            <div><small>Auto dependencies</small><strong>{blueprint.required.length}</strong></div>
            <div><small>Pipeline links</small><strong>{edges.length}</strong></div>
            <div><small>Live integrations</small><strong className="hwt-warning">0</strong></div>
          </div>
          <div className="hwt-card">
            <div className="hwt-card-head"><strong><GitBranch size={17}/> Interactive Pipeline</strong><span className="hwt-badge dim">2.5D view · Preview</span></div>
            <div className="hwt-scroller" tabIndex={0} aria-label="Scrollable architecture pipeline">
              <div className="hwt-graph" style={{height:graphHeight}}>
                {stageColumns.map(s=><div className="hwt-stage-label" style={{left:s.x}} key={s.stage}>{s.stage}</div>)}
                <svg width="1160" height={graphHeight} className="hwt-lines" aria-hidden="true">
                  <defs><marker id="hwt-end-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="#a18bdf" strokeWidth="1.25"/></marker></defs>
                  {edges.map(e=>{
                    const a=positions.get(e.from)!,b=positions.get(e.to)!;
                    const x1=a.x+184,x2=b.x,y1=a.y+37,y2=b.y+37;
                    const delta=Math.max(30,(x2-x1)*0.42);
                    return <path key={e.from+':'+e.to} d={`M ${x1} ${y1} C ${x1+delta} ${y1}, ${x2-delta} ${y2}, ${x2} ${y2}`} fill="none" stroke={e.kind==='required'?'#ef6ab3':'#8274bd'} opacity=".77" strokeWidth={e.kind==='required'?2.2:1.5} markerEnd="url(#hwt-end-arrow)"/>;
                  })}
                </svg>
                {blueprint.modules.map(m=>{
                  const p=positions.get(m.id)!;
                  return <motion.button type="button" key={m.id} whileHover={{y:-4,scale:1.025}} transition={{duration:.18}} style={{left:p.x,top:p.y}} onClick={()=>setActive(m.id)} className={'hwt-node '+(active===m.id?'focused':'')}>
                    <span>{m.icon} &nbsp;<b>{m.label}</b></span><small>{m.stage} · {selected.includes(m.id)?'Selected':'Auto required'}</small>
                  </motion.button>;
                })}
              </div>
            </div>
            <div className="hwt-legend"><span>● Pink = required link</span><span>◆ Purple = suggested link</span><span>Click any module to inspect its role and dependencies</span></div>
          </div>
          <div className="hwt-grid">
            <div className="hwt-card"><div className="hwt-card-head"><strong><Sparkles size={16}/> Smart Recommendations</strong><span className="hwt-badge dim">Optional</span></div>
              <div className="hwt-padding">
                {blueprint.recommendations.length?blueprint.recommendations.map(({module,score})=><div className="hwt-rec" key={module.id}>
                  <span className="hwt-icon">{module.icon}</span><div><strong>{module.label}</strong><small>{module.description} · score {score}</small></div><button onClick={()=>add(module.id)} aria-label={'Add '+module.label}><Plus size={15}/></button>
                </div>):<p className="hwt-hint">No additional recommendations for this stack.</p>}
              </div>
            </div>
            <div className="hwt-card"><div className="hwt-card-head"><strong>Role & Module Inspector</strong></div><div className="hwt-padding">
              <h3 className="hwt-inspector-title">{activeModule.icon} {activeModule.label}</h3>
              <p className="hwt-hint">{activeModule.description}</p>
              <small className="hwt-detail-label">Proposed access roles</small><div className="hwt-tags">{activeModule.roles.map(role=><span key={role}>{role}</span>)}</div>
              <small className="hwt-detail-label">Dependencies</small><div className="hwt-tags">{activeModule.dependsOn.length?activeModule.dependsOn.map(id=><span key={id}>{MODULE_BY_ID[id].label}</span>):<span>None</span>}</div>
              <p className="hwt-hint">Roles are design metadata, not proof of secure backend permissions.</p>
            </div></div>
          </div>
          <div className="hwt-card"><div className="hwt-card-head"><strong><ChevronRight size={16}/> Workflow Simulation</strong><span className="hwt-badge warning">No external execution</span></div>
            <div className="hwt-padding">
              <div className="hwt-steps"><span>Service request</span>{blueprint.modules.map(m=><React.Fragment key={m.id}><ArrowRight size={13}/><span>{m.label}</span></React.Fragment>)}<ArrowRight size={13}/><span>Human release gate</span></div>
              <div className="hwt-actions"><button className="hwt-primary" onClick={()=>{setSimulated(true);setMessage('Local workflow simulation completed. No API call, message or payment was sent.');}}>▶ Simulate</button><button onClick={()=>{setValidated(true);setMessage(integrity.passed?'Frontend blueprint checks passed; backend and production gates remain blocked.':'Blueprint validation failed: '+integrity.failures.join(', '));}}>✓ Verify Blueprint</button><button onClick={download}><Download size={14}/> Export Draft</button><button onClick={()=>{setSelected(PRESETS.collection);setActive('booking');resetValidation();}}><RotateCcw size={14}/> Reset</button></div>
              <p className="hwt-hint" role="status">{simulated?'✓ Local simulation complete · external operations blocked':'Simulation has not been run.'}</p>
            </div>
          </div>
          {view==='admin'&&<div className="hwt-card"><div className="hwt-card-head"><strong><ShieldAlert size={17}/> Super Admin Design Review</strong></div><div className="hwt-admin">
            <div><b>12-agent registry</b><small>Different source repository. Current CEO/PM permission verification pending.</small></div>
            <div><b>Backend / n8n integration</b><small>No workflow publishing, secrets or webhooks in this frontend demo.</small></div>
            <div><b>Tenant deployment</b><small>Independent permissions, isolation and approval gates required.</small></div>
          </div></div>}
          <div className="hwt-grid">
            <div className="hwt-card"><div className="hwt-card-head"><strong>Selected Solution Stack</strong><span className="hwt-badge">{blueprint.modules.length} modules</span></div><div className="hwt-padding hwt-tags">
              {blueprint.modules.map(m=><span key={m.id}>{m.label}{blueprint.required.includes(m.id)?' · auto':''}</span>)}
            </div></div>
            <div className="hwt-card"><div className="hwt-card-head"><strong>Verification & Release Checklist</strong><span className="hwt-badge warning">Release blocked</span></div>
              <div className="hwt-padding"><div className="hwt-check"><span>Frontend blueprint integrity</span><b className={validated&&integrity.passed?'ok':'pending'}>{validated?(integrity.passed?'Pass':'Fail'):'Pending'}</b></div>{EXTERNAL_GATES.map(g=><div key={g.name} className="hwt-check"><span>{g.name}<small>{g.detail}</small></span><b className="pending">Blocked</b></div>)}</div>
            </div>
          </div>
          <div className="hwt-message" role="status" aria-live="polite">{message}</div>
        </section>
      </div>
      <footer className="hwt-footer">HRGen DigiTech · Safe-copy UI prototype · No production deployment, patient data or live transaction</footer>
    </div>
  </div>;
}
