import { useMemo } from 'react';
import { FileText, DollarSign, ShieldCheck, TrendingUp, Activity } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { KPICard } from './KPICard';
import { AlertsPanel } from './AlertsPanel';
import { BarChart, DonutChart, Gauge, LineChart } from '@/components/charts/Charts';
import { getCategoryColor, getCategoryLabel } from '@/lib/kpiGenerator';
import { formatCurrency, riskLevelBg, riskLevelLabel, statusColor, formatCurrencyFull, formatDate, daysUntil } from '@/lib/formatters';
import type { ContractType, RiskLevel } from '@/types';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { activeTenant, getContractsByTenant, getKPIsByTenant, getAlertsByTenant } = useAppData();
  const contracts = getContractsByTenant(activeTenant.id);
  const kpis = getKPIsByTenant(activeTenant.id);
  const alerts = getAlertsByTenant(activeTenant.id);

  const stats = useMemo(() => {
    const totalValue = contracts.reduce((sum, c) => sum + c.contractValue, 0);
    const activeKPIs = kpis.length;
    const complianceScore = kpis.length > 0
      ? Math.round(kpis.filter((k) => {
          const ok = k.alertCondition === 'below' ? k.current >= k.alertThreshold : k.current <= k.alertThreshold;
          return ok;
        }).length / kpis.length * 100)
      : 0;
    const riskAlerts = alerts.filter((a) => a.severity === 'critical').length;
    return { totalValue, activeKPIs, complianceScore, riskAlerts };
  }, [contracts, kpis, alerts]);

  const contractTypeData = useMemo(() => {
    const typeColors: Record<ContractType, string> = {
      'MSA': '#0d9488',
      'SOW': '#f59e0b',
      'NDA': '#475569',
      'Vendor Agreement': '#b45309',
      'Partnership': '#059669',
      'Licensing': '#7c3aed',
    };
    const counts = new Map<ContractType, number>();
    contracts.forEach((c) => counts.set(c.type, (counts.get(c.type) || 0) + 1));
    return Array.from(counts.entries()).map(([type, value]) => ({
      label: type,
      value,
      color: typeColors[type],
    }));
  }, [contracts]);

  const kpiTrendData = useMemo(() => {
    const categories = ['financial', 'compliance', 'sla', 'renewal', 'velocity'] as const;
    const colors: Record<string, string> = {
      financial: '#0d9488',
      compliance: '#475569',
      sla: '#b45309',
      renewal: '#7c3aed',
      velocity: '#059669',
    };
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Sep'];

    const values = categories
      .map((cat) => {
        const catKpis = kpis.filter((k) => k.category === cat);
        if (catKpis.length === 0) return null;
        const avgTrend = [0, 1, 2, 3, 4, 5].map((i) => {
          const sum = catKpis.reduce((s, k) => s + (k.trend[i] || 0), 0);
          return Math.round(sum / catKpis.length);
        });
        return { name: getCategoryLabel(cat), color: colors[cat], points: avgTrend };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    return { label: labels.join(','), values };
  }, [kpis]);

  const riskDistribution = useMemo(() => {
    const riskColors: Record<RiskLevel, string> = {
      low: '#059669',
      medium: '#f59e0b',
      high: '#ea580c',
      critical: '#dc2626',
    };
    const counts = new Map<RiskLevel, number>();
    contracts.forEach((c) => counts.set(c.riskLevel, (counts.get(c.riskLevel) || 0) + 1));
    return Array.from(counts.entries()).map(([risk, value]) => ({
      label: riskLevelLabel(risk),
      value,
      color: riskColors[risk],
    }));
  }, [contracts]);

  const upcomingRenewals = useMemo(() => {
    return contracts
      .map((c) => ({ ...c, days: daysUntil(c.renewalDate) }))
      .filter((c) => c.days < 120)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [contracts]);

  const summaryCards = [
    { label: 'Total Contract Value', value: formatCurrency(stats.totalValue), sub: formatCurrencyFull(stats.totalValue), icon: DollarSign, color: '#0d9488' },
    { label: 'Active Contracts', value: contracts.length.toString(), sub: `${contracts.filter(c => c.status === 'Active').length} active`, icon: FileText, color: '#475569' },
    { label: 'Active KPIs', value: stats.activeKPIs.toString(), sub: `${kpis.filter(k => {
      const ok = k.alertCondition === 'below' ? k.current >= k.alertThreshold : k.current <= k.alertThreshold;
      return !ok;
    }).length} in alert`, icon: TrendingUp, color: '#f59e0b' },
    { label: 'Compliance Score', value: `${stats.complianceScore}%`, sub: stats.complianceScore >= 85 ? 'Healthy' : stats.complianceScore >= 70 ? 'Moderate' : 'At risk', icon: ShieldCheck, color: stats.complianceScore >= 85 ? '#059669' : stats.complianceScore >= 70 ? '#f59e0b' : '#dc2626' },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                  <Icon className="w-[18px] h-[18px]" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compliance Gauge */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 self-start">Compliance Score</h3>
          <Gauge value={stats.complianceScore} max={100} size={160} label="Overall" color={stats.complianceScore >= 85 ? '#059669' : stats.complianceScore >= 70 ? '#f59e0b' : '#dc2626'} />
          <div className="flex items-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Healthy ≥85</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-400">Moderate ≥70</span>
            </div>
          </div>
        </div>

        {/* Contract Type Donut */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Contract Types</h3>
          {contractTypeData.length > 0 ? (
            <div className="flex items-center gap-4">
              <DonutChart data={contractTypeData} size={140} thickness={20} centerValue={contracts.length.toString()} centerLabel="Contracts" />
              <div className="flex-1 space-y-1.5">
                {contractTypeData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 dark:text-slate-300 flex-1 truncate">{d.label}</span>
                    <span className="text-slate-400 font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">No contracts yet</p>
          )}
        </div>

        {/* Risk Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Risk Distribution</h3>
          {riskDistribution.length > 0 ? (
            <div className="flex items-center gap-4">
              <DonutChart data={riskDistribution} size={140} thickness={20} centerValue={contracts.length.toString()} centerLabel="Total" />
              <div className="flex-1 space-y-1.5">
                {riskDistribution.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 dark:text-slate-300 flex-1">{d.label}</span>
                    <span className="text-slate-400 font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">No contracts yet</p>
          )}
        </div>
      </div>

      {/* KPI Trend Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">KPI Trend Analysis</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {kpiTrendData.values.map((v, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                <span className="text-slate-500 dark:text-slate-400">{v.name}</span>
              </div>
            ))}
          </div>
        </div>
        {kpiTrendData.values.length > 0 ? (
          <LineChart data={kpiTrendData} height={220} />
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">No KPI data available</p>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Key Performance Indicators</h3>
          <span className="text-xs text-slate-400">{kpis.length} tracked</span>
        </div>
        {kpis.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kpis.map((kpi) => {
              const contract = contracts.find((c) => c.id === kpi.contractId);
              return <KPICard key={kpi.id} kpi={kpi} contractTitle={contract?.title} />;
            })}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-sm text-slate-400 mb-3">No KPIs tracked for this tenant yet.</p>
            <button onClick={() => onNavigate('upload')} className="btn-primary">
              Ingest a Contract
            </button>
          </div>
        )}
      </div>

      {/* Bottom Grid: Alerts + Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertsPanel alerts={alerts} />

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upcoming Renewals</h3>
            <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Next 120 days</span>
          </div>
          {upcomingRenewals.length > 0 ? (
            <div className="space-y-2">
              {upcomingRenewals.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className={`w-1 h-10 rounded-full shrink-0 ${c.days < 30 ? 'bg-red-500' : c.days < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400 truncate">{c.counterparty} · {formatDate(c.renewalDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${c.days < 30 ? 'text-red-500' : c.days < 60 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {c.days}d
                    </p>
                    <p className="text-[10px] text-slate-400">{formatCurrency(c.contractValue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">No renewals in the next 120 days</p>
          )}
        </div>
      </div>

      {/* Contracts Quick View */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Contract Portfolio</h3>
          <button onClick={() => onNavigate('contracts')} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
            View all →
          </button>
        </div>
        {contracts.length > 0 ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2 font-medium">Contract</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Type</th>
                  <th className="pb-2 font-medium text-right">Value</th>
                  <th className="pb-2 font-medium">Risk</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.slice(0, 6).map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{c.title}</p>
                      <p className="text-xs text-slate-400 truncate">{c.counterparty}</p>
                    </td>
                    <td className="py-2.5 pr-4 hidden sm:table-cell">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{c.type}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatCurrency(c.contractValue)}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge ${riskLevelBg(c.riskLevel)}`}>{riskLevelLabel(c.riskLevel)}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`badge ${statusColor(c.status)}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">No contracts yet</p>
        )}
      </div>
    </div>
  );
}
