import assert from 'node:assert/strict';
import test from 'node:test';
import {MODULES, PRESETS, composeBlueprint, validateBlueprint, recommendFromText} from '../src/utils/workflowTwin';

test('catalogue has 12 uniquely named modules',()=>{
  assert.equal(MODULES.length,12);
  assert.equal(new Set(MODULES.map(m=>m.id)).size,12);
  assert.equal(new Set(MODULES.map(m=>m.label)).size,12);
});
test('lab setup adds required role and booking modules without duplicates',()=>{
  const result=composeBlueprint(PRESETS.collection);
  assert.equal(result.status,'DRAFT_NOT_DEPLOYED');
  assert.deepEqual(result.selected,['booking','phlebo']);
  assert.ok(result.required.includes('login'));
  assert.equal(new Set(result.modules.map(m=>m.id)).size,result.modules.length);
  assert.ok(result.edges.some(e=>e.from==='login'&&e.to==='phlebo'));
  assert.deepEqual(validateBlueprint(result),{passed:true,failures:[]});
});
test('report access depends on role login',()=>{
  const result=composeBlueprint(['reports']);
  assert.ok(result.required.includes('login'));
  assert.deepEqual(validateBlueprint(result).failures,[]);
});
test('payment design depends on authentication and booking',()=>{
  const result=composeBlueprint(['payment']);
  assert.ok(result.required.includes('booking'));
  assert.ok(result.required.includes('login'));
  assert.deepEqual(validateBlueprint(result).failures,[]);
});
test('recommendations omit already selected and auto-required modules',()=>{
  const result=composeBlueprint(['booking']);
  for(const item of result.recommendations){
    assert.ok(!result.modules.some(m=>m.id===item.module.id));
  }
  assert.ok(result.recommendations.some(x=>x.module.id==='phlebo'));
});
test('removing selected module recalculates derived dependencies',()=>{
  const before=composeBlueprint(['phlebo']);
  const after=composeBlueprint([]);
  assert.ok(before.required.includes('booking'));
  assert.ok(before.required.includes('login'));
  assert.equal(after.modules.length,0);
  assert.equal(validateBlueprint(after).passed,false);
});
test('keyword parser remains local and deterministic',()=>{
  const ids=recommendFromText('home collection with WhatsApp and CRM');
  assert.ok(ids.includes('booking'));
  assert.ok(ids.includes('phlebo'));
  assert.ok(ids.includes('notify'));
  assert.ok(ids.includes('crm'));
  assert.deepEqual(recommendFromText('unmatchedfoobar'),[]);
});
test('external automation is never represented as deployed',()=>{
  assert.equal(composeBlueprint(['orchestration']).status,'DRAFT_NOT_DEPLOYED');
});
