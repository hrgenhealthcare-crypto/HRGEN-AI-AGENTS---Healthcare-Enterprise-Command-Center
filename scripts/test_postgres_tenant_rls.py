#!/usr/bin/env python3
"""PostgreSQL RLS acceptance on an isolated CI database, with only synthetic data.

IMPORTANT: auth.jwt() and auth.role() are minimal test doubles backed by
PostgreSQL GUCs. This validates SQL policies and FK constraints; it does NOT
prove real Supabase Auth signature verification, token privilege, or deployment.
Never run against a user/prod database.
"""
import json
import os
from pathlib import Path

import psycopg
from psycopg import errors

BASE = Path("supabase/migrations")
A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
POD_A = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa"
POD_B = "bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb"
LEAD_A = "aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa"
LEAD_B = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb"
TABLES = [
    "tenants", "agent_configs", "leads_crm",
    "agent_performance_logs", "prompt_evolution_logs",
    "llm_fallback_audit_logs",
]

def check(condition, label):
    if not condition:
        raise AssertionError(label)
    print("PASS", label, flush=True)

def main():
    dbname = os.environ.get("PGDATABASE")
    if dbname != "hrgen_rls_ci":
        raise RuntimeError("Refusing to run: requires disposable PGDATABASE=hrgen_rls_ci")
    with psycopg.connect(autocommit=True) as conn:
        with conn.cursor() as c:
            c.execute("CREATE SCHEMA IF NOT EXISTS auth")
            c.execute("""
              DO $$
              BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
                  CREATE ROLE authenticated NOLOGIN;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
                  CREATE ROLE service_role NOLOGIN BYPASSRLS;
                END IF;
              END $$;
            """)
            c.execute("""
              CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
              LANGUAGE sql STABLE AS $$
                SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb
              $$;
            """)
            c.execute("""
              CREATE OR REPLACE FUNCTION auth.role() RETURNS text
              LANGUAGE sql STABLE AS $$
                SELECT NULLIF(current_setting('request.jwt.claim.role', true), '')
              $$;
            """)
            # Apply exact ordered repository SQL on a clean ephemeral database.
            for file in [
                "20261024000001_multi_tenant_schema.sql",
                "20261105000001_trusted_tenant_claim.sql",
                "20261108000001_audit_rls_and_tenant_pod_fks.sql",
            ]:
                sql = (BASE / file).read_text(encoding="utf-8")
                c.execute(sql)
                print("MIGRATION PASS", file, flush=True)

            c.execute("GRANT USAGE ON SCHEMA auth, public TO authenticated")
            for table in TABLES:
                c.execute(
                    "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."
                    + table + " TO authenticated"
                )
            # Note: these grants are only for isolated CI, not a production
            # privilege grant recommendation. RLS supplies the test boundary.

            for t,label in [(A,"A"),(B,"B")]:
                c.execute(
                    "INSERT INTO public.tenants (id,business_name,contact_email) "
                    "VALUES (%s,%s,%s)",
                    (t,"Synthetic Lab "+label,"demo"+label+"@example.invalid"),
                )
            for tid,pid,label in [(A,POD_A,"A"),(B,POD_B,"B")]:
                c.execute("""
                  INSERT INTO public.agent_configs
                    (id,tenant_id,pod_slug,name,title,pod_role,system_prompt,greeting)
                  VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """,(pid,tid,"synthetic-pod-"+label,
                      "Demo "+label,"Synthetic agent","test",
                      "Synthetic instructions","Hello"))
            for tid,lid,label in [(A,LEAD_A,"A"),(B,LEAD_B,"B")]:
                c.execute("""
                  INSERT INTO public.leads_crm
                    (id,tenant_id,assigned_pod_id,lead_name,phone,service_of_interest)
                  VALUES (%s,%s,%s,%s,%s,%s)
                """, (lid,tid,POD_A if label=="A" else POD_B,
                      "Synthetic Lead "+label,"0000000000","DEMO ONLY"))
            for tid,pid,label in [(A,POD_A,"A"),(B,POD_B,"B")]:
                c.execute("""
                  INSERT INTO public.agent_performance_logs
                    (tenant_id,pod_id,session_id,transcript_messages)
                  VALUES (%s,%s,%s,'[]'::jsonb)
                """,(tid,pid,"SYNTHETIC-"+label))
                c.execute("""
                  INSERT INTO public.prompt_evolution_logs
                    (tenant_id,pod_id,version,previous_prompt,evolved_prompt,reasoning)
                  VALUES (%s,%s,1,'SYNTHETIC','SYNTHETIC','synthetic testing')
                """,(tid,pid))
            for tid,label in [(A,"A"),(B,"B"),(None,"NO-TENANT")]:
                c.execute("""
                  INSERT INTO public.llm_fallback_audit_logs
                    (tenant_id,pod_id,user_transcript,spoken_text,
                     word_count,selected_tier,selected_provider,selected_model,
                     total_latency_ms)
                  VALUES (%s,%s,'SYNTHETIC','SYNTHETIC',1,0,'mock','mock',1)
                """,(tid,"synthetic-"+label))

            # Confirm every table with caller/customer information uses RLS.
            c.execute("""
              SELECT relname, relrowsecurity FROM pg_class
              WHERE relnamespace='public'::regnamespace
              AND relname = ANY(%s)
            """,(TABLES,))
            status=dict(c.fetchall())
            check(len(status)==len(TABLES) and all(status.values()),
                  "all six tenant/data tables have RLS enabled")

            c.execute("""
              SELECT conname, convalidated FROM pg_constraint
              WHERE conname IN (
                'fk_leads_crm_tenant_assigned_pod',
                'fk_agent_performance_tenant_pod',
                'fk_prompt_evolution_tenant_pod')
            """)
            fk_status=dict(c.fetchall())
            check(len(fk_status)==3 and not any(fk_status.values()),
                  "three tenant-scoped pod FKs enforce new writes; historic rows NOT VALID")

            # Assume a token already verified by Supabase and handed to Postgres
            # under role authenticated. Include malicious client-editable metadata.
            def claims(*, tenant=None, editable=B):
                return json.dumps({
                  "role":"authenticated",
                  "app_metadata":({"tenant_id":tenant} if tenant else {}),
                  "user_metadata":{"tenant_id":editable,"role":"service_role"},
                })
            def identity(tenant=None, editable=B):
                c.execute("SELECT set_config('request.jwt.claims', %s, false)",
                          (claims(tenant=tenant,editable=editable),))
                c.execute(
                    "SELECT set_config('request.jwt.claim.role','authenticated',false)"
                )

            c.execute("SET ROLE authenticated")
            identity(A,B)
            c.execute("SELECT public.current_tenant_id()")
            check(str(c.fetchone()[0])==A,
                  "trusted app_metadata A overrides attacker user_metadata B")

            for table in TABLES:
                column = "id" if table=="tenants" else "tenant_id"
                c.execute("SELECT DISTINCT "+column+"::text FROM public."+table)
                found={r[0] for r in c.fetchall()}
                check(found=={A}, "tenant A sees only its own "+table)

            c.execute(
                "UPDATE public.leads_crm SET stage='won' WHERE id=%s", (LEAD_B,))
            check(c.rowcount==0, "tenant A cannot UPDATE B's lead")
            c.execute("DELETE FROM public.leads_crm WHERE id=%s", (LEAD_B,))
            check(c.rowcount==0, "tenant A cannot DELETE B's lead")
            c.execute("""
                UPDATE public.llm_fallback_audit_logs SET selected_tier=4
                WHERE tenant_id=%s
            """, (B,))
            check(c.rowcount==0, "tenant A cannot UPDATE B's transcript log")
            c.execute("""
                DELETE FROM public.llm_fallback_audit_logs WHERE tenant_id=%s
            """,(B,))
            check(c.rowcount==0, "tenant A cannot DELETE B's transcript log")

            def blocked(sql, params, exc_type, label):
                try:
                    c.execute(sql,params)
                except exc_type:
                    check(True,label)
                else:
                    raise AssertionError(label+" (unexpectedly succeeded)")

            blocked("""
                INSERT INTO public.leads_crm
                  (tenant_id, lead_name, phone, service_of_interest)
                VALUES (%s,'CROSS-TENANT','0000000','synthetic')
            """,(B,),errors.InsufficientPrivilege,
            "tenant A cannot INSERT lead with tenant B id")

            blocked("""
                UPDATE public.leads_crm SET tenant_id=%s WHERE id=%s
            """,(B,LEAD_A),errors.InsufficientPrivilege,
            "tenant A cannot reassign own lead to tenant B")

            blocked("""
                INSERT INTO public.llm_fallback_audit_logs
                (tenant_id,pod_id,user_transcript,spoken_text,word_count,
                 selected_tier,selected_provider,selected_model,total_latency_ms)
                VALUES (%s,'synth','synthetic','synthetic',1,0,'mock','mock',1)
            """,(B,),errors.InsufficientPrivilege,
            "tenant A cannot INSERT transcript under tenant B")

            blocked("""
                INSERT INTO public.llm_fallback_audit_logs
                (tenant_id,pod_id,user_transcript,spoken_text,word_count,
                 selected_tier,selected_provider,selected_model,total_latency_ms)
                VALUES (NULL,'synth','synthetic','synthetic',1,0,'mock','mock',1)
            """,(),errors.InsufficientPrivilege,
            "authenticated user cannot INSERT unscoped transcript")

            blocked("""
                INSERT INTO public.leads_crm
                  (tenant_id,assigned_pod_id,lead_name,phone,service_of_interest)
                VALUES (%s,%s,'CROSS-AGENT','0000000','synthetic')
            """,(A,POD_B),errors.ForeignKeyViolation,
            "tenant A cannot attach tenant B pod to own lead")

            blocked("""
                INSERT INTO public.agent_performance_logs
                  (tenant_id,pod_id,session_id)
                VALUES (%s,%s,'SYNTHETIC-FOREIGN')
            """,(A,POD_B),errors.ForeignKeyViolation,
            "tenant A cannot write performance event for tenant B pod")

            blocked("""
                INSERT INTO public.prompt_evolution_logs
                  (tenant_id,pod_id,version,previous_prompt,evolved_prompt,reasoning)
                VALUES (%s,%s,1,'synthetic','synthetic','synthetic')
            """,(A,POD_B),errors.ForeignKeyViolation,
            "tenant A cannot write prompt evolution for tenant B pod")

            c.execute("""
                INSERT INTO public.leads_crm
                  (tenant_id,assigned_pod_id,lead_name,phone,service_of_interest)
                VALUES (%s,%s,'SYNTHETIC-OWN','0000000','synthetic')
            """,(A,POD_A))
            check(c.rowcount==1,"tenant A can INSERT own lead and own pod")
            identity(None, B)
            c.execute("SELECT count(*) FROM public.leads_crm")
            check(c.fetchone()[0]==0,
                  "no app_metadata tenant denies data even if user_metadata says B")
            c.execute("SELECT count(*) FROM public.llm_fallback_audit_logs")
            check(c.fetchone()[0]==0,
                  "missing trusted tenant denies all transcript logs")
            identity(B,A)
            c.execute("SELECT DISTINCT tenant_id::text FROM public.leads_crm")
            check({x[0] for x in c.fetchall()}=={B},
                  "tenant B sees only tenant B records")

            c.execute("RESET ROLE")
            c.execute("SELECT count(*) FROM public.leads_crm WHERE id=%s",(LEAD_B,))
            check(c.fetchone()[0]==1,"negative tests caused no B lead deletion")

    print("RLS CI PASS — local PostgreSQL policies and synthetic FK tests only.",flush=True)
    print("NOT VERIFIED — actual Supabase JWT signer, deployed database, policies, grants, or login.")

if __name__ == "__main__":
    main()
