/*
# Create Dynamic Client-Contract KPI Copilot Database Schema

## Overview
Creates the complete multi-tenant database schema for the KPI Copilot BI platform.
This is a no-auth application (no sign-in screen), so all data is intentionally
shared/public and policies use `TO anon, authenticated` with `USING (true)`.

## New Tables

1. **tenants** — Multi-tenant organizations (Northwind Legal, Apex Industries, Vertex Partners)
   - `id` (text, primary key — e.g. 'tenant-northwind')
   - `name` (text, not null)
   - `industry` (text)
   - `logo_color` (text — hex color for branding)
   - `compliance_score` (integer — overall compliance percentage)

2. **contracts** — Legal/business contracts belonging to tenants
   - `id` (text, primary key — e.g. 'contract-nw-001')
   - `tenant_id` (text, FK → tenants, ON DELETE CASCADE)
   - `title` (text, not null)
   - `type` (text — MSA, SOW, NDA, Vendor Agreement, Partnership, Licensing)
   - `status` (text — Ingested, Parsed, Configured, Active, Renewed, Expiring)
   - `counterparty` (text)
   - `effective_date` (date)
   - `renewal_date` (date)
   - `contract_value` (numeric, default 0)
   - `risk_level` (text — low, medium, high, critical)
   - `summary` (text)
   - `uploaded_at` (timestamptz, default now())

3. **clauses** — Individual parsed clauses extracted from contracts
   - `id` (text, primary key)
   - `contract_id` (text, FK → contracts, ON DELETE CASCADE)
   - `clause_type` (text — e.g. 'payment_terms', 'liability_cap')
   - `label` (text — display label)
   - `value` (text — extracted value)
   - `confidence` (numeric — 0.0 to 1.0)
   - `category` (text — financial, compliance, sla, renewal, velocity)

4. **kpis** — Key Performance Indicator definitions per contract/tenant
   - `id` (text, primary key — e.g. 'kpi-nw-001')
   - `tenant_id` (text, FK → tenants)
   - `contract_id` (text, FK → contracts, ON DELETE CASCADE)
   - `name` (text, not null)
   - `category` (text — financial, compliance, sla, renewal, velocity)
   - `description` (text)
   - `source` (text — which clause this KPI is derived from)
   - `target` (numeric)
   - `current` (numeric)
   - `unit` (text — '%', 'days', 'months')
   - `trend` (integer[] — array of 6 trend values)
   - `trend_direction` (text — up, down, flat)
   - `alert_threshold` (numeric)
   - `alert_condition` (text — above, below)

5. **alerts** — Active alerts for contracts/KPIs breaching thresholds
   - `id` (text, primary key)
   - `tenant_id` (text, FK → tenants)
   - `contract_id` (text, FK → contracts, ON DELETE CASCADE)
   - `contract_title` (text — denormalized for quick display)
   - `severity` (text — info, warning, critical)
   - `message` (text, not null)
   - `category` (text)
   - `created_at` (timestamptz, default now())

6. **pipeline_configs** — Auto-generated pipeline configurations per contract
   - `id` (text, primary key — composite of tenant+contract)
   - `tenant_id` (text, FK → tenants)
   - `contract_id` (text, FK → contracts, ON DELETE CASCADE)
   - `kpi_ids` (text[] — array of KPI IDs tracked by this pipeline)
   - `auto_renewal_tracking` (boolean, default false)
   - `sla_monitoring` (boolean, default false)
   - `financial_exposure_tracking` (boolean, default false)
   - `compliance_audit` (boolean, default false)
   - `alerting_enabled` (boolean, default true)

## Security
- RLS enabled on ALL tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a no-auth app where all data is intentionally shared/public.
- 4 separate policies per table (SELECT, INSERT, UPDATE, DELETE).

## Indexes
- `contracts.tenant_id` — filter contracts by tenant
- `clauses.contract_id` — fetch clauses for a contract
- `kpis.tenant_id` — filter KPIs by tenant
- `kpis.contract_id` — fetch KPIs for a contract
- `alerts.tenant_id` — filter alerts by tenant
- `alerts.contract_id` — fetch alerts for a contract
- `pipeline_configs.tenant_id` — filter configs by tenant
- `pipeline_configs.contract_id` — fetch config for a contract
*/

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  industry text NOT NULL DEFAULT '',
  logo_color text NOT NULL DEFAULT '#0d9488',
  compliance_score integer NOT NULL DEFAULT 0
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tenants" ON tenants;
CREATE POLICY "anon_select_tenants" ON tenants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tenants" ON tenants;
CREATE POLICY "anon_insert_tenants" ON tenants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tenants" ON tenants;
CREATE POLICY "anon_update_tenants" ON tenants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tenants" ON tenants;
CREATE POLICY "anon_delete_tenants" ON tenants FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'MSA',
  status text NOT NULL DEFAULT 'Ingested',
  counterparty text NOT NULL DEFAULT '',
  effective_date date,
  renewal_date date,
  contract_value numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  summary text NOT NULL DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_contracts" ON contracts;
