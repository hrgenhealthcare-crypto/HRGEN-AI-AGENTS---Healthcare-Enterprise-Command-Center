import { expect, test, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Mock only the external Supabase Auth HTTP boundary.
 * The browser runs the REAL StaffCrmPortal and Supabase JS client; its CRM
 * requests reach the REAL createStaffCrmRouter with signature-verified JWTs.
 * All identities and keys are ephemeral synthetic localhost CI fixtures.
 */
const base = 'http://127.0.0.1:4182';
const tenantA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const tenantB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const leadA = 'aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa';
const syntheticPassword = 'synthetic-ci-password-only';

async function mockExternalIdp(page: Page, request: APIRequestContext) {
  await page.route('https://synthetic-idp.invalid/auth/v1/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'apikey,authorization,content-type,x-client-info',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'cache-control':'no-store',
    };
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status:204, headers });
      return;
    }
    if (url.pathname.endsWith('/token') && url.searchParams.get('grant_type') === 'password') {
      const input = req.postDataJSON();
      const response = await request.post(base + '/__synthetic/login', { data: input });
      await route.fulfill({
        status:response.status(),
        headers:{...headers, 'content-type':'application/json'},
        body:await response.text(),
      });
      return;
    }
    if (url.pathname.endsWith('/logout')) {
      await route.fulfill({ status:204, headers });
      return;
    }
    await route.fulfill({
      status:404, headers:{...headers,'content-type':'application/json'},
      body:JSON.stringify({error:'not_found'}),
    });
  });
}

async function signIn(page: Page, request: APIRequestContext, email: string, password = syntheticPassword) {
  await mockExternalIdp(page, request);
  await page.goto('/staff-crm');
  await expect(page.getByRole('heading', {name:'Authorized staff sign in'})).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name:'Sign in' }).click();
}

async function tokenFor(request: APIRequestContext, email: string): Promise<string> {
  const response = await request.post(base + '/__synthetic/login', {
    data:{email,password:syntheticPassword},
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.access_token;
}

test('signed lab A sales login, create, stage change, signout and reload', async ({page,request}, testInfo) => {
  const marker = 'E2E Synthetic A New Lead ' + testInfo.project.name;
  const pageErrors: string[] = [];
  page.on('pageerror', e=>pageErrors.push(e.message));
  await signIn(page,request,'a-sales@synthetic.invalid');
  await expect(page.getByText('Role: sales')).toBeVisible();
  await expect(page.getByText('Tenant: '+tenantA)).toBeVisible();
  await expect(page.getByText('Synthetic Lab A baseline')).toBeVisible();
  await expect(page.getByText('Synthetic Lab B baseline')).toHaveCount(0);
  await page.getByLabel('Synthetic lead name').fill(marker);
  await page.getByLabel('Company').fill('Synthetic Company A');
  await page.getByRole('button',{name:'Add demo lead'}).click();
  await expect(page.getByText(marker, {exact:true})).toBeVisible();
  await page.getByText(marker, {exact:true})
    .locator('xpath=../..').locator('select').selectOption('contacted');
  await expect(page.getByText(marker, {exact:true})
    .locator('xpath=../..').locator('select')).toHaveValue('contacted');

  await page.getByRole('button',{name:'Sign out'}).click();
  await expect(page.getByRole('heading',{name:'Authorized staff sign in'})).toBeVisible();
  await expect(page.getByText(marker, {exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.length)).toBe(0);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Authorized staff sign in'})).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('viewer sees own lab only, has no mutation controls and API enforces 403', async ({page,request}) => {
  await signIn(page,request,'a-viewer@synthetic.invalid');
  await expect(page.getByText('Role: viewer')).toBeVisible();
  await expect(page.getByText('Synthetic Lab A baseline')).toBeVisible();
  await expect(page.getByText('Synthetic Lab B baseline')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Add demo lead'})).toHaveCount(0);
  await expect(page.locator('select')).toHaveCount(0);

  const token = await tokenFor(request,'a-viewer@synthetic.invalid');
  const headers={Authorization:'Bearer '+token};
  const badCreate = await request.post(base+'/api/staff/leads', {
    headers,data:{name:'FORBIDDEN',company:'Synthetic'},
  });
  expect(badCreate.status()).toBe(403);
  const badUpdate = await request.patch(base+'/api/staff/leads/'+leadA, {
    headers,data:{stage:'won'},
  });
  expect(badUpdate.status()).toBe(403);
});

test('lab B signed user cannot read or change lab A records', async ({page,request}) => {
  await signIn(page,request,'b-admin@synthetic.invalid');
  await expect(page.getByText('Role: admin')).toBeVisible();
  await expect(page.getByText('Tenant: '+tenantB)).toBeVisible();
  await expect(page.getByText('Synthetic Lab B baseline')).toBeVisible();
  await expect(page.getByText('Synthetic Lab A baseline')).toHaveCount(0);

  const token = await tokenFor(request,'b-admin@synthetic.invalid');
  const headers={Authorization:'Bearer '+token};
  const list = await request.get(base+'/api/staff/leads',{headers});
  expect(list.status()).toBe(200);
  const leads = (await list.json()).leads as {tenantId:string;name:string}[];
  expect(leads.length).toBeGreaterThanOrEqual(1);
  expect(leads.every(x=>x.tenantId===tenantB)).toBe(true);
  expect(leads.some(x=>x.name==='Synthetic Lab A baseline')).toBe(false);
  const patch = await request.patch(base+'/api/staff/leads/'+leadA,{
    headers,data:{stage:'won'},
  });
  expect(patch.status()).toBe(404);
});

test('invalid credentials, anonymous and forged token fail closed', async ({page,request}) => {
  await signIn(page,request,'a-sales@synthetic.invalid','incorrect-password');
  await expect(page.getByText('Credentials or identity provider not accepted.')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Authorized staff sign in'})).toBeVisible();
  await expect(page.getByText('Synthetic Lab A baseline')).toHaveCount(0);
  const anon = await request.get(base+'/api/staff/leads');
  expect(anon.status()).toBe(401);
  const forged = await request.get(base+'/api/staff/leads',{
    headers:{Authorization:'Bearer synthetic.unsigned.fake'},
  });
  expect(forged.status()).toBe(401);
  expect(await forged.text()).not.toContain('Synthetic Lab');
});
