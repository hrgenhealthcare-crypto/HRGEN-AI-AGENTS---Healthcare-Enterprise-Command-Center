export type WorkflowStage = 'Entry' | 'Identity' | 'Operations' | 'Growth' | 'Automation';
export type ModuleId =
  | 'website' | 'booking' | 'login' | 'phlebo' | 'notify' | 'payment'
  | 'reports' | 'crm' | 'seo' | 'ads' | 'analytics' | 'orchestration';

export interface WorkflowModule {
  id: ModuleId;
  label: string;
  description: string;
  icon: string;
  stage: WorkflowStage;
  roles: readonly string[];
  dependsOn: readonly ModuleId[];
  recommends: readonly ModuleId[];
}
export interface WorkflowEdge {
  from: ModuleId;
  to: ModuleId;
  kind: 'required' | 'suggested';
}
export interface Blueprint {
  selected: ModuleId[];
  required: ModuleId[];
  modules: WorkflowModule[];
  edges: WorkflowEdge[];
  recommendations: Array<{ module: WorkflowModule; score: number }>;
  status: 'DRAFT_NOT_DEPLOYED';
}
export const STAGES: WorkflowStage[] = ['Entry','Identity','Operations','Growth','Automation'];

export const MODULES: WorkflowModule[] = [
  {id:'website',label:'Business Website',description:'Service catalogue, enquiry and lead capture',icon:'◫',stage:'Entry',roles:['Visitor','Marketing'],dependsOn:[],recommends:['seo','analytics','ads']},
  {id:'booking',label:'Booking PWA',description:'Customer booking request and status',icon:'▣',stage:'Entry',roles:['Patient','Lab Admin'],dependsOn:[],recommends:['login','phlebo','notify','crm']},
  {id:'login',label:'Role Login',description:'Access-control design, not verified authentication',icon:'♙',stage:'Identity',roles:['Patient','Lab Admin','Phlebo','Sales'],dependsOn:[],recommends:['crm']},
  {id:'phlebo',label:'Phlebo Tracker',description:'Assignments, check-in and collection status design',icon:'⌖',stage:'Operations',roles:['Phlebo','Lab Admin'],dependsOn:['booking','login'],recommends:['notify','orchestration']},
  {id:'notify',label:'WhatsApp / SMS',description:'Consent-aware notification workflow proposal',icon:'✉',stage:'Operations',roles:['Patient','Lab Admin'],dependsOn:['booking'],recommends:['orchestration']},
  {id:'payment',label:'Payments',description:'Checkout and reconciliation design, disabled by default',icon:'₹',stage:'Operations',roles:['Finance Admin','Customer'],dependsOn:['booking','login'],recommends:['analytics']},
  {id:'reports',label:'Report Access',description:'Patient authorization and report retrieval design only',icon:'▤',stage:'Operations',roles:['Patient','Lab Admin'],dependsOn:['login'],recommends:['notify']},
  {id:'crm',label:'CRM Follow-up',description:'Lead ownership, history and outreach approvals',icon:'♧',stage:'Operations',roles:['Sales','Lab Admin'],dependsOn:['login'],recommends:['orchestration','analytics']},
  {id:'seo',label:'SEO / GEO / AEO',description:'Metadata, schema and visibility planning',icon:'◎',stage:'Growth',roles:['Marketing','HRGen Admin'],dependsOn:['website'],recommends:['analytics']},
  {id:'ads',label:'Meta / Google Ads',description:'Campaign planning; no publishing or spending',icon:'◈',stage:'Growth',roles:['Marketing','Finance Admin'],dependsOn:['website'],recommends:['crm','analytics']},
  {id:'analytics',label:'Analytics',description:'Measurements and funnel dashboard design',icon:'▥',stage:'Growth',roles:['Lab Admin','HRGen Admin'],dependsOn:[],recommends:['orchestration']},
  {id:'orchestration',label:'Automation Engine',description:'Draft triggers, dependencies and approval gates',icon:'⚙',stage:'Automation',roles:['HRGen Admin','Lab Admin'],dependsOn:[],recommends:[]}
];
export const MODULE_BY_ID = Object.fromEntries(MODULES.map(m=>[m.id,m])) as Record<ModuleId,WorkflowModule>;
export const PRESETS: Record<string,ModuleId[]> = {
  collection:['booking','phlebo'],
  marketing:['website','seo','ads'],
  patient:['booking','reports']
};
export const EXTERNAL_GATES = [
  {name:'Registry CEO / Project Manager source review',detail:'Current workforce registry and independent permissions must be checked',passed:false},
  {name:'Backend authentication and tenant isolation',detail:'RBAC, negative-access tests and audit logging required',passed:false},
  {name:'Provider integrations and clinical workflows',detail:'n8n, WhatsApp, payments and report delivery unconnected',passed:false},
  {name:'Deployment and owner approval',detail:'Private staging, mobile QA, UAT and release sign-off pending',passed:false}
] as const;

