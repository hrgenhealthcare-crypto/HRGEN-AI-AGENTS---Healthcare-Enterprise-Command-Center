-- HRGen staging review: defense-in-depth for audit logs and tenant-owned pod references.
-- FORWARD-ONLY, NOT APPLIED TO ANY USER OR PRODUCTION DATABASE.
-- Preconditions before a real production rollout:
-- 1) inspect existing rows with NULL tenant_id in llm_fallback_audit_logs;
-- 2) inspect historical cross-tenant assigned_pod_id and pod_id references;
-- 3) schedule FK VALIDATE CONSTRAINT only after evidence-backed cleanup.
--
-- The base 20261024 migration enabled RLS on five tables but omitted this
-- later-created table, which can contain caller transcripts and call metadata.
ALTER TABLE public.llm_fallback_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_llm_fallback_audit_logs
  ON public.llm_fallback_audit_logs;
CREATE POLICY tenant_isolation_llm_fallback_audit_logs
  ON public.llm_fallback_audit_logs
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- A foreign key on pod_id alone allows tenant A to point at tenant B's pod.
-- Constrain references by BOTH tenant_id and pod ID. NOT VALID avoids silently
-- asserting historical records have been inspected; all new writes are checked.
CREATE UNIQUE INDEX IF NOT EXISTS ux_agent_configs_tenant_id_id
  ON public.agent_configs (tenant_id, id);

ALTER TABLE public.leads_crm
  ADD CONSTRAINT fk_leads_crm_tenant_assigned_pod
  FOREIGN KEY (tenant_id, assigned_pod_id)
  REFERENCES public.agent_configs (tenant_id, id) NOT VALID;

ALTER TABLE public.agent_performance_logs
  ADD CONSTRAINT fk_agent_performance_tenant_pod
  FOREIGN KEY (tenant_id, pod_id)
  REFERENCES public.agent_configs (tenant_id, id) NOT VALID;

ALTER TABLE public.prompt_evolution_logs
  ADD CONSTRAINT fk_prompt_evolution_tenant_pod
  FOREIGN KEY (tenant_id, pod_id)
  REFERENCES public.agent_configs (tenant_id, id) NOT VALID;
