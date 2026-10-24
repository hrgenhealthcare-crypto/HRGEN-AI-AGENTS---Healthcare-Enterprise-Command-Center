-- ==============================================================================
-- UNIVERSAL AGENT PODS & MULTI-CHANNEL STUDIO
-- Multi-Tenant PostgreSQL / Supabase Production Migration Script
-- Version: 2026.10.24.0001
-- Description: Multi-tenant schemas, enums, check constraints, RLS policies,
--              automated updated_at triggers, and initial seed for 10 Pods.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE channel_type_enum AS ENUM ('voice', 'whatsapp', 'web_chat', 'omnichannel');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE voice_model_enum AS ENUM ('Kore', 'Fenrir', 'Zephyr', 'Puck', 'Aoede');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE pod_status_enum AS ENUM ('active', 'standby', 'training', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_stage_enum AS ENUM ('new', 'contacted', 'demo_scheduled', 'proposal_sent', 'won', 'lost');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE call_direction_enum AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE sentiment_enum AS ENUM ('positive', 'neutral', 'negative', 'converted');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    industry_type VARCHAR(100) NOT NULL DEFAULT 'Universal Business',
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    onboarding_date TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    billing_plan VARCHAR(50) NOT NULL DEFAULT 'enterprise_voice',
    sip_did_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4. AGENT CONFIGS TABLE (10 Pods Architecture)
CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pod_slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    pod_role VARCHAR(100) NOT NULL,
    channel_type channel_type_enum NOT NULL DEFAULT 'voice',
    voice_model voice_model_enum NOT NULL DEFAULT 'Kore',
    system_prompt TEXT NOT NULL,
    greeting TEXT NOT NULL,
    brevity_limit INT NOT NULL DEFAULT 18 CONSTRAINT check_brevity_limit CHECK (brevity_limit BETWEEN 10 AND 50),
    industry_focus VARCHAR(100) NOT NULL DEFAULT 'Universal Business',
    status pod_status_enum NOT NULL DEFAULT 'active',
    evolution_version INT NOT NULL DEFAULT 1,
    knowledge_summary TEXT,
    stats JSONB NOT NULL DEFAULT '{"interactions": 0, "satisfaction": "100%", "leads_captured": 0}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_tenant_pod_slug UNIQUE (tenant_id, pod_slug)
);

-- 5. LEADS CRM TABLE
CREATE TABLE IF NOT EXISTS leads_crm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_pod_id UUID REFERENCES agent_configs(id) ON DELETE SET NULL,
    lead_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255),
    industry VARCHAR(100) DEFAULT 'Universal Business',
    service_of_interest VARCHAR(255) NOT NULL,
    stage lead_stage_enum NOT NULL DEFAULT 'new',
    estimated_value_inr NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    source VARCHAR(50) NOT NULL DEFAULT 'voice_agent',
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 6. AGENT PERFORMANCE LOGS TABLE (Zero-Pill Granular Tracking)
CREATE TABLE IF NOT EXISTS agent_performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    caller_phone VARCHAR(50),
    caller_name VARCHAR(255),
    direction call_direction_enum NOT NULL DEFAULT 'inbound',
    duration_seconds INT NOT NULL DEFAULT 0,
    sentiment sentiment_enum NOT NULL DEFAULT 'neutral',
    total_turns INT NOT NULL DEFAULT 0,
    avg_latency_ms INT NOT NULL DEFAULT 135,
    avg_words_per_turn INT NOT NULL DEFAULT 16,
    voip_cost_inr NUMERIC(8, 4) NOT NULL DEFAULT 0.2700,
    manager_handover BOOLEAN NOT NULL DEFAULT FALSE,
    lead_captured BOOLEAN NOT NULL DEFAULT FALSE,
    transcript_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 7. PROMPT EVOLUTION AUDIT LOGS (Victor/Hermes Engine)
CREATE TABLE IF NOT EXISTS prompt_evolution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
    version INT NOT NULL,
    previous_prompt TEXT NOT NULL,
    evolved_prompt TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    optimizations JSONB NOT NULL DEFAULT '[]'::jsonb,
    performance_score INT NOT NULL DEFAULT 98,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_configs_tenant ON agent_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_role ON agent_configs(pod_role);
