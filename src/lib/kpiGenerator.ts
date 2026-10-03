import type {
  KPIDefinition,
  ParsedContractResult,
  PipelineConfig,
  KPICategory,
} from '@/types';

function generateTrend(base: number, direction: 'up' | 'down' | 'flat'): number[] {
  const trend: number[] = [];
  let val = base;
  for (let i = 0; i < 6; i++) {
    const noise = (Math.random() - 0.5) * base * 0.04;
    if (direction === 'up') val += base * 0.02 + noise;
    else if (direction === 'down') val -= base * 0.02 + noise;
    else val += noise;
    trend.push(Math.round(Math.max(0, val) * 100) / 100);
  }
  return trend;
}

const kpiTemplates: Record<string, Omit<KPIDefinition, 'id' | 'tenantId' | 'contractId' | 'trend'>> = {
  payment_terms: {
    name: 'Payment Timeliness',
    category: 'financial',
    description: 'Percentage of invoices paid within contracted payment terms',
    source: 'Payment Terms clause',
    target: 95,
    current: 92,
    unit: '%',
    trendDirection: 'up',
    alertThreshold: 85,
    alertCondition: 'below',
  },
  liability_cap: {
    name: 'Liability Exposure Ratio',
    category: 'financial',
    description: 'Liability cap as percentage of contract value',
    source: 'Liability Cap clause',
    target: 50,
    current: 65,
    unit: '%',
    trendDirection: 'up',
    alertThreshold: 80,
    alertCondition: 'above',
  },
  sla_penalty: {
    name: 'SLA Deadline Compliance',
    category: 'sla',
    description: 'Percentage of deliverables meeting contracted deadlines',
    source: 'SLA Penalty clause',
    target: 98,
    current: 95,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 90,
    alertCondition: 'below',
  },
  sla_response: {
    name: 'Response Time Adherence',
    category: 'sla',
    description: 'Response time compliance vs contracted SLA',
    source: 'SLA Response Time clause',
    target: 95,
    current: 93,
    unit: '%',
    trendDirection: 'up',
    alertThreshold: 85,
    alertCondition: 'below',
  },
  uptime_sla: {
    name: 'Uptime Adherence',
    category: 'sla',
    description: 'Service uptime vs contracted SLA target',
    source: 'Uptime SLA clause',
    target: 99.9,
    current: 99.85,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 99.5,
    alertCondition: 'below',
  },
  renewal: {
    name: 'Renewal Risk Exposure',
    category: 'renewal',
    description: 'Days until renewal/auto-renewal deadline',
    source: 'Renewal Terms clause',
    target: 90,
    current: 60,
    unit: 'days',
    trendDirection: 'down',
    alertThreshold: 30,
    alertCondition: 'below',
  },
  termination: {
    name: 'Termination Notice Compliance',
    category: 'compliance',
    description: 'Days remaining for termination notice window',
    source: 'Termination Notice clause',
    target: 90,
    current: 75,
    unit: 'days',
    trendDirection: 'down',
    alertThreshold: 30,
    alertCondition: 'below',
  },
  confidentiality_period: {
    name: 'Confidentiality Compliance',
    category: 'compliance',
    description: 'NDA confidentiality period adherence score',
    source: 'Confidentiality Period clause',
    target: 100,
    current: 100,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 95,
    alertCondition: 'below',
  },
  jurisdiction: {
    name: 'Jurisdiction Alignment',
    category: 'compliance',
    description: 'Jurisdiction compliance verification status',
    source: 'Jurisdiction clause',
    target: 100,
    current: 100,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 90,
    alertCondition: 'below',
  },
  force_majeure: {
    name: 'Force Majeure Readiness',
    category: 'compliance',
    description: 'Force majeure provision coverage score',
    source: 'Force Majeure clause',
    target: 100,
    current: 95,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 80,
    alertCondition: 'below',
  },
  indemnification: {
    name: 'Indemnification Coverage',
    category: 'compliance',
    description: 'Indemnification clause strength score',
    source: 'Indemnification clause',
    target: 100,
    current: 92,
    unit: '%',
    trendDirection: 'up',
    alertThreshold: 85,
    alertCondition: 'below',
  },
  ip_ownership: {
    name: 'IP Ownership Clarity',
    category: 'compliance',
    description: 'Intellectual property ownership clarity score',
    source: 'IP Ownership clause',
    target: 100,
    current: 90,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 80,
    alertCondition: 'below',
  },
  milestone_count: {
    name: 'Milestone Velocity',
    category: 'velocity',
    description: 'Percentage of milestones completed on schedule',
    source: 'Milestone clause',
    target: 80,
    current: 40,
    unit: '%',
    trendDirection: 'up',
    alertThreshold: 50,
    alertCondition: 'below',
  },
  acceptance: {
    name: 'Acceptance Rate',
    category: 'velocity',
    description: 'Deliverable acceptance rate within contracted window',
    source: 'Acceptance Window clause',
    target: 90,
    current: 85,
    unit: '%',
    trendDirection: 'up',
    alertThreshold: 75,
    alertCondition: 'below',
  },
  price_lock: {
    name: 'Price Lock Stability',
    category: 'financial',
    description: 'Months remaining on fixed pricing agreement',
    source: 'Price Lock clause',
    target: 18,
    current: 12,
    unit: 'months',
    trendDirection: 'down',
    alertThreshold: 6,
    alertCondition: 'below',
  },
  volume_commitment: {
    name: 'Volume Fulfillment Rate',
    category: 'sla',
    description: 'Actual volume vs minimum commitment',
    source: 'Volume Commitment clause',
    target: 100,
    current: 88,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 85,
    alertCondition: 'below',
  },
  revenue_split: {
    name: 'Revenue Share Accuracy',
    category: 'financial',
    description: 'Accuracy of revenue split calculations',
    source: 'Revenue Split clause',
    target: 100,
    current: 98,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 95,
    alertCondition: 'below',
  },
  license_model: {
    name: 'License Utilization',
    category: 'financial',
    description: 'Seats activated vs contracted license count',
    source: 'License Model clause',
    target: 90,
    current: 78,
    unit: '%',
    trendDirection: 'up',
    alertThreshold: 75,
    alertCondition: 'below',
  },
  escrow: {
    name: 'Escrow Update Compliance',
    category: 'compliance',
    description: 'Source code escrow update cadence compliance',
    source: 'Escrow clause',
    target: 100,
    current: 100,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 90,
    alertCondition: 'below',
  },
  data_ownership: {
    name: 'Data Rights Compliance',
    category: 'compliance',
    description: 'Data ownership provision adherence score',
    source: 'Data Ownership clause',
    target: 100,
    current: 98,
    unit: '%',
    trendDirection: 'flat',
    alertThreshold: 90,
    alertCondition: 'below',
  },
};

