import assert from 'node:assert/strict';

const base='http://127.0.0.1:4178';
const key='hrgen-ci-only-not-a-production-secret-0123456789abcdef';
const endpoints=[
  ['/api/settings','GET'],['/api/export/bundle','GET'],
  ['/api/pods','GET'],['/api/leads','GET'],['/api/calls','GET'],['/api/services','GET']
];
const reads=[];
for(const [path,method] of endpoints){
  const res=await fetch(base+path,{method});
  const body=await res.text();
  assert.equal(res.status,401,method+' '+path+' must deny unauthenticated');
  assert.ok(!body.includes('agentPods')&&!body.includes('businessLeads'),'Private data leaked in '+path);
  assert.equal(res.headers.get('cache-control'),'no-store');
  reads.push({path,status:res.status});
}
const noWrite=await fetch(base+'/api/settings',{
  method:'PUT',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({whatsappAutoDispatch:false,webhookEndpointUrl:'https://attacker.invalid'})
});
assert.equal(noWrite.status,401,'Unauthorized configuration write must be denied');
const callbacks=await fetch(base+'/webhook/sip/incoming',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
assert.equal(callbacks.status,503,'Unsigned webhook must stay disabled');
const wrong=await fetch(base+'/api/settings',{headers:{authorization:'Bearer '+key+'-wrong'}});
assert.equal(wrong.status,401,'Wrong bearer token must not authorize');
const authorized=await fetch(base+'/api/settings',{headers:{authorization:'Bearer '+key}});
assert.equal(authorized.status,200,'Verified server-to-server test bearer should succeed');
const body=await authorized.json();
assert.equal(body.success,true);
assert.equal(body.settings.whatsappAutoDispatch,true,'Unauthenticated settings request must not mutate state');
const root=await fetch(base+'/');
assert.equal(root.status,200,'Static frontend must remain accessible');
console.log('REAL_BACKEND_GUARD_PASS:',JSON.stringify({
  unauthorizedPaths:reads.map(x=>x.path),
  unauthorizedWritesBlocked:true,
  unsignedWebhooksDisabled:true,
  authorizedServerAccess:true,
  frontendStaticAvailable:true
}));
