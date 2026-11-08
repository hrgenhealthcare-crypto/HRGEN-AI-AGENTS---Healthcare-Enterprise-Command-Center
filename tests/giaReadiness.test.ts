import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {GIA_EVIDENCE,GIA_SNAPSHOT,giaReadinessDraft,giaReadinessVerdict} from '../src/utils/giaReadiness';

test('Archived GIA evidence is separated from live readiness',()=>{
  assert.equal(GIA_SNAPSHOT.checkedAt,'2026-11-08');
  assert.equal(GIA_SNAPSHOT.archivalPeriod,'2026-08');
  assert.equal(GIA_SNAPSHOT.productionConnected,false);
  assert.equal(GIA_SNAPSHOT.privateStagingConnected,false);
  assert.equal(GIA_SNAPSHOT.autoProvisionAllowed,false);
  assert.match(GIA_EVIDENCE.find(x=>x.id==='gia-archive-py')?.evidence||'',/14\/14/);
  assert.match(GIA_EVIDENCE.find(x=>x.id==='agents-archive')?.evidence||'',/12 unique agent IDs/);
});
test('All hosted/runtime/commercial gates are HOLD even after offline passes',()=>{
  const actual=giaReadinessVerdict();
  assert.equal(actual.release,'HOLD');
  assert.equal(actual.offlinePass,2);
  assert.equal(actual.blockerCount,4);
  assert.deepEqual(actual.blockers,['gia-runtime','staging-provider','tenant-hosted','commercial-activation']);
});
test('Export has no credentials, private Drive URLs, or automatic external actions',()=>{
  const draft=giaReadinessDraft();
  const json=JSON.stringify(draft);
  assert.equal(draft.status,'DRAFT_NO_LIVE_CONNECTION');
  assert.equal(draft.restrictions.noCredentialsInBrowser,true);
  assert.equal(draft.restrictions.noExternalWrite,true);
  assert.doesNotMatch(json,/(?:Bearer\s+\S+|SUPABASE_SECRET_KEY\s*[=:]|AIza[\w-]{15,}|drive\.google\.com\/file\/d\/)/);
});
test('GIA panel is visible only in Super Admin Review and never contacts a live API',()=>{
  const panel=readFileSync('src/components/GiaReadinessPanel.tsx','utf8');
  const twin=readFileSync('src/components/WorkflowTwinView.tsx','utf8');
  assert.match(twin,/view==='admin'&&<div className="hwt-review-block"><GiaReadinessPanel\/>/);
  assert.match(panel,/No GIA or staging service was contacted/);
  assert.doesNotMatch(panel,/fetch\(|axios|\.post\(/);
});
