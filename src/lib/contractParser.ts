import type {
  ContractType,
  RiskLevel,
  ParsedClause,
  ParsedContractResult,
  ParseProgressStep,
} from '@/types';

const contractTypePatterns: Record<ContractType, RegExp[]> = {
  'MSA': [/master services agreement/i, /MSA\b/i],
  'SOW': [/statement of work/i, /SOW\b/i],
  'NDA': [/non-disclosure agreement/i, /NDA\b/i, /confidentiality agreement/i],
  'Vendor Agreement': [/vendor agreement/i, /supply agreement/i, /supplier/i],
  'Partnership': [/partnership agreement/i, /joint venture/i, /partnership/i],
  'Licensing': [/licensing agreement/i, /license agreement/i, /software license/i],
};

const clausePatterns: { type: string; label: string; pattern: RegExp; category: string; valueType: 'extracted' | 'computed' }[] = [
  { type: 'payment_terms', label: 'Payment Terms', pattern: /(?:payment terms|net\s+\d+|payment shall be made|invoiced?)/i, category: 'financial', valueType: 'extracted' },
  { type: 'liability_cap', label: 'Liability Cap', pattern: /(?:liability cap|limitation of liability|aggregate liability|total liability)/i, category: 'financial', valueType: 'extracted' },
  { type: 'sla_penalty', label: 'SLA Penalty', pattern: /(?:SLA|service level|penalty|service credit|downtime)/i, category: 'sla', valueType: 'extracted' },
  { type: 'sla_response', label: 'SLA Response Time', pattern: /(?:response time|response within|business hours)/i, category: 'sla', valueType: 'extracted' },
  { type: 'uptime_sla', label: 'Uptime SLA', pattern: /(?:uptime|availability|99\.\d+%)/i, category: 'sla', valueType: 'extracted' },
  { type: 'renewal', label: 'Renewal Terms', pattern: /(?:renewal|auto-renew|auto renew|term shall|renewed)/i, category: 'renewal', valueType: 'extracted' },
  { type: 'termination', label: 'Termination Notice', pattern: /(?:termination|terminate|notice period|written notice)/i, category: 'compliance', valueType: 'extracted' },
  { type: 'confidentiality_period', label: 'Confidentiality Period', pattern: /(?:confidential|confidentiality period|non-disclosure)/i, category: 'compliance', valueType: 'extracted' },
  { type: 'jurisdiction', label: 'Jurisdiction', pattern: /(?:jurisdiction|governing law|venue|courts of)/i, category: 'compliance', valueType: 'extracted' },
  { type: 'force_majeure', label: 'Force Majeure', pattern: /(?:force majeure|acts of god|beyond.*control)/i, category: 'compliance', valueType: 'extracted' },
  { type: 'indemnification', label: 'Indemnification', pattern: /(?:indemnif|hold harmless|defend)/i, category: 'compliance', valueType: 'extracted' },
  { type: 'ip_ownership', label: 'IP Ownership', pattern: /(?:intellectual property|IP ownership|ownership of.*work|work product)/i, category: 'compliance', valueType: 'extracted' },
  { type: 'milestone_count', label: 'Milestones', pattern: /(?:milestone|deliverable|phase|work product)/i, category: 'velocity', valueType: 'extracted' },
  { type: 'acceptance', label: 'Acceptance Window', pattern: /(?:acceptance|accept|review period|approval)/i, category: 'compliance', valueType: 'extracted' },
  { type: 'price_lock', label: 'Price Lock', pattern: /(?:price lock|fixed pric|pricing.*locked|price.*fixed)/i, category: 'financial', valueType: 'extracted' },
  { type: 'volume_commitment', label: 'Volume Commitment', pattern: /(?:volume commitment|minimum.*order|minimum.*unit|purchase obligation)/i, category: 'financial', valueType: 'extracted' },
  { type: 'revenue_split', label: 'Revenue Split', pattern: /(?:revenue split|revenue share|royalty|revenue.*percentage)/i, category: 'financial', valueType: 'extracted' },
  { type: 'license_model', label: 'License Model', pattern: /(?:license model|per-seat|per seat|seat.*license|concurrent)/i, category: 'financial', valueType: 'extracted' },
  { type: 'escrow', label: 'Source Code Escrow', pattern: /(?:escrow|source code.*deposit)/i, category: 'compliance', valueType: 'extracted' },
  { type: 'data_ownership', label: 'Data Ownership', pattern: /(?:data ownership|data.*rights|ownership of data)/i, category: 'compliance', valueType: 'extracted' },
];

