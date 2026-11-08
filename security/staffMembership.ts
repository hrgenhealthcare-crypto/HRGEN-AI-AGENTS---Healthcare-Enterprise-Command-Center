/**
 * Live membership recheck for each authenticated staff request.
 *
 * A valid signed JWT is NOT an authorization grant on its own: staff may be
 * disabled, moved to another tenant, or assigned a different role while their
 * old token has not expired.
 *
 * Production callers MUST provide a trusted, server-only database lookup that
 * does not accept tenant or role from user_metadata or request bodies.
 * This module does not access Supabase itself or constitute a live database
 * integration. Missing lookup must remain fail-closed in staffRoutes.
 */
import type { StaffIdentity } from './staffJwt';

export type StaffMembership = Readonly<StaffIdentity & { active: boolean }>;
export type StaffMembershipLookup =
  (userId: string) => Promise<StaffMembership | null>;
export type StaffMembershipChecker =
  (signedIdentity: StaffIdentity) => Promise<boolean>;

export function createStaffMembershipChecker(
  lookup: StaffMembershipLookup,
): StaffMembershipChecker {
  return async (signedIdentity) => {
    // Never fall back to an old token's signed claims when the lookup fails.
    // An exception propagates to staffRoutes and results in fail-closed 503.
    const current = await lookup(signedIdentity.userId);
    return current?.active === true &&
      current.userId === signedIdentity.userId &&
      current.tenantId === signedIdentity.tenantId &&
      current.role === signedIdentity.role;
  };
}
