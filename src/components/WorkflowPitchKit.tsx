import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, ExternalLink, MessageCircle, ShieldCheck } from 'lucide-react';

type AssetKey = 'demo' | 'video' | 'recording' | 'testimonial';
type Props = { moduleNames: string[] };
const ASSETS: Array<{id:AssetKey;label:string}> = [
  {id:'demo',label:'Demo link'},
  {id:'video',label:'Walkthrough video'},
  {id:'recording',label:'Consented recording'},
  {id:'testimonial',label:'Approved testimonial'}
];
const isHttps = (value:string) => {
  try {const url=new URL(value);return url.protocol==='https:'&&Boolean(url.hostname);} catch {return false;}
};
export function WorkflowPitchKit({moduleNames}:Props){
  const [prospect,setProspect]=useState('');
  const [phone,setPhone]=useState('');
  const [fee,setFee]=useState('30000');
  const [links,setLinks]=useState<Record<AssetKey,string>>({demo:'',video:'',recording:'',testimonial:''});
  const [verified,setVerified]=useState(false);
  const [status,setStatus]=useState('');
  const selectedAssets=ASSETS.filter(item=>links[item.id].trim());
  const invalidAssets=selectedAssets.filter(item=>!isHttps(links[item.id].trim()));
  const message=useMemo(()=>{
    const intro=`Namaste${prospect.trim()?', '+prospect.trim():''}, HRGen Healthcare & DigiTech ki taraf se.`;
    const scope=moduleNames.length?`Proposed setup: ${moduleNames.join(', ')}.`:'Proposed digital setup ke modules review mein hain.';
    const amount=fee.trim()&&Number(fee)>0?`Indicative setup: ₹${Number(fee).toLocaleString('en-IN')} (final scope, tax aur agreement subject to confirmation).`:'Final price quotation mein confirm hoga.';
    const evidence=verified?ASSETS.filter(x=>isHttps(links[x.id].trim())).map(x=>x.label+': '+links[x.id].trim()).join('\n'):'';
    return [intro,scope,amount,evidence,'Kya aapko private demo aur requirement discussion ke liye convenient slot milega?','HRGen DigiTech | hrgen.in'].filter(Boolean).join('\n\n');
  },[prospect,fee,links,verified,moduleNames]);
  const copy=async()=>{
    try {await navigator.clipboard.writeText(message);setStatus('Draft copied. Review before sharing.');}
    catch {setStatus('Clipboard unavailable. Select and copy the draft manually.');}
  };
  const share=()=>{
    if(invalidAssets.length&&verified){setStatus('Invalid HTTPS asset URL. Correct the links before sharing.');return;}
    const digits=phone.replace(/\D/g,'');
    if(phone.trim()&&!/^(?:91)?[6-9]\d{9}$/.test(digits)){setStatus('Enter a valid Indian WhatsApp number or leave it blank for share selection.');return;}
    const url='https://wa.me/'+(digits?digits.length===10?'91'+digits:digits:'')+'?text='+encodeURIComponent(message);
    window.open(url,'_blank','noopener,noreferrer');
    setStatus('WhatsApp draft opened. Sending remains your choice.');
  };
  const exportDraft=()=>{
    const payload={
      type:'HRGEN_PITCH_DRAFT',status:'NOT_SENT_NOT_APPROVED',
      prospect:prospect.trim(),phone:phone.trim(),proposedModules:moduleNames,
      proposedFeeINR:fee.trim()?Number(fee):null,
      evidence:ASSETS.map(x=>({type:x.id,url:links[x.id].trim(),contentVerified:false,shareApproval:verified})),
      message,notes:'No recording or testimonial has been independently validated by this interface.'
    };
    const objectUrl=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=objectUrl;a.download='hrgen-pitch-draft.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(objectUrl),0);
    setStatus('Local pitch JSON downloaded. No CRM record or message was created.');
  };
  return <details className="hwt-pitch-kit">
    <summary><span><MessageCircle size={17}/> Sales Pitch Kit</span><span>Draft only</span></summary>
    <div className="hwt-pitch-body">
      <div className="hwt-pitch-fields">
        <label>Business / lead name<input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Lab or business name" /></label>
        <label>WhatsApp number<input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Optional" /></label>
        <label>Proposed setup (₹)<input inputMode="numeric" value={fee} onChange={e=>setFee(e.target.value.replace(/[^\d]/g,''))} placeholder="Subject to quotation" /></label>
      </div>
      <div className="hwt-pitch-proof">
        <strong>Verified sales evidence</strong>
        <div className="hwt-pitch-fields">
          {ASSETS.map(a=><label key={a.id}>{a.label}<input type="url" value={links[a.id]} onChange={e=>{setLinks(old=>({...old,[a.id]:e.target.value}));setVerified(false);}} placeholder="https:// (optional)" /></label>)}
        </div>
        <label className="hwt-pitch-consent">
          <input type="checkbox" checked={verified} disabled={!selectedAssets.length||Boolean(invalidAssets.length)} onChange={e=>setVerified(e.target.checked)} />
          <span>I checked these links, rights and sharing consent.</span>
        </label>
        {invalidAssets.length>0&&<p className="hwt-pitch-warning">Only valid HTTPS URLs can be approved.</p>}
        <p className="hwt-hint">URLs and checkbox are user-attested only; the content is not independently verified.</p>
      </div>
      <label className="hwt-pitch-message">WhatsApp draft<textarea value={message} readOnly rows={8} aria-label="Generated WhatsApp message"/></label>
      <div className="hwt-actions">
        <button onClick={copy} type="button"><Copy size={14}/> Copy</button>
        <button onClick={share} className="hwt-primary" type="button"><ExternalLink size={14}/> Open WhatsApp</button>
        <button onClick={exportDraft} type="button"><Download size={14}/> Export draft</button>
      </div>
      <p className="hwt-hint"><ShieldCheck size={13} style={{display:'inline'}}/> Proposed pricing only. No market-lowest, live-service or compliance claims.</p>
      {status&&<p className="hwt-message" role="status">{status}</p>}
    </div>
  </details>;
}
