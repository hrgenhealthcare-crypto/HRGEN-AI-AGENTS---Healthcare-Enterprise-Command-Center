import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  createMembershipLookup, staffMembershipCheckerFromEnvironment,
} from '../security/supabaseMembership';
import { createStaffMembershipChecker } from '../security/staffMembership';

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const user = '11111111-1111-4111-8111-111111111111';
const current = { user_id:user, tenant_id:A, role:'sales', active:true };
const signed = { userId:user, tenantId:A, role:'sales' as const };

test('authoritative backend membership parsed and cross-checked with signed identity', async () => {
  let lookupId = '';
  const reader = createMembershipLookup(async id => {
    lookupId = id;
    return { data:current, error:null };
  });
  const check = createStaffMembershipChecker(reader);
  assert.equal(await check(signed),true);
  assert.equal(lookupId,user,'lookup always uses verified sub');
  assert.equal(await check({...signed,tenantId:B}),false,'different JWT tenant rejected');
  assert.equal(await check({...signed,role:'owner'}),false,'old role rejected');
});

test('disabled staff and missing membership fail authorization without token fallback', async () => {
  const disabled = createStaffMembershipChecker(createMembershipLookup(
    async()=>({data:{...current,active:false},error:null})));
  assert.equal(await disabled(signed),false);
  const missing = createStaffMembershipChecker(createMembershipLookup(
    async()=>({data:null,error:null})));
  assert.equal(await missing(signed),false);
});

test('membership database errors and invalid response never permit access', async () => {
  const errorLookup = createMembershipLookup(async()=>({
    data:null,error:{message:'synthetic transport failure'},
  }));
  await assert.rejects(errorLookup(user), /membership lookup unavailable/);
  const malformed = [
    {...current,user_id:'22222222-2222-4222-8222-222222222222'},
    {...current,tenant_id:'wrong'},
    {...current,role:'superuser'},
    {...current,active:'true'},
    { ...current, role:null },
    [], 'invalid',
  ];
  for (const record of malformed) {
    await assert.rejects(
      createMembershipLookup(async()=>({data:record,error:null}))(user),
      /Invalid authoritative membership/,
    );
  }
  await assert.rejects(errorLookup('not-a-uuid'),/Invalid verified user identifier/);
});

test('authoritative lookup is not cached: changes take effect on the next request', async () => {
  let changed = {...current};
  let count = 0;
  const checker = createStaffMembershipChecker(createMembershipLookup(async()=> {
    count++;
    return {data:changed,error:null};
  }));
  assert.equal(await checker(signed),true);
  changed={...changed,role:'viewer'};
  assert.equal(await checker(signed),false);
  changed={...changed,role:'sales',active:false};
  assert.equal(await checker(signed),false);
  assert.equal(count,3);
});

test('missing, invalid or browser-publishable key cannot enable privileged lookup', () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SECRET_KEY;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    assert.equal(staffMembershipCheckerFromEnvironment(),null);
    process.env.SUPABASE_URL='https://synthetic-project.supabase.co';
    process.env.SUPABASE_SECRET_KEY='sb_publishable_this-is-not-a-secret';
    assert.equal(staffMembershipCheckerFromEnvironment(),null);
    process.env.SUPABASE_SECRET_KEY='short';
    assert.equal(staffMembershipCheckerFromEnvironment(),null);
    process.env.SUPABASE_SECRET_KEY='sb_secret_synthetic-not-real-staging-test-0123456789';
    process.env.SUPABASE_URL='http://synthetic-project.supabase.co';
    assert.equal(staffMembershipCheckerFromEnvironment(),null);
    process.env.SUPABASE_URL='https://synthetic-project.supabase.co/path';
    assert.equal(staffMembershipCheckerFromEnvironment(),null);
  } finally {
    if(originalUrl===undefined)delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL=originalUrl;
    if(originalKey===undefined)delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY=originalKey;
  }
});

test('server wiring and release kill switch remain in place', () => {
  const server=readFileSync('server.ts','utf8');
  const frontend=readFileSync('src/components/StaffCrmPortal.tsx','utf8');
  assert.ok(server.includes('staffMembershipCheckerFromEnvironment()'));
  assert.ok(server.includes("if (process.env.NODE_ENV === 'production')"));
  assert.ok(!frontend.includes('SUPABASE_SECRET_KEY'));
  assert.ok(!frontend.includes('service_role'));
  assert.ok(!frontend.includes('sb_secret_'));
});
