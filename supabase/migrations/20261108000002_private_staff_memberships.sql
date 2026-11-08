-- HRGen private staging staff membership authority.
-- DRAFT ONLY; DO NOT APPLY TO LIVE/PRODUCTION WITHOUT APPROVED MIGRATION PLAN.
--
-- Staff row is written ONLY by an approved administrative provisioning process.
-- Browser users (anon/authenticated) cannot SELECT or mutate membership grants.
-- A server-only Supabase secret key (service_role) may SELECT current grants.
-- Existing JWT app_metadata is compared to this live authoritative grant every
-- time. A user_id maps to exactly one tenant for this staging implementation.
-- Future cross-tenant HRGen super-admin design needs separate approval.

CREATE TABLE IF NOT EXISTS public.staff_memberships (
  user_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner','admin','sales','viewer')),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_memberships_tenant
  ON public.staff_memberships (tenant_id);

-- Explicit grants and RLS together: never depend on project default grants.
ALTER TABLE public.staff_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_memberships FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.staff_memberships
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.staff_memberships TO service_role;

-- No policy for anon/authenticated. Even a stale, still-valid user JWT cannot
-- grant direct database read of the membership authority.
-- Do not allow browser-side mutations or expose a membership editing API.