const valueExtractors: Record<string, (text: string) => string> = {
  payment_terms: (text) => {
    const netMatch = text.match(/net\s+(\d+)/i);
    if (netMatch) return `Net ${netMatch[1]}`;
    if (/milestone-based|milestone/i.test(text)) return 'Milestone-based';
    if (/monthly retainer|retainer/i.test(text)) return 'Monthly retainer + T&M';
    if (/advance/i.test(text)) return 'Advance + on delivery';
    return 'As per agreement';
  },
  liability_cap: (text) => {
    const capMatch = text.match(/(?:liability cap|aggregate liability|total liability)[^$]*\$(\d[\d,]*)/i);
    if (capMatch) return `$${capMatch[1]}`;
    const dollarMatch = text.match(/\$(\d[\d,]*)\s*(?:million|M\b)/i);
    if (dollarMatch) return `$${dollarMatch[1]},000`;
    return 'As per agreement';
  },
  sla_penalty: (text) => {
    const pctMatch = text.match(/(\d+)%\s*(?:credit|penalty|service credit)/i);
    if (pctMatch) return `${pctMatch[1]}% credit per missed deadline`;
    return 'As per agreement';
  },
  sla_response: (text) => {
    const hrMatch = text.match(/(\d+)\s*(?:business\s*)?hours?/i);
    if (hrMatch) return `${hrMatch[1]} business hours`;
    return 'As per agreement';
  },
  uptime_sla: (text) => {
    const uptimeMatch = text.match(/(\d{2}\.\d+)%/);
    if (uptimeMatch) return `${uptimeMatch[1]}%`;
    return 'As per agreement';
  },
  renewal: (text) => {
    if (/auto-renew|auto renew/i.test(text)) {
      const monthsMatch = text.match(/(\d+)\s*months?/i);
      if (monthsMatch) return `Auto-renewal, ${monthsMatch[1]} months`;
      return 'Auto-renewal';
    }
    const monthsMatch = text.match(/(\d+)\s*months?/i);
    if (monthsMatch) return `${monthsMatch[1]} months`;
    return 'As per agreement';
  },
  termination: (text) => {
    const daysMatch = text.match(/(\d+)\s*days?/i);
    if (daysMatch) return `${daysMatch[1]} days written notice`;
    return 'As per agreement';
  },
  confidentiality_period: (text) => {
    const monthsMatch = text.match(/(\d+)\s*months?/i);
    if (monthsMatch) return `${monthsMatch[1]} months`;
    const yearsMatch = text.match(/(\d+)\s*years?/i);
    if (yearsMatch) return `${yearsMatch[1]} years`;
    return 'As per agreement';
  },
  jurisdiction: (text) => {
    const stateMatch = text.match(/(?:governing law|jurisdiction|courts of)\s*[^,]*,?\s*([A-Z][a-z]+)/);
    if (stateMatch) return `${stateMatch[1]}, USA`;
    return 'As per agreement';
  },
  force_majeure: (text) => {
    if (/notice/i.test(text)) {
      const daysMatch = text.match(/(\d+)\s*days?/i);
      if (daysMatch) return `Standard carve-outs, ${daysMatch[1]}-day notice`;
    }
    return 'Standard carve-outs';
  },
  indemnification: (text) => {
    if (/full/i.test(text)) return 'Full IP indemnification';
    if (/mutual/i.test(text)) return 'Mutual indemnification';
    return 'As per agreement';
  },
  ip_ownership: (text) => {
    if (/joint/i.test(text)) return 'Joint ownership';
    if (/client|customer/i.test(text)) return 'Client retains ownership';
    if (/licensor/i.test(text)) return 'Licensor retains ownership';
    return 'As per agreement';
  },
  milestone_count: (text) => {
    const phaseMatch = text.match(/(\d+)\s*(?:phases?|milestones?|deliverables?)/i);
    if (phaseMatch) return `${phaseMatch[1]} phases`;
    return 'As per agreement';
  },
  acceptance: (text) => {
    const daysMatch = text.match(/(\d+)\s*(?:business\s*)?days?/i);
    if (daysMatch) return `${daysMatch[1]} business days`;
    return 'As per agreement';
  },
  price_lock: (text) => {
    const monthsMatch = text.match(/(\d+)\s*months?/i);
    if (monthsMatch) return `${monthsMatch[1]} months fixed pricing`;
    return 'Fixed pricing';
  },
  volume_commitment: (text) => {
    const unitsMatch = text.match(/([\d,]+)\s*units?/i);
    if (unitsMatch) return `${unitsMatch[1]} units/quarter minimum`;
    return 'As per agreement';
  },
  revenue_split: (text) => {
    const splitMatch = text.match(/(\d+)\s*[/%]\s*(\d+)\s*[/%]/);
    if (splitMatch) return `${splitMatch[1]}/${splitMatch[2]} split`;
    return 'As per agreement';
  },
  license_model: (text) => {
    const seatsMatch = text.match(/(\d+)\s*seats?/i);
    if (seatsMatch) return `Per-seat, ${seatsMatch[1]} seats`;
    return 'As per agreement';
  },
  escrow: (text) => {
    const monthsMatch = text.match(/(\d+)\s*months?/i);
    if (monthsMatch) return `Required, ${monthsMatch[1]}-month updates`;
    return 'Required';
  },
  data_ownership: (text) => {
    if (/client/i.test(text)) return 'Client retains full ownership';
    if (/licensor/i.test(text)) return 'Licensor retains ownership';
    return 'As per agreement';
  },
};

