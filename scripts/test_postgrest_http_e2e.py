#!/usr/bin/env python3
"""PostgREST v16 signed HTTP tests on disposable postgres/role fixtures.

NOT actual Supabase Cloud. No real keys, real accounts or customers.
setup: only creates synthetic PostgreSQL CI API role and resets fixture grants.
test: sends JWT HTTP requests to actual PostgREST and checks RLS behavior.
"""
import base64
import hashlib
import hmac
import json
import os
import sys
import time
from urllib import error, request

import psycopg

A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
USER_A = "11111111-1111-4111-8111-111111111111"
USER_B = "22222222-2222-4222-8222-222222222222"
LEAD_B = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb"
BASE_URL = "http://127.0.0.1:3011"
SECRET = "synthetic-postgrest-hs256-ci-secret-only-2026-11"
PASS = "synthetic-authenticator-postgrest-ci"
count = 0

def check(ok, desc):
    global count
    if not ok:
        raise AssertionError(desc)
    count += 1
    print("PASS", desc, flush=True)

def database():
    if os.environ.get("PGDATABASE") != "hrgen_rls_ci":
        raise RuntimeError("Refusing non-disposable PostgreSQL database")
    return psycopg.connect(autocommit=True, connect_timeout=8)

def setup():
    with database() as db:
        with db.cursor() as c:
            c.execute("""
               DO $$
               BEGIN
                 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticator') THEN
                   CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD 'synthetic-authenticator-postgrest-ci';
                 END IF;
               END $$;
            """)
            c.execute("GRANT anon, authenticated TO authenticator")
            c.execute("GRANT USAGE ON SCHEMA public TO anon")
            c.execute("""
               UPDATE public.staff_memberships SET tenant_id=%s,role='admin',active=true
                WHERE user_id=%s
            """, (A,USER_A))
            c.execute("""
               UPDATE public.staff_memberships SET tenant_id=%s,role='viewer',active=true
                WHERE user_id=%s
            """, (B,USER_B))
            check(True, "PostgREST authenticator + synthetic grants configured")
            c.execute("NOTIFY pgrst, 'reload schema'")
    print("Synthetic HTTP role setup PASS", flush=True)

def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def token(user_id, tenant, role, *, exp_delta=3600, spoof=B, key=SECRET):
    now=int(time.time())
    h={"alg":"HS256","typ":"JWT"}
    claims={
        "sub":user_id, "role":"authenticated", "aud":"authenticated",
        "iat":now-3,"exp":now+exp_delta,
        "app_metadata":{"tenant_id":tenant,"hrgen_role":role},
        "user_metadata":{"tenant_id":spoof,"hrgen_role":"owner"},
    }
    body=b64(json.dumps(h,separators=(",",":")).encode())+"."+b64(
        json.dumps(claims,separators=(",",":")).encode())
    signature=hmac.new(key.encode(),body.encode(),hashlib.sha256).digest()
    return body+"."+b64(signature)

def http(method, path, jwt=None, data=None):
    headers={"Accept":"application/json", "Prefer":"return=representation"}
    if jwt:
        headers["Authorization"]="Bearer "+jwt
    body=None
    if data is not None:
        body=json.dumps(data).encode("utf-8")
        headers["Content-Type"]="application/json"
    req=request.Request(BASE_URL+path, headers=headers, data=body, method=method)
    try:
        with request.urlopen(req,timeout=8) as resp:
            raw=resp.read()
            return resp.status, json.loads(raw.decode()) if raw else None
    except error.HTTPError as e:
        raw=e.read()
        try: payload=json.loads(raw.decode()) if raw else {}
        except ValueError: payload={"invalid":"unparseable error"}
        return e.code,payload

def require_http(status, expected, label):
    check(status in expected, label+f" (status={status}, expected={expected})")

