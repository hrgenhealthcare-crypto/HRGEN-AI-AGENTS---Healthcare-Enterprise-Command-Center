import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBusinessAudit } from './auditEngine';
const t = '2026-11-05T07:00:00.000Z';
const proof = { evidenceUrl:'https://example.com/proof', observedAt:t };
test('missing website is N/A, not automatically a zero', () => {
  const a = evaluateBusinessAudit({ businessName:'No Site Lab', observations:[
    {category:'website_seo',finding:'No website',status:'not_applicable'},
    {category:'google_business',finding:'Profile found',status:'pass',...proof}
  ]},new Date(t));
  assert.equal(a.score,100);
  assert.equal(a.categories.find(x=>x.category==='website_seo')?.notApplicable,true);
});
test('unverified pass cannot inflate score',()=>{
  const a=evaluateBusinessAudit({businessName:'Test',observations:[
    {category:'google_business',finding:'Guess',status:'pass'},
    {category:'google_business',finding:'Broken listing',status:'gap',recommendation:'Fix details',...proof}
  ]});
  assert.equal(a.score,0);
  assert.equal(a.evidenceCoverage.unverified,1);
  assert.equal(a.remedies.length,1);
});
test('empty evidence returns null, never fabricated score',()=>{
  const a=evaluateBusinessAudit({businessName:'Test',observations:[]});
  assert.equal(a.score,null);
});
test('reject missing business name',()=>assert.throws(()=>evaluateBusinessAudit({businessName:'',observations:[]})));
