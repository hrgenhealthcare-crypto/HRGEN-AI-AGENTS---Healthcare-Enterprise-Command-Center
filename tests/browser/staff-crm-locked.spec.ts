import { expect, test } from '@playwright/test';

test('unconfigured staff portal is visibly locked on desktop and mobile', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const response = await page.goto('/staff-crm', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Staff CRM' })).toBeVisible();
  await expect(page.getByRole('heading', {
    name: 'Staff identity provider not connected',
  })).toBeVisible();
  await expect(page.getByText(/Synthetic records only; no real client data/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);
  await expect(page.getByText(/Tenant-scoped synthetic leads/i)).toHaveCount(0);

  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  expect(robots).toContain('noindex');

  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    fullPageWidth: document.documentElement.scrollWidth,
    storageEntries: localStorage.length,
  }));
  expect(metrics.fullPageWidth).toBeLessThanOrEqual(metrics.viewport + 2);
  expect(metrics.storageEntries).toBe(0);
  expect(pageErrors).toEqual([]);
});

test('anonymous browser cannot access production staff, legacy admin or CRM APIs', async ({ request }) => {
  const cases: Array<[string, string]> = [
    ['GET', '/api/staff/session'],
    ['GET', '/api/staff/leads'],
    ['GET', '/api/settings'],
    ['GET', '/api/export/bundle'],
    ['GET', '/api/leads'],
    ['POST', '/api/agent/train'],
  ];
  for (const [method, path] of cases) {
    const response = await request.fetch(path, { method });
    expect(response.status(), path).toBe(503);
    expect(response.headers()['cache-control'], path).toBe('no-store');
    expect(response.headers()['content-type'], path).toContain('application/json');
    const body = await response.text();
    expect(body, path).not.toContain('businessLeads');
    expect(body, path).not.toContain('tenant_id');
  }
});

test('unsigned external SIP webhook is quarantined', async ({ request }) => {
  const response = await request.post('/webhook/sip/incoming', {
    data: { call_id: 'SYNTHETIC-TEST-NOT-REAL' },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ error: 'Webhook integration not released' });
});
