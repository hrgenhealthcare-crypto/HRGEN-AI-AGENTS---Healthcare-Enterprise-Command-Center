import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { requireInternalApiKey } from '../security/internalApiGuard';

const previous = process.env.HRGEN_INTERNAL_API_TOKEN;
const strongSecret = 'HRGen-server-only-test-secret-0123456789-ABCDEF';

afterEach(() => {
  if (previous === undefined) {
    delete process.env.HRGEN_INTERNAL_API_TOKEN;
  } else {
    process.env.HRGEN_INTERNAL_API_TOKEN = previous;
  }
});

function invoke(secret?: string, supplied?: string) {
  if (secret === undefined) delete process.env.HRGEN_INTERNAL_API_TOKEN;
  else process.env.HRGEN_INTERNAL_API_TOKEN = secret;

  let status = 200;
  let payload: unknown = null;
  let nextCalled = false;
  const headers: Record<string, string> = {};
  const request = {
    get: (name: string) => name.toLowerCase() === 'x-hrgen-internal-key' ? supplied : undefined,
  };
  const response = {
    setHeader: (name: string, value: string) => { headers[name] = value; },
    status: (code: number) => { status = code; return response; },
    json: (value: unknown) => { payload = value; return response; },
  };
  requireInternalApiKey(request as any, response as any, () => { nextCalled = true; });
  return { status, payload, nextCalled, headers };
}

test('fails closed without server-side secret', () => {
  const result = invoke(undefined, strongSecret);
  assert.equal(result.status, 503);
  assert.equal(result.nextCalled, false);
  assert.equal(result.headers['Cache-Control'], 'no-store');
});

test('fails closed for weak server-side secret', () => {
  const result = invoke('weak', 'weak');
  assert.equal(result.status, 503);
  assert.equal(result.nextCalled, false);
});

test('rejects missing key without disclosing the configured key', () => {
  const result = invoke(strongSecret);
  assert.equal(result.status, 401);
  assert.deepEqual(result.payload, { success: false, error: 'Unauthorized' });
  assert.equal(result.nextCalled, false);
});

test('rejects invalid key with equal length', () => {
  const result = invoke(strongSecret, 'X'.repeat(Buffer.byteLength(strongSecret)));
  assert.equal(result.status, 401);
  assert.equal(result.nextCalled, false);
});

test('rejects invalid key with different length', () => {
  const result = invoke(strongSecret, 'invalid');
  assert.equal(result.status, 401);
  assert.equal(result.nextCalled, false);
});

test('accepts correct server-only key', () => {
  const result = invoke(strongSecret, strongSecret);
  assert.equal(result.status, 200);
  assert.equal(result.nextCalled, true);
  assert.equal(result.headers['Cache-Control'], 'no-store');
});
