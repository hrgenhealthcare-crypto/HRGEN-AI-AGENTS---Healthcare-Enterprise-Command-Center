/**
 * Closed-by-default external callback quarantine.
 *
 * Provider callbacks require independently verified signatures, timestamp,
 * replay protection and provider-specific credentials BEFORE being enabled.
 * A private internal key is not a substitute for provider authentication.
 */
import type { RequestHandler } from 'express';

export const quarantineUnverifiedWebhook: RequestHandler = (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(503).json({ error: 'Webhook integration not released' });
};