CREATE POLICY "anon_select_contracts" ON contracts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contracts" ON contracts;
CREATE POLICY "anon_insert_contracts" ON contracts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contracts" ON contracts;
CREATE POLICY "anon_update_contracts" ON contracts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contracts" ON contracts;
CREATE POLICY "anon_delete_contracts" ON contracts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON contracts(tenant_id);

-- ============================================================
-- CLAUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS clauses (
  id text PRIMARY KEY,
  contract_id text NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_type text NOT NULL,
  label text NOT NULL,
  value text NOT NULL DEFAULT '',
  confidence numeric NOT NULL DEFAULT 0.9,
  category text NOT NULL DEFAULT 'financial'
);

ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_clauses" ON clauses;
CREATE POLICY "anon_select_clauses" ON clauses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_clauses" ON clauses;
CREATE POLICY "anon_insert_clauses" ON clauses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_clauses" ON clauses;
CREATE POLICY "anon_update_clauses" ON clauses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_clauses" ON clauses;
CREATE POLICY "anon_delete_clauses" ON clauses FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_clauses_contract_id ON clauses(contract_id);

-- ============================================================
-- KPIS
-- ============================================================
CREATE TABLE IF NOT EXISTS kpis (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id text NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'financial',
  description text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  target numeric NOT NULL DEFAULT 100,
  current numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '%',
  trend integer[] NOT NULL DEFAULT '{}',
  trend_direction text NOT NULL DEFAULT 'flat',
  alert_threshold numeric NOT NULL DEFAULT 0,
  alert_condition text NOT NULL DEFAULT 'below'
);

ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kpis" ON kpis;
CREATE POLICY "anon_select_kpis" ON kpis FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_kpis" ON kpis;
CREATE POLICY "anon_insert_kpis" ON kpis FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_kpis" ON kpis;
CREATE POLICY "anon_update_kpis" ON kpis FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_kpis" ON kpis;
CREATE POLICY "anon_delete_kpis" ON kpis FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_kpis_tenant_id ON kpis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpis_contract_id ON kpis(contract_id);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id text NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  contract_title text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  category text NOT NULL DEFAULT 'financial',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alerts;
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alerts" ON alerts;
CREATE POLICY "anon_update_alerts" ON alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alerts;
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_contract_id ON alerts(contract_id);

-- ============================================================
-- PIPELINE_CONFIGS
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_configs (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id text NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  kpi_ids text[] NOT NULL DEFAULT '{}',
  auto_renewal_tracking boolean NOT NULL DEFAULT false,
  sla_monitoring boolean NOT NULL DEFAULT false,
  financial_exposure_tracking boolean NOT NULL DEFAULT false,
  compliance_audit boolean NOT NULL DEFAULT false,
  alerting_enabled boolean NOT NULL DEFAULT true
);

ALTER TABLE pipeline_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pipeline_configs" ON pipeline_configs;
CREATE POLICY "anon_select_pipeline_configs" ON pipeline_configs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pipeline_configs" ON pipeline_configs;
CREATE POLICY "anon_insert_pipeline_configs" ON pipeline_configs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pipeline_configs" ON pipeline_configs;
CREATE POLICY "anon_update_pipeline_configs" ON pipeline_configs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pipeline_configs" ON pipeline_configs;
CREATE POLICY "anon_delete_pipeline_configs" ON pipeline_configs FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_pipeline_configs_tenant_id ON pipeline_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_configs_contract_id ON pipeline_configs(contract_id);
