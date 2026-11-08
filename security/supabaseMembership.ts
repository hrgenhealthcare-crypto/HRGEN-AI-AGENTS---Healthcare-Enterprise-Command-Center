/**
 * Private Supabase staff membership lookup.
 *
 * Every request performs a fresh, server-only read by the verified JWT sub.
 * No cache, browser access, user_metadata fallback, privileged write endpoint,
 * or service key in VITE_* variables. This is NOT a production release approval.
 */
import { createClient } from '@supabase/supabase-js';
import {
  createStaffMembershipChecker,
  type StaffMembership,
  type StaffMembershipChecker,
  type StaffMembershipLookup,
} from './staffMembership';
import type { StaffRole } from './staffJwt';

type MembershipQueryResult = { data: unknown; error: unknown };
export type MembershipReader = (userId: string) => Promise<MembershipQueryResult>;
const roles = new Set<StaffRole>(['owner', 'admin', 'sales', 'viewer']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Can be tested with a fake query, without a key or external network. */
export function createMembershipLookup(reader: MembershipReader): StaffMembershipLookup {
  return async userId => {
    if (!uuid.test(userId)) throw new Error('Invalid verified user identifier');
    const { data, error } = await reader(userId);
    if (error) throw new Error('Authoritative membership lookup unavailable');
    if (data === null) return null;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Invalid authoritative membership response');
    }
    const row = data as Record<string, unknown>;
    if (row.user_id !== userId || typeof row.tenant_id !== 'string' ||
        !uuid.test(row.tenant_id) || typeof row.role !== 'string' ||
        !roles.has(row.role as StaffRole) || typeof row.active !== 'boolean') {
      // A malformed/ambiguous membership may never silently grant access.
      throw new Error('Invalid authoritative membership record');
    }
    const membership: StaffMembership = {
      userId, tenantId: row.tenant_id, role: row.role as StaffRole,
      active: row.active,
    };
    return membership;
  };
}

/**
 * Only a Supabase project-secret key may access the authority table.
 * Never share this client with a browser or user-session-aware auth client:
 * service keys bypass RLS and must have no user Authorization header.
 */
export function staffMembershipCheckerFromEnvironment(): StaffMembershipChecker | null {
  const origin = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!origin || !secretKey) return null;
  if (!secretKey.startsWith('sb_secret_') || secretKey.length < 40) return null;
  let endpoint: URL;
  try { endpoint = new URL(origin); }
  catch { return null; }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password ||
      endpoint.search || endpoint.hash || endpoint.pathname !== '/') return null;

  // Separate privileged server client. Never call signIn/signUp on it.
  const privileged = createClient(endpoint.origin, secretKey, {
    auth: {
      persistSession: false, autoRefreshToken: false, detectSessionInUrl: false,
    },
  });
  const lookup = createMembershipLookup(async userId => {
    const { data, error } = await privileged
      .from('staff_memberships')
      .select('user_id,tenant_id,role,active')
      .eq('user_id', userId)
      .abortSignal(AbortSignal.timeout(5000))
      .maybeSingle();
    return { data, error };
  });
  return createStaffMembershipChecker(lookup);
}
