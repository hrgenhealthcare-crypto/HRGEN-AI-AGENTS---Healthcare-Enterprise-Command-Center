/**
 * Temporary backend-to-backend safety gate for HRGen's in-memory CRM endpoints.
 *
 * Fail closed when the secret is not configured. This is NOT user login,
 * multi-tenant authorization, or a replacement for an authenticated CRM.
 * Do not expose HRGEN_INTERNAL_API_TOKEN to client-side code/VITE_* env vars.
 */
import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

const HEADER_NAME = 'x-hrgen-internal-key';
const MINIMUM_SECRET_BYTES = 32;

export const requireInternalApiKey: RequestHandler = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');

  const configured = process.env.HRGEN_INTERNAL_API_TOKEN;
  if (!configured || Buffer.byteLength(configured, 'utf8') < MINIMUM_SECRET_BYTES) {
    res.status(503).json({ success: false, error: 'Internal CRM API unavailable' });
    return;
  }

  const supplied = req.get(HEADER_NAME);
  if (!supplied) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const suppliedBytes = Buffer.from(supplied, 'utf8');
  const expectedBytes = Buffer.from(configured, 'utf8');
  if (suppliedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(suppliedBytes, expectedBytes)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  next();
};