def test():
    jwtA=token(USER_A,A,"admin")
    jwtB=token(USER_B,B,"viewer",spoof=A)

    # Real JWT authentication and SQL authorization by PostgREST.
    code, rows=http("GET","/leads_crm?select=id,tenant_id,lead_name",jwtA)
    require_http(code,{200},"signed tenant A GET allowed")
    check(isinstance(rows,list) and len(rows)>=1 and
          all(r["tenant_id"]==A for r in rows),
          "tenant A REST SELECT filters out B even with user_metadata B")

    code, rows=http("GET","/leads_crm?select=id,tenant_id,lead_name",jwtB)
    require_http(code,{200},"signed viewer tenant B GET allowed")
    check(isinstance(rows,list) and len(rows)>=1 and
          all(r["tenant_id"]==B for r in rows),
          "tenant B REST SELECT filters out A even with user_metadata A")

    code,_=http("POST","/leads_crm",jwtA,{
        "tenant_id":B,"lead_name":"CROSS-TENANT-BAD",
        "phone":"0000000","service_of_interest":"synthetic",
    })
    require_http(code,{401,403},"tenant A cannot create B lead over REST")

    code,_=http("POST","/leads_crm",jwtA,{
        "tenant_id":A,"lead_name":"SYNTHETIC-REST-OWN",
        "phone":"0000000","service_of_interest":"synthetic",
    })
    require_http(code,{200,201},"tenant A can write A lead via REST")

    code,_=http("POST","/leads_crm",jwtB,{
        "tenant_id":B,"lead_name":"VIEWER-FORBIDDEN",
        "phone":"0000000","service_of_interest":"synthetic",
    })
    require_http(code,{401,403},"viewer cannot create own-tenant lead via REST")

    code,rows=http("PATCH",f"/leads_crm?id=eq.{LEAD_B}",jwtB,{"stage":"won"})
    require_http(code,{200,204},"viewer PATCH request is denied by policy filter")
    check(rows in ([],None),"viewer PATCH cannot return modified B lead")

    code,rows=http("DELETE",f"/leads_crm?id=eq.{LEAD_B}",jwtB)
    require_http(code,{200,204},"viewer DELETE request denied by policy filter")
    check(rows in ([],None),"viewer DELETE cannot return deleted B lead")

    code,_=http("GET","/staff_memberships?select=user_id",jwtA)
    require_http(code,{401,403},"browser cannot directly read membership authority")

    code,_=http("POST","/llm_fallback_audit_logs",jwtA,{
        "tenant_id":A, "pod_id":"synth","user_transcript":"SYNTHETIC",
        "spoken_text":"SYNTHETIC","word_count":1,"selected_tier":0,
        "selected_provider":"mock","selected_model":"mock",
        "total_latency_ms":1,
    })
    require_http(code,{401,403},"admin cannot directly write immutable audit logs")

    code,_=http("GET","/leads_crm?select=id",token(USER_A,A,"admin",key=SECRET+"-forged"))
    require_http(code,{401},"forged HMAC JWT rejected")

    code,_=http("GET","/leads_crm?select=id",token(USER_A,A,"admin",exp_delta=-60))
    require_http(code,{401},"expired JWT rejected")

    code,_=http("GET","/leads_crm?select=id")
    require_http(code,{401,403},"anonymous request has no lead access")

    with database() as db:
        with db.cursor() as c:
            c.execute("SELECT stage FROM public.leads_crm WHERE id=%s",(LEAD_B,))
            check(c.fetchone()[0]!="won","viewer patch did not mutate B lead")
            c.execute("SELECT count(*) FROM public.leads_crm WHERE id=%s",(LEAD_B,))
            check(c.fetchone()[0]==1,"viewer delete did not remove B lead")

            c.execute("UPDATE public.staff_memberships SET active=false WHERE user_id=%s",(USER_A,))
    code,rows=http("GET","/leads_crm?select=id,tenant_id",jwtA)
    require_http(code,{200},"stale signed token request handled")
    check(rows==[],"deactivated staff old JWT yields zero rows from PostgREST")

    with database() as db:
        with db.cursor() as c:
            c.execute("UPDATE public.staff_memberships SET active=true, role='viewer' WHERE user_id=%s",(USER_A,))
    code,rows=http("GET","/leads_crm?select=id",jwtA)
    require_http(code,{200},"stale role-changed JWT handled")
    check(rows==[],"demoted staff old JWT yields zero rows")

    with database() as db:
        with db.cursor() as c:
            c.execute("UPDATE public.staff_memberships SET role='admin', tenant_id=%s WHERE user_id=%s",(B,USER_A))
    code,rows=http("GET","/leads_crm?select=id",jwtA)
    require_http(code,{200},"stale tenant-transferred JWT handled")
    check(rows==[],"transferred staff old JWT yields zero rows")

    print(f"POSTGREST HTTP CI PASS: {count} signed/authz assertions; isolated only",flush=True)
    print("NOT SUPABASE CLOUD — real GoTrue JWT, secret key custody and deployed RLS NOT verified.")

if __name__=="__main__":
    if len(sys.argv)!=2 or sys.argv[1] not in ("setup","test"):
        raise SystemExit("Usage: test_postgrest_http_e2e.py setup|test")
    if sys.argv[1]=="setup": setup()
    else: test()
