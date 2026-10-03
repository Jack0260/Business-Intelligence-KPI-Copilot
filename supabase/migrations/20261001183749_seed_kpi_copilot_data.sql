/*
# Seed KPI Copilot Mock Data

## Overview
Populates all tables with the seed data from the mock database:
- 3 tenants (Northwind Legal, Apex Industries, Vertex Partners)
- 12 contracts across all 3 tenants
- 45 parsed clauses across all contracts
- 16 KPI definitions with trend data
- 7 active alerts
- 10 pipeline configurations

## Notes
- All inserts use ON CONFLICT DO NOTHING for idempotency
- Data matches the TypeScript mock database exactly
- This is the initial seed; new contracts added via the UI will persist to these tables
*/

-- ============================================================
-- TENANTS
-- ============================================================
INSERT INTO tenants (id, name, industry, logo_color, compliance_score) VALUES
  ('tenant-northwind', 'Northwind Legal', 'Legal Services', '#0d9488', 87),
  ('tenant-apex', 'Apex Industries', 'Manufacturing', '#b45309', 72),
  ('tenant-vertex', 'Vertex Partners', 'Management Consulting', '#475569', 94)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CONTRACTS
-- ============================================================
INSERT INTO contracts (id, tenant_id, title, type, status, counterparty, effective_date, renewal_date, contract_value, risk_level, summary, uploaded_at) VALUES
  ('contract-nw-001', 'tenant-northwind', 'Master Services Agreement — Acme Corp', 'MSA', 'Active', 'Acme Corporation', '2025-01-15', '2026-01-14', 1200000, 'medium', 'Master services agreement covering ongoing legal consulting with quarterly performance reviews and auto-renewal clause.', '2025-01-20T10:30:00Z'),
  ('contract-nw-002', 'tenant-northwind', 'Statement of Work — Data Migration Phase II', 'SOW', 'Active', 'Globex Technologies', '2025-03-01', '2025-12-31', 350000, 'low', 'SOW for data migration services with defined milestones, acceptance criteria, and fixed-fee structure.', '2025-03-05T14:00:00Z'),
  ('contract-nw-003', 'tenant-northwind', 'NDA — Initech Merger Discussions', 'NDA', 'Active', 'Initech Holdings', '2025-06-01', '2027-06-01', 0, 'high', 'Mutual non-disclosure agreement for merger discussions with 2-year confidentiality period and injunctive relief clause.', '2025-06-02T09:15:00Z'),
  ('contract-nw-004', 'tenant-northwind', 'Vendor Agreement — Cloud Infrastructure', 'Vendor Agreement', 'Expiring', 'Umbrella Cloud Services', '2024-10-01', '2025-11-30', 480000, 'critical', 'Annual cloud infrastructure vendor agreement with auto-renewal clause expiring within 60 days. High financial exposure.', '2024-10-03T11:00:00Z'),
  ('contract-ax-001', 'tenant-apex', 'Master Services Agreement — Stryker Logistics', 'MSA', 'Active', 'Stryker Logistics', '2025-02-01', '2026-01-31', 2800000, 'medium', 'Comprehensive MSA for logistics services across 3 distribution centers with performance-based pricing tiers.', '2025-02-03T08:00:00Z'),
  ('contract-ax-002', 'tenant-apex', 'Partnership Agreement — Wayne Enterprises', 'Partnership', 'Parsed', 'Wayne Enterprises', '2025-07-01', '2028-06-30', 1500000, 'low', 'Strategic partnership for joint R&D in sustainable manufacturing with revenue-sharing and IP provisions.', '2025-07-10T16:30:00Z'),
  ('contract-ax-003', 'tenant-apex', 'Vendor Agreement — Raw Materials Supply', 'Vendor Agreement', 'Active', 'Stark Materials Inc.', '2024-11-15', '2025-11-14', 2900000, 'high', 'Long-term raw materials supply agreement with price-lock provisions and force majeure clauses.', '2024-11-20T13:00:00Z'),
  ('contract-vp-001', 'tenant-vertex', 'Master Services Agreement — Hooli Tech', 'MSA', 'Active', 'Hooli Technologies', '2025-01-01', '2026-06-30', 850000, 'low', 'Consulting MSA with Hooli for digital transformation advisory with flexible engagement scope and monthly billing.', '2025-01-05T10:00:00Z'),
  ('contract-vp-002', 'tenant-vertex', 'Licensing Agreement — Pied Piper Algorithm', 'Licensing', 'Active', 'Pied Piper', '2025-04-01', '2027-03-31', 1250000, 'medium', 'Software licensing agreement for compression algorithm with per-seat pricing and source code escrow.', '2025-04-02T11:30:00Z'),
  ('contract-vp-003', 'tenant-vertex', 'NDA — Raviga Investment Round', 'NDA', 'Active', 'Raviga Capital', '2025-05-15', '2026-05-15', 0, 'low', 'One-way NDA for Series B investment discussions with standard 12-month confidentiality term.', '2025-05-16T09:00:00Z'),
  ('contract-vp-004', 'tenant-vertex', 'SOW — Market Expansion Study', 'SOW', 'Configured', 'Massive Dynamic', '2025-08-01', '2025-12-31', 420000, 'low', 'Statement of work for comprehensive market expansion analysis across 4 regions with phased deliverables.', '2025-08-03T14:00:00Z'),
  ('contract-vp-005', 'tenant-vertex', 'Vendor Agreement — Office Facilities', 'Vendor Agreement', 'Renewed', 'Wonka Facilities', '2024-09-01', '2026-08-31', 580000, 'low', 'Office facilities management vendor agreement, renewed for 2-year term with updated pricing schedule.', '2024-09-05T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CLAUSES
-- ============================================================
INSERT INTO clauses (id, contract_id, clause_type, label, value, confidence, category) VALUES
  ('c1', 'contract-nw-001', 'payment_terms', 'Payment Terms', 'Net 30', 0.95, 'financial'),
  ('c2', 'contract-nw-001', 'liability_cap', 'Liability Cap', '$500,000', 0.91, 'financial'),
  ('c3', 'contract-nw-001', 'sla_penalty', 'SLA Penalty', '2% credit per missed deadline', 0.88, 'sla'),
  ('c4', 'contract-nw-001', 'renewal', 'Renewal Terms', 'Auto-renewal, 12 months', 0.97, 'renewal'),
  ('c5', 'contract-nw-001', 'termination', 'Termination Notice', '90 days written notice', 0.93, 'compliance'),
  ('c6', 'contract-nw-002', 'payment_terms', 'Payment Terms', 'Milestone-based', 0.92, 'financial'),
  ('c7', 'contract-nw-002', 'milestone_count', 'Milestones', '5 phases', 0.96, 'velocity'),
  ('c8', 'contract-nw-002', 'sla_response', 'SLA Response Time', '4 business hours', 0.89, 'sla'),
  ('c9', 'contract-nw-002', 'acceptance', 'Acceptance Window', '10 business days', 0.94, 'compliance'),
  ('c10', 'contract-nw-003', 'confidentiality_period', 'Confidentiality Period', '24 months', 0.97, 'compliance'),
  ('c11', 'contract-nw-003', 'jurisdiction', 'Jurisdiction', 'Delaware, USA', 0.95, 'compliance'),
  ('c12', 'contract-nw-003', 'injunctive_relief', 'Injunctive Relief', 'Available for breach', 0.90, 'compliance'),
  ('c13', 'contract-nw-004', 'payment_terms', 'Payment Terms', 'Net 45', 0.94, 'financial'),
  ('c14', 'contract-nw-004', 'auto_renewal', 'Auto-Renewal', 'Yes, 12 months unless 60-day notice', 0.96, 'renewal'),
  ('c15', 'contract-nw-004', 'uptime_sla', 'Uptime SLA', '99.9%', 0.98, 'sla'),
  ('c16', 'contract-nw-004', 'penalty', 'Downtime Penalty', '10% service credit', 0.91, 'sla'),
  ('c17', 'contract-nw-004', 'data_ownership', 'Data Ownership', 'Client retains full ownership', 0.93, 'compliance'),
  ('c18', 'contract-ax-001', 'payment_terms', 'Payment Terms', 'Net 15', 0.96, 'financial'),
  ('c19', 'contract-ax-001', 'liability_cap', 'Liability Cap', '$2,000,000', 0.89, 'financial'),
  ('c20', 'contract-ax-001', 'performance_tier', 'Performance Tiers', '3 tiers, volume-based', 0.92, 'financial'),
  ('c21', 'contract-ax-001', 'sla_delivery', 'Delivery SLA', '98% on-time delivery', 0.95, 'sla'),
  ('c22', 'contract-ax-001', 'renewal', 'Renewal Terms', 'Auto-renewal, 12 months', 0.97, 'renewal'),
  ('c23', 'contract-ax-002', 'revenue_split', 'Revenue Split', '60/40 in favor of Apex', 0.91, 'financial'),
  ('c24', 'contract-ax-002', 'ip_ownership', 'IP Ownership', 'Joint, proportional contribution', 0.88, 'compliance'),
  ('c25', 'contract-ax-002', 'term', 'Partnership Term', '36 months', 0.97, 'renewal'),
  ('c26', 'contract-ax-003', 'price_lock', 'Price Lock', '18 months fixed pricing', 0.94, 'financial'),
  ('c27', 'contract-ax-003', 'volume_commitment', 'Volume Commitment', '50,000 units/quarter minimum', 0.92, 'financial'),
  ('c28', 'contract-ax-003', 'force_majeure', 'Force Majeure', 'Standard carve-outs, 30-day notice', 0.90, 'compliance'),
  ('c29', 'contract-ax-003', 'delivery_sla', 'Delivery SLA', '5 business days from order', 0.95, 'sla'),
  ('c30', 'contract-vp-001', 'payment_terms', 'Payment Terms', 'Monthly retainer + T&M', 0.95, 'financial'),
  ('c31', 'contract-vp-001', 'rate_card', 'Rate Card', '$250/hr senior, $180/hr junior', 0.93, 'financial'),
  ('c32', 'contract-vp-001', 'sla_response', 'SLA Response Time', '2 business hours', 0.96, 'sla'),
  ('c33', 'contract-vp-001', 'renewal', 'Renewal Terms', 'Auto-renewal, 18 months', 0.97, 'renewal'),
  ('c34', 'contract-vp-002', 'license_model', 'License Model', 'Per-seat, 500 seats', 0.96, 'financial'),
  ('c35', 'contract-vp-002', 'escrow', 'Source Code Escrow', 'Required, 12-month updates', 0.92, 'compliance'),
  ('c36', 'contract-vp-002', 'indemnification', 'Indemnification', 'Full IP indemnification', 0.90, 'compliance'),
  ('c37', 'contract-vp-002', 'termination', 'Termination', '60 days, material breach', 0.94, 'compliance'),
  ('c38', 'contract-vp-003', 'confidentiality_period', 'Confidentiality Period', '12 months', 0.97, 'compliance'),
  ('c39', 'contract-vp-003', 'permitted_use', 'Permitted Use', 'Evaluation only', 0.95, 'compliance'),
  ('c40', 'contract-vp-004', 'deliverables', 'Deliverables', '4 regional reports + executive summary', 0.94, 'velocity'),
  ('c41', 'contract-vp-004', 'payment_terms', 'Payment Terms', '25% advance, 75% on delivery', 0.93, 'financial'),
  ('c42', 'contract-vp-004', 'timeline', 'Timeline', '5 months, phased', 0.96, 'velocity'),
  ('c43', 'contract-vp-005', 'payment_terms', 'Payment Terms', 'Net 30', 0.96, 'financial'),
  ('c44', 'contract-vp-005', 'service_hours', 'Service Hours', '24/7 coverage', 0.98, 'sla'),
  ('c45', 'contract-vp-005', 'renewal', 'Renewal Terms', 'Renewed, 24-month term', 0.97, 'renewal')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- KPIS
-- ============================================================
INSERT INTO kpis (id, tenant_id, contract_id, name, category, description, source, target, current, unit, trend, trend_direction, alert_threshold, alert_condition) VALUES
  ('kpi-nw-001', 'tenant-northwind', 'contract-nw-001', 'Payment Timeliness', 'financial', 'Percentage of invoices paid within Net 30 terms', 'Payment Terms clause → Net 30', 95, 92, '%', ARRAY[88, 90, 89, 91, 93, 92], 'up', 85, 'below'),
  ('kpi-nw-002', 'tenant-northwind', 'contract-nw-001', 'SLA Deadline Compliance', 'sla', 'Percentage of deliverables meeting contracted deadlines', 'SLA Penalty clause → 2% credit per miss', 98, 96, '%', ARRAY[94, 95, 96, 97, 95, 96], 'flat', 90, 'below'),
  ('kpi-nw-003', 'tenant-northwind', 'contract-nw-004', 'Renewal Risk Exposure', 'renewal', 'Days until auto-renewal deadline for Umbrella Cloud contract', 'Auto-Renewal clause → 60-day notice required', 60, 42, 'days', ARRAY[90, 75, 60, 55, 48, 42], 'down', 30, 'below'),
  ('kpi-nw-004', 'tenant-northwind', 'contract-nw-004', 'Uptime Adherence', 'sla', 'Cloud infrastructure uptime vs 99.9% SLA target', 'Uptime SLA clause → 99.9%', 99.9, 99.82, '%', ARRAY[99, 99, 99, 99, 99, 99], 'down', 99.5, 'below'),
  ('kpi-nw-005', 'tenant-northwind', 'contract-nw-002', 'Milestone Velocity', 'velocity', 'Percentage of SOW milestones completed on schedule', 'Milestone clause → 5 phases', 80, 60, '%', ARRAY[20, 35, 40, 50, 55, 60], 'up', 50, 'below'),
  ('kpi-nw-006', 'tenant-northwind', 'contract-nw-003', 'Confidentiality Compliance', 'compliance', 'NDA compliance score for Initech merger discussions', 'Confidentiality Period clause → 24 months', 100, 100, '%', ARRAY[100, 100, 100, 100, 100, 100], 'flat', 95, 'below'),
  ('kpi-ax-001', 'tenant-apex', 'contract-ax-001', 'On-Time Delivery Rate', 'sla', 'Logistics delivery rate vs 98% SLA target', 'Delivery SLA clause → 98% on-time', 98, 94, '%', ARRAY[96, 95, 93, 94, 95, 94], 'down', 92, 'below'),
  ('kpi-ax-002', 'tenant-apex', 'contract-ax-001', 'Liability Exposure Ratio', 'financial', 'Liability cap as percentage of contract value', 'Liability Cap clause → $2,000,000', 50, 71, '%', ARRAY[65, 67, 68, 69, 70, 71], 'up', 80, 'above'),
  ('kpi-ax-003', 'tenant-apex', 'contract-ax-003', 'Price Lock Stability', 'financial', 'Months remaining on fixed pricing agreement', 'Price Lock clause → 18 months fixed', 18, 12, 'months', ARRAY[18, 17, 16, 15, 13, 12], 'down', 6, 'below'),
  ('kpi-ax-004', 'tenant-apex', 'contract-ax-002', 'Revenue Share Accuracy', 'financial', 'Accuracy of 60/40 revenue split calculations', 'Revenue Split clause → 60/40', 100, 98, '%', ARRAY[97, 98, 98, 99, 98, 98], 'flat', 95, 'below'),
  ('kpi-ax-005', 'tenant-apex', 'contract-ax-003', 'Volume Fulfillment Rate', 'sla', 'Quarterly volume vs 50,000 unit minimum commitment', 'Volume Commitment clause → 50K units/quarter', 100, 88, '%', ARRAY[92, 90, 89, 91, 89, 88], 'down', 85, 'below'),
  ('kpi-vp-001', 'tenant-vertex', 'contract-vp-001', 'Response Time Adherence', 'sla', 'Consulting response time vs 2-hour SLA', 'SLA Response Time clause → 2 business hours', 95, 97, '%', ARRAY[93, 94, 95, 96, 97, 97], 'up', 85, 'below'),
  ('kpi-vp-002', 'tenant-vertex', 'contract-vp-002', 'License Utilization', 'financial', 'Seats activated vs 500-seat license', 'License Model clause → 500 seats', 90, 82, '%', ARRAY[70, 74, 78, 80, 81, 82], 'up', 75, 'below'),
  ('kpi-vp-003', 'tenant-vertex', 'contract-vp-002', 'Escrow Update Compliance', 'compliance', 'Source code escrow updates on schedule', 'Escrow clause → 12-month updates', 100, 100, '%', ARRAY[100, 100, 100, 100, 100, 100], 'flat', 90, 'below'),
  ('kpi-vp-004', 'tenant-vertex', 'contract-vp-004', 'Study Phase Completion', 'velocity', 'Market expansion study phases completed', 'Timeline clause → 5 months phased', 75, 25, '%', ARRAY[0, 5, 10, 15, 20, 25], 'up', 50, 'below'),
  ('kpi-vp-005', 'tenant-vertex', 'contract-vp-005', 'Facilities SLA Score', 'sla', '24/7 facilities coverage compliance score', 'Service Hours clause → 24/7 coverage', 99, 99, '%', ARRAY[99, 99, 99, 99, 99, 99], 'up', 95, 'below')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ALERTS
-- ============================================================
INSERT INTO alerts (id, tenant_id, contract_id, contract_title, severity, message, category, created_at) VALUES
  ('alert-001', 'tenant-northwind', 'contract-nw-004', 'Vendor Agreement — Cloud Infrastructure', 'critical', 'Auto-renewal deadline in 42 days — 60-day notice required to cancel', 'renewal', '2025-09-28T08:00:00Z'),
  ('alert-002', 'tenant-northwind', 'contract-nw-004', 'Vendor Agreement — Cloud Infrastructure', 'warning', 'Uptime at 99.82% — below 99.9% SLA target for 2 consecutive periods', 'sla', '2025-09-25T10:00:00Z'),
  ('alert-003', 'tenant-northwind', 'contract-nw-001', 'Master Services Agreement — Acme Corp', 'info', 'Payment timeliness at 92% — approaching alert threshold of 85%', 'financial', '2025-09-20T14:00:00Z'),
  ('alert-004', 'tenant-apex', 'contract-ax-001', 'Master Services Agreement — Stryker Logistics', 'warning', 'On-time delivery rate at 94% — below 98% SLA target', 'sla', '2025-09-22T09:00:00Z'),
  ('alert-005', 'tenant-apex', 'contract-ax-001', 'Master Services Agreement — Stryker Logistics', 'warning', 'Liability exposure ratio at 71% — approaching 80% alert threshold', 'financial', '2025-09-18T11:00:00Z'),
  ('alert-006', 'tenant-apex', 'contract-ax-003', 'Vendor Agreement — Raw Materials Supply', 'critical', 'Volume fulfillment at 88% — nearing 85% alert threshold', 'sla', '2025-09-24T16:00:00Z'),
  ('alert-007', 'tenant-vertex', 'contract-vp-002', 'Licensing Agreement — Pied Piper Algorithm', 'info', 'License utilization at 82% — 90% target not yet met', 'financial', '2025-09-15T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PIPELINE_CONFIGS
-- ============================================================
INSERT INTO pipeline_configs (id, tenant_id, contract_id, kpi_ids, auto_renewal_tracking, sla_monitoring, financial_exposure_tracking, compliance_audit, alerting_enabled) VALUES
  ('pc-nw-001', 'tenant-northwind', 'contract-nw-001', ARRAY['kpi-nw-001', 'kpi-nw-002'], true, true, true, true, true),
  ('pc-nw-002', 'tenant-northwind', 'contract-nw-002', ARRAY['kpi-nw-005'], false, true, true, false, true),
  ('pc-nw-003', 'tenant-northwind', 'contract-nw-003', ARRAY['kpi-nw-006'], false, false, false, true, true),
  ('pc-nw-004', 'tenant-northwind', 'contract-nw-004', ARRAY['kpi-nw-003', 'kpi-nw-004'], true, true, true, true, true),
  ('pc-ax-001', 'tenant-apex', 'contract-ax-001', ARRAY['kpi-ax-001', 'kpi-ax-002'], true, true, true, false, true),
  ('pc-ax-003', 'tenant-apex', 'contract-ax-003', ARRAY['kpi-ax-003', 'kpi-ax-005'], true, true, true, true, true),
  ('pc-vp-001', 'tenant-vertex', 'contract-vp-001', ARRAY['kpi-vp-001'], true, true, false, false, true),
  ('pc-vp-002', 'tenant-vertex', 'contract-vp-002', ARRAY['kpi-vp-002', 'kpi-vp-003'], false, false, true, true, true),
  ('pc-vp-004', 'tenant-vertex', 'contract-vp-004', ARRAY['kpi-vp-004'], false, false, true, false, true),
  ('pc-vp-005', 'tenant-vertex', 'contract-vp-005', ARRAY['kpi-vp-005'], true, true, false, false, true)
ON CONFLICT (id) DO NOTHING;