CREATE INDEX IF NOT EXISTS idx_leads_crm_tenant ON leads_crm(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_crm_stage ON leads_crm(stage);
CREATE INDEX IF NOT EXISTS idx_perf_logs_tenant ON agent_performance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perf_logs_pod ON agent_performance_logs(pod_id);
CREATE INDEX IF NOT EXISTS idx_perf_logs_session ON agent_performance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_perf_logs_created ON agent_performance_logs(created_at DESC);

-- 9. AUTOMATIC TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_agent_configs_updated_at ON agent_configs;
CREATE TRIGGER trg_agent_configs_updated_at
BEFORE UPDATE ON agent_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_leads_crm_updated_at ON leads_crm;
CREATE TRIGGER trg_leads_crm_updated_at
BEFORE UPDATE ON leads_crm
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 10. ROW-LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenant Isolation using Supabase Auth JWT Tenant Claims
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_evolution_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Extract current user tenant ID from JWT claims
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(
        COALESCE(
            auth.jwt() -> 'app_metadata' ->> 'tenant_id',
            auth.jwt() -> 'user_metadata' ->> 'tenant_id'
        ),
        ''
    )::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Tenants RLS
DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
CREATE POLICY tenant_isolation_tenants ON tenants
    FOR ALL
    USING (id = current_tenant_id() OR auth.role() = 'service_role')
    WITH CHECK (id = current_tenant_id() OR auth.role() = 'service_role');

-- Agent Configs RLS
DROP POLICY IF EXISTS tenant_isolation_agent_configs ON agent_configs;
CREATE POLICY tenant_isolation_agent_configs ON agent_configs
    FOR ALL
    USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
    WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- Leads CRM RLS
DROP POLICY IF EXISTS tenant_isolation_leads_crm ON leads_crm;
CREATE POLICY tenant_isolation_leads_crm ON leads_crm
    FOR ALL
    USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
    WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- Agent Performance Logs RLS
DROP POLICY IF EXISTS tenant_isolation_agent_performance_logs ON agent_performance_logs;
CREATE POLICY tenant_isolation_agent_performance_logs ON agent_performance_logs
    FOR ALL
    USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
    WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- Prompt Evolution Logs RLS
DROP POLICY IF EXISTS tenant_isolation_prompt_evolution_logs ON prompt_evolution_logs;
CREATE POLICY tenant_isolation_prompt_evolution_logs ON prompt_evolution_logs
    FOR ALL
    USING (tenant_id = current_tenant_id() OR auth.role() = 'service_role')
    WITH CHECK (tenant_id = current_tenant_id() OR auth.role() = 'service_role');

-- ==============================================================================
-- 11. DEFAULT SEED FOR THE 10 AUTONOMOUS AGENT PODS (Template Generator)
-- Callable per new tenant onboarding
-- ==============================================================================

CREATE OR REPLACE FUNCTION seed_default_agent_pods_for_tenant(target_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO agent_configs (
        tenant_id, pod_slug, name, title, pod_role, channel_type, voice_model, 
        system_prompt, greeting, brevity_limit, industry_focus, knowledge_summary
    ) VALUES
    (
        target_tenant_id,
        'ritu-verma',
        'Dr. Ritu Verma',
        'Senior Inbound Receptionist Pod',
        'Inbound Receptionist Pod',
        'voice',
        'Kore',
        'You are Dr. Ritu Verma, an ultra-fast, human-like Enterprise Voice Inbound Receptionist running on a low-cost, high-efficiency pipeline (<200ms processing). Tone: Warm, welcoming, professional Indian-English or Hindi. CRITICAL: Keep responses strictly under 18 words. Zero medical/clinical advice. Role: Collect caller Name, Phone, and preferred Appointment time. If asked for out-of-scope details, say: "Let me check this with the manager, please hold while I transfer your call."',
        'Hello! Thank you for calling HRGEN Enterprise. How may I assist your booking or appointment today?',
        18,
        'Universal Business',
        'Handles inbound enterprise inquiries, appointment calendars, pricing quotes, and manager hold routing.'
    ),
    (
        target_tenant_id,
        'rahul-sharma',
        'Rahul Sharma',
        'High-Velocity Outbound Closer Pod',
        'Outbound Sales Closer Pod',
        'voice',
        'Fenrir',
        'You are Rahul Sharma, an ultra-fast Outbound Sales Closer (<200ms pipeline). Tone: Energetic, highly persuasive, concise. CRITICAL: Responses under 16 words. State the call purpose immediately. Overcome hesitation and drive toward scheduling an executive demo or sending a direct payment link. If technical questions arise, say: "Let me connect you with our technical director, please hold for 5 seconds."',
        'Hi! I am Rahul from HRGEN regarding the inquiry you submitted on our website. Do you have 2 quick minutes to talk?',
        16,
        'Agency & Digital Services',
        'Rapid lead follow-up, pitch presentation, objection handling, demo scheduling, instant payment links.'
    ),
    (
        target_tenant_id,
        'sophia-cloud',
        'Sophia Cloud Bot',
        'WhatsApp Business Commerce Bot',
        'WhatsApp Business Bot',
        'whatsapp',
        'Aoede',
        'You are Sophia, an automated WhatsApp Business Commerce Agent operating the multi-tenant interactive chat workspace. Tone: Concise, responsive, structured with clean bullet points and WhatsApp action buttons. Role: Automate template-driven scheduling alerts, deliver instant billing documents, and escalate to voice call on demand.',
        'Welcome to HRGEN WhatsApp Suite! How may I assist your business inquiry today?',
        30,
        'Universal Business',
        'Automated 24/7 WhatsApp messaging, instant billing PDFs, UPI links, catalog dispatch.'
    ),
    (
        target_tenant_id,
        'lucas-growth',
        'Lucas Growth Engine',
        'Conversational SEO/GEO/AEO Optimizer',
        'SEO/GEO/AEO Optimizer',
        'omnichannel',
        'Zephyr',
        'You are Lucas Growth Engine, an Autonomous Conversational SEO/GEO/AEO Optimizer. Role: Deploy structured JSON-LD Schema markup, craft citation prompts for ChatGPT and Perplexity AI answer engines, and optimize local Google map packs. Tone: Analytical, authoritative, growth-oriented.',
        'Lucas here. Ready to deploy Generative Engine Optimization layers for ChatGPT, Perplexity, and Google Search.',
        25,
        'Agency & Digital Services',
        'Schema.org JSON-LD generation, Perplexity answer citations, generative engine discovery.'
    ),
    (
        target_tenant_id,
        'swarn-agent',
        'Swarn Agent',
        'Financial Leakage Auditor Pod',
        'Financial Leakage Auditor Pod',
        'omnichannel',
        'Puck',
        'You are Swarn Agent, an Autonomous Financial Leakage Auditor Pod. Role: Run scheduled backend audits on marketing ad spend, filter out non-converting keywords, evaluate live agent conversation KPIs, and detect revenue leakage. Tone: Objective, financially meticulous, data-driven.',
        'Swarn Audit Engine active. Monitoring ad spend leakage, keyword waste, and live conversation KPIs.',
        22,
        'Universal Business',
        'Automated ROI tracking, negative keyword shield, cost per acquisition audit, revenue leakage alerts.'
    ),
    (
        target_tenant_id,
        'boat-ai',
        'Boat AI',
        'E-Commerce Operations & Inventory Pod',
        'E-Commerce Operations & Inventory Pod',
        'omnichannel',
        'Fenrir',
        'You are Boat AI, an Autonomous E-Commerce Operations & Inventory Pod. Role: Track product fulfillment queues, monitor SKU reorder thresholds, handle consumer delivery inquiries, and capture direct-to-consumer leads. Tone: Crisp, operational, accurate. Under 20 words per response.',
        'Boat AI online. Managing SKU lifecycles, fulfillment queues, and direct consumer lead capture.',
        20,
        'Retail & E-commerce',
        'Real-time inventory sync, order tracking, returns processing, warehouse dispatch queues.'
    ),
    (
        target_tenant_id,
        'social-media',
        'Social Media Marketing Agent',
        'Autonomous Organic Social Distribution Pod',
        'Social Media Marketing Agent',
        'web_chat',
        'Kore',
        'You are the Social Media Marketing Agent. Role: Craft platform-specific organic copy arrays across LinkedIn, Instagram, X, and YouTube Community, schedule content distribution, and visualize engagement KPIs. Tone: Engaging, brand-aligned, modern, creative.',
        'Social Media Agent ready. Formulating platform-specific organic copy arrays and viral scheduling pipelines.',
        35,
        'Universal Business',
        'Viral copy arrays, multi-platform publishing schedules, hashtag indexing, engagement telemetry.'
    ),
    (
        target_tenant_id,
        'google-web',
        'Google Web Agent',
        'Search Indexing Health & Crawl Engine',
        'Google Web Agent',
        'web_chat',
        'Zephyr',
        'You are the Google Web Agent. Role: Inspect indexing health states, monitor crawling errors across public web panels, verify canonical tags, and execute rapid index optimization routines. Tone: Technical, diagnostic, precise.',
        'Google Web Agent active. Inspecting crawl states, sitemap indexes, and Core Web Vitals.',
        25,
        'Universal Business',
        'Google Search Console metrics, crawl error diagnostics, robots.txt auditing, sitemap validation.'
    ),
    (
        target_tenant_id,
        'branding-agent',
        'Branding Agent',
        'Cross-Platform Brand Voice & Tone Auditor',
        'Branding Agent',
        'omnichannel',
        'Aoede',
        'You are the Branding Agent. Role: Constantly audit cross-platform copy frameworks, ad scripts, and bot greetings to verify alignment with corporate brand voice, vocabulary, and tone guidelines. Tone: Refined, brand-conscious, articulate.',
        'Branding Agent online. Auditing cross-channel copy frameworks against corporate identity standards.',
        28,
        'Universal Business',
        'Brand tone consistency checks, banned words filtering, positioning statements, identity guidelines.'
    ),
    (
        target_tenant_id,
        'graphic-designer',
        'Graphic Designer Agent',
        'Visual UI Mapping & Vector Blueprint Pod',
        'Graphic Designer Agent',
        'web_chat',
        'Puck',
        'You are the Graphic Designer Agent. Role: Generate optimized interface mapping grids, vector specifications, asset color blueprints, and visual layout guides for deployment workflows. Tone: Visual, aesthetic, design-system focused.',
        'Graphic Designer Agent ready. Generating interface mapping grids, vector specs, and color blueprints.',
        30,
        'Agency & Digital Services',
        'Tailwind CSS design token mapping, WCAG AA color palettes, icon grid specifications, SVG asset layout.'
    )
    ON CONFLICT (tenant_id, pod_slug) DO UPDATE
    SET 
        name = EXCLUDED.name,
        system_prompt = EXCLUDED.system_prompt,
        brevity_limit = EXCLUDED.brevity_limit,
        updated_at = TIMEZONE('utc', NOW());
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 9. MULTI-LLM CASCADE AUDIT LOGS & LATENCY MONITORING TABLE
-- Persists every 5-tier fallback cascade execution, timeout event, and manager escalation.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS llm_fallback_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    call_id VARCHAR(100),
    caller_id VARCHAR(100),
    pod_id VARCHAR(100) NOT NULL,
    user_transcript TEXT NOT NULL,
    spoken_text TEXT NOT NULL,
    word_count INT NOT NULL,
    within_brevity_limit BOOLEAN NOT NULL DEFAULT TRUE,
    selected_tier INT NOT NULL CHECK (selected_tier >= 0 AND selected_tier <= 5),
    selected_provider VARCHAR(100) NOT NULL,
    selected_model VARCHAR(100) NOT NULL,
    total_latency_ms INT NOT NULL,
    manager_transfer_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    hold_chime_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    tier_attempts_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    cost_inr NUMERIC(6, 4) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_llm_audit_tenant_created ON llm_fallback_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_audit_tier ON llm_fallback_audit_logs(selected_tier);
CREATE INDEX IF NOT EXISTS idx_llm_audit_escalation ON llm_fallback_audit_logs(manager_transfer_triggered) WHERE manager_transfer_triggered = TRUE;