function detectContractType(text: string): ContractType {
  for (const [type, patterns] of Object.entries(contractTypePatterns)) {
    if (patterns.some((p) => p.test(text))) {
      return type as ContractType;
    }
  }
  return 'MSA';
}

function extractCounterparty(text: string, title: string): string {
  const titleMatch = title.match(/—\s*(.+)$/);
  if (titleMatch) return titleMatch[1].trim();
  const betweenMatch = text.match(/between\s+([A-Z][\w\s&.,]+?)\s+and\s+([A-Z][\w\s&.,]+)/i);
  if (betweenMatch) return betweenMatch[2].trim();
  return 'Unknown Party';
}

function extractDate(text: string, type: 'effective' | 'renewal'): string | null {
  const datePattern = /(?:effective date|renewal date|term.*?commenc\w*|expires? on|renews? on|valid until|through)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})/i;
  const matches = text.match(datePattern);
  if (matches) {
    return normalizeDate(matches[1]);
  }
  const genericDate = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (genericDate) return genericDate[1];
  return null;
}

function normalizeDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return dateStr;
}

function extractContractValue(text: string): number {
  const valueMatch = text.match(/\$\s*(\d[\d,]*)\s*(?:million|M\b)?/i);
  if (valueMatch) {
    const num = parseInt(valueMatch[1].replace(/,/g, ''), 10);
    if (/million|M\b/i.test(valueMatch[0])) return num * 1_000_000;
    return num;
  }
  const annualMatch = text.match(/\$(\d[\d,]*)\s*(?:per\s*year|annual|annually)/i);
  if (annualMatch) return parseInt(annualMatch[1].replace(/,/g, ''), 10);
  return 0;
}

function assessRisk(clauses: ParsedClause[], value: number, type: ContractType): RiskLevel {
  let riskScore = 0;
  if (value > 2_000_000) riskScore += 2;
  else if (value > 500_000) riskScore += 1;
  if (type === 'NDA') riskScore += 1;
  if (clauses.some((c) => c.clauseType === 'liability_cap' && c.value.includes('2,000'))) riskScore += 1;
  if (clauses.some((c) => c.clauseType === 'force_majeure')) riskScore += 0;
  const lowConfidence = clauses.filter((c) => c.confidence < 0.85).length;
  riskScore += lowConfidence * 0.5;

  if (riskScore >= 3) return 'critical';
  if (riskScore >= 2) return 'high';
  if (riskScore >= 1) return 'medium';
  return 'low';
}

