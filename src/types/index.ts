export type ThemeMode = 'light' | 'dark' | 'system';

export type ContractType = 'MSA' | 'SOW' | 'NDA' | 'Vendor Agreement' | 'Partnership' | 'Licensing';

export type ContractStatus = 'Ingested' | 'Parsed' | 'Configured' | 'Active' | 'Renewed' | 'Expiring';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type KPICategory = 'financial' | 'compliance' | 'sla' | 'renewal' | 'velocity';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  logoColor: string;
  contractCount: number;
  activeKPIs: number;
  complianceScore: number;
  totalContractValue: number;
}

export interface ParsedClause {
  id: string;
  clauseType: string;
  label: string;
  value: string;
  confidence: number;
  category: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  counterparty: string;
  effectiveDate: string;
  renewalDate: string;
  contractValue: number;
  riskLevel: RiskLevel;
  clauses: ParsedClause[];
  summary: string;
  uploadedAt: string;
}

export interface KPIDefinition {
  id: string;
  tenantId: string;
  contractId: string;
  name: string;
  category: KPICategory;
  description: string;
  source: string;
  target: number;
  current: number;
  unit: string;
  trend: number[];
  trendDirection: 'up' | 'down' | 'flat';
  alertThreshold: number;
  alertCondition: 'above' | 'below';
}

export interface Alert {
  id: string;
  tenantId: string;
  contractId: string;
  contractTitle: string;
  severity: AlertSeverity;
  message: string;
  category: KPICategory;
  createdAt: string;
}

export interface PipelineConfig {
  tenantId: string;
  contractId: string;
  kpiIds: string[];
  autoRenewalTracking: boolean;
  slaMonitoring: boolean;
  financialExposureTracking: boolean;
  complianceAudit: boolean;
  alertingEnabled: boolean;
}

export interface ParseProgressStep {
  label: string;
  status: 'pending' | 'running' | 'complete';
  detail?: string;
}

export interface ParsedContractResult {
  title: string;
  type: ContractType;
  counterparty: string;
  effectiveDate: string;
  renewalDate: string;
  contractValue: number;
  riskLevel: RiskLevel;
  clauses: ParsedClause[];
  summary: string;
}
