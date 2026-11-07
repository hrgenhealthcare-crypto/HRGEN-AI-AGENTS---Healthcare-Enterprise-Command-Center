/**
 * Server-verified Supabase staff identities. No user_metadata fallback.
 * This does not replace database RLS or human user provisioning.
 */
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey, type JWTPayload } from 'jose';

export type StaffRole = 'owner' | 'admin' | 'sales' | 'viewer';
export type StaffIdentity = Readonly<{ userId: string; tenantId: string; role: StaffRole }>;
export type StaffVerifier = (token: string) => Promise<StaffIdentity>;
const allowedRoles = new Set<StaffRole>(['owner', 'admin', 'sales', 'viewer']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class StaffConfigurationError extends Error {}

export function makeStaffVerifier(keys: JWTVerifyGetKey, issuer: string): StaffVerifier {
  return async (token: string) => {
    const { payload } = await jwtVerify(token, keys, {
      issuer,
      audience: 'authenticated',
      algorithms: ['RS256', 'ES256'],
      requiredClaims: ['sub', 'exp', 'iat'],
      maxTokenAge: '2h',
      clockTolerance: '10s',
    });
    const appData = payload.app_metadata as Record<string, unknown> | undefined;
    const tenantId = appData?.tenant_id;
    const role = appData?.hrgen_role;
    if (!uuidPattern.test(payload.sub || '') ||
        typeof tenantId !== 'string' || !uuidPattern.test(tenantId) ||
        typeof role !== 'string' || !allowedRoles.has(role as StaffRole)) {
      throw new Error('Untrusted or incomplete staff identity');
    }
    return { userId: payload.sub!, tenantId, role: role as StaffRole };
  };
}

/**
 * Missing config is intentional: staff CRM endpoints must be unavailable.
 * Supabase must be configured with asymmetric JWT signing / project JWKS.
 */
export function staffVerifierFromEnvironment(): StaffVerifier | null {
  const configured = process.env.SUPABASE_URL;
  if (!configured) return null;
  let base: URL;
  try { base = new URL(configured); }
  catch { throw new StaffConfigurationError('Invalid server Supabase URL'); }
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash ||
      (base.pathname !== '/' && base.pathname !== '')) {
    throw new StaffConfigurationError('Supabase URL must be an HTTPS origin');
  }
  const origin = base.origin;
  const jwks = createRemoteJWKSet(new URL(origin + '/auth/v1/.well-known/jwks.json'));
  return makeStaffVerifier(jwks, origin + '/auth/v1');
}