function generateSummary(type: ContractType, counterparty: string, value: number, clauses: ParsedClause[]): string {
  const parts: string[] = [];
  parts.push(`${type} with ${counterparty}`);
  if (value > 0) parts.push(`valued at $${value.toLocaleString()}`);
  const clauseLabels = clauses.slice(0, 3).map((c) => c.label.toLowerCase());
  if (clauseLabels.length > 0) parts.push(`with identified clauses for ${clauseLabels.join(', ')}`);
  return parts.join(', ') + '.';
}

export function parseContractText(text: string, fileName?: string): ParsedContractResult {
  const trimmed = text.trim();
  const title = fileName
    ? fileName.replace(/\.\w+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : trimmed.split('\n')[0]?.slice(0, 80) || 'Untitled Contract';

  const type = detectContractType(trimmed);
  const counterparty = extractCounterparty(trimmed, title);

  const clauses: ParsedClause[] = [];
  let clauseIdx = 0;
  for (const cp of clausePatterns) {
    if (cp.pattern.test(trimmed)) {
      const extractor = valueExtractors[cp.type];
      const value = extractor ? extractor(trimmed) : 'Detected';
      const confidence = 0.85 + Math.random() * 0.13;
      clauses.push({
        id: `parsed-clause-${clauseIdx++}`,
        clauseType: cp.type,
        label: cp.label,
        value,
        confidence: Math.round(confidence * 100) / 100,
        category: cp.category,
      });
    }
  }

  const effectiveDate = extractDate(trimmed, 'effective') || new Date().toISOString().split('T')[0];
  const renewalDate = extractDate(trimmed, 'renewal') || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
  const contractValue = extractContractValue(trimmed);
  const riskLevel = assessRisk(clauses, contractValue, type);
  const summary = generateSummary(type, counterparty, contractValue, clauses);

  return {
    title,
    type,
    counterparty,
    effectiveDate,
    renewalDate,
    contractValue,
    riskLevel,
    clauses,
    summary,
  };
}

export function getParseSteps(): ParseProgressStep[] {
  return [
    { label: 'Scanning document structure', status: 'pending' },
    { label: 'Identifying contract type', status: 'pending' },
    { label: 'Extracting counterparty information', status: 'pending' },
    { label: 'Detecting payment terms', status: 'pending' },
    { label: 'Analyzing SLA clauses', status: 'pending' },
    { label: 'Scanning for liability caps', status: 'pending' },
    { label: 'Detecting renewal terms', status: 'pending' },
    { label: 'Extracting termination clauses', status: 'pending' },
    { label: 'Assessing risk level', status: 'pending' },
    { label: 'Generating contract summary', status: 'pending' },
  ];
}

export const sampleContractText = `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of January 15, 2025 ("Effective Date"),
between Northwind Legal Services Inc. ("Client") and Acme Corporation ("Service Provider").

1. SERVICES
Service Provider shall provide ongoing legal consulting services including contract review,
compliance advisory, and litigation support.

2. PAYMENT TERMS
Client shall pay all invoices within Net 30 days of receipt. Late payments shall accrue
interest at 1.5% per month.

3. TERM AND RENEWAL
This Agreement shall be effective for 12 months from the Effective Date and shall
auto-renew for successive 12-month terms unless either party provides written notice
of non-renewal at least 90 days prior to the renewal date.

4. LIMITATION OF LIABILITY
The aggregate liability of either party shall not exceed $500,000. Neither party shall
be liable for indirect or consequential damages.

5. SERVICE LEVEL AGREEMENT
Service Provider commits to a response time of 4 business hours for all support requests.
Failure to meet SLA deadlines shall result in a 2% service credit per missed deadline.

6. TERMINATION
Either party may terminate this Agreement upon 90 days written notice. Material breach
shall allow termination upon 30 days notice if uncured.

7. CONFIDENTIALITY
Both parties agree to maintain confidentiality of all proprietary information shared
during the term of this Agreement and for 24 months thereafter.

8. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Delaware, USA.

9. INDEMNIFICATION
Service Provider shall indemnify and hold harmless Client from any third-party claims
arising from Service Provider's negligent acts or omissions.

Contract Value: $1,200,000`;