export function composeBlueprint(ids: readonly ModuleId[]): Blueprint {
  const selected = [...new Set(ids.filter(id=>Boolean(MODULE_BY_ID[id])))];
  const visited = new Set<ModuleId>(selected);
  let changed = true;
  while(changed){
    changed=false;
    for(const id of [...visited]){
      for(const dep of MODULE_BY_ID[id].dependsOn){
        if(!visited.has(dep)){visited.add(dep);changed=true;}
      }
    }
  }
  const modules=MODULES.filter(m=>visited.has(m.id));
  const required=modules.filter(m=>!selected.includes(m.id)).map(m=>m.id);
  const recommendations=new Map<ModuleId,number>();
  for(const m of modules)for(const id of m.recommends){
    if(!visited.has(id))recommendations.set(id,(recommendations.get(id)||0)+1);
  }
  const edges:WorkflowEdge[]=[];
  for(const m of modules){
    for(const dep of m.dependsOn)if(visited.has(dep)){
      edges.push({from:dep,to:m.id,kind:'required'});
    }
    for(const rec of m.recommends)if(visited.has(rec)&&!m.dependsOn.includes(rec)){
      const duplicate=edges.some(e=>e.from===m.id&&e.to===rec);
      if(!duplicate&&m.id!==rec)edges.push({from:m.id,to:rec,kind:'suggested'});
    }
  }
  return {
    selected,required,modules,edges,
    recommendations:[...recommendations].sort((a,b)=>b[1]-a[1]).map(([id,score])=>({module:MODULE_BY_ID[id],score})).slice(0,5),
    status:'DRAFT_NOT_DEPLOYED'
  };
}
export function validateBlueprint(blueprint:Blueprint):{passed:boolean;failures:string[]} {
  const failures:string[]=[];
  if(!blueprint.modules.length)failures.push('No modules selected');
  if(new Set(MODULES.map(x=>x.id)).size!==MODULES.length)failures.push('Duplicate module IDs');
  const ids=new Set(blueprint.modules.map(m=>m.id));
  for(const module of blueprint.modules){
    if(!module.roles.length)failures.push(module.id+': role mapping missing');
    for(const dep of module.dependsOn)if(!ids.has(dep))failures.push(module.id+': missing '+dep);
  }
  const checked=new Set<ModuleId>(),stack=new Set<ModuleId>();
  function visit(id:ModuleId){
    if(stack.has(id)){failures.push('Cycle: '+id);return;}
    if(checked.has(id))return;
    stack.add(id);
    for(const dep of MODULE_BY_ID[id].dependsOn)visit(dep);
    stack.delete(id);checked.add(id);
  }
  for(const id of ids)visit(id);
  return {passed:failures.length===0,failures};
}
export function recommendFromText(input:string):ModuleId[]{
  const patterns:Array<[RegExp,ModuleId[]]>=[
    [/lab|pathology|sample|home collection|diagnostic|phlebo|लैब|कलेक्शन/i,['booking','phlebo']],
    [/site|website|landing|वेबसाइट/i,['website','seo']],
    [/report|रिपोर्ट/i,['reports','login']],
    [/whatsapp|sms|notification|वाट्सएप/i,['notify']],
    [/razorpay|payment|पेमेंट/i,['payment']],
    [/ads|meta|marketing|campaign|मार्केटिंग/i,['website','ads','analytics']],
    [/crm|sales|lead|follow.?up|सेल्स/i,['crm']],
    [/automation|workflow|n8n|agent|ऑटोमेशन/i,['orchestration']]
  ];
  return [...new Set(patterns.flatMap(([re,values])=>re.test(input)?values:[]))];
}