export function generateKPIsFromContract(
  parsed: ParsedContractResult,
  tenantId: string,
  contractId: string
): KPIDefinition[] {
  const kpis: KPIDefinition[] = [];
  let idx = 0;

  for (const clause of parsed.clauses) {
    const template = kpiTemplates[clause.clauseType];
    if (!template) continue;

    const trend = generateTrend(template.current, template.trendDirection);
    kpis.push({
      ...template,
      id: `kpi-gen-${contractId}-${idx++}`,
      tenantId,
      contractId,
      source: `${template.source} → ${clause.value}`,
      trend,
    });
  }

  return kpis;
}

export function generatePipelineConfig(
  tenantId: string,
  contractId: string,
  kpiIds: string[]
): PipelineConfig {
  return {
    tenantId,
    contractId,
    kpiIds,
    autoRenewalTracking: kpiIds.some((id) => id.includes('renewal')),
    slaMonitoring: kpiIds.some((id) => id.includes('sla')),
    financialExposureTracking: kpiIds.some((id) => id.includes('financial')),
    complianceAudit: kpiIds.some((id) => id.includes('compliance')),
    alertingEnabled: true,
  };
}

export function getCategoryColor(category: KPICategory): string {
  const colors: Record<KPICategory, string> = {
    financial: '#0d9488',
    compliance: '#475569',
    sla: '#b45309',
    renewal: '#7c3aed',
    velocity: '#059669',
  };
  return colors[category];
}

export function getCategoryLabel(category: KPICategory): string {
  const labels: Record<KPICategory, string> = {
    financial: 'Financial',
    compliance: 'Compliance',
    sla: 'SLA',
    renewal: 'Renewal',
    velocity: 'Velocity',
  };
  return labels[category];
}
