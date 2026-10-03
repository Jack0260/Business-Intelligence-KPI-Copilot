import type { RiskLevel } from '@/types';

export function formatCurrency(value: number): string {
  if (value === 0) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatCurrencyFull(value: number): string {
  if (value === 0) return '—';
  return `$${value.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function riskLevelColor(risk: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: '#059669',
    medium: '#f59e0b',
    high: '#ea580c',
    critical: '#dc2626',
  };
  return colors[risk];
}

export function riskLevelBg(risk: RiskLevel): string {
  const bgs: Record<RiskLevel, string> = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return bgs[risk];
}

export function riskLevelLabel(risk: RiskLevel): string {
  return risk.charAt(0).toUpperCase() + risk.slice(1);
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    Ingested: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    Parsed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Configured: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
    Active: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
    Renewed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Expiring: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || colors.Ingested;
}

export function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    info: 'text-blue-500',
    warning: 'text-amber-500',
    critical: 'text-red-500',
  };
  return colors[severity] || colors.info;
}

export function severityBg(severity: string): string {
  const bgs: Record<string, string> = {
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    critical: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
  };
  return bgs[severity] || bgs.info;
}
