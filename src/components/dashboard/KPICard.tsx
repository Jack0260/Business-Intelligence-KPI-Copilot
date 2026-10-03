import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { KPIDefinition } from '@/types';
import { Sparkline, ProgressBar } from '@/components/charts/Charts';
import { getCategoryColor, getCategoryLabel } from '@/lib/kpiGenerator';
import { Modal } from '@/components/ui/Modal';

interface KPICardProps {
  kpi: KPIDefinition;
  contractTitle?: string;
}

export function KPICard({ kpi, contractTitle }: KPICardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const color = getCategoryColor(kpi.category);
  const isAlert =
    kpi.alertCondition === 'below' ? kpi.current < kpi.alertThreshold : kpi.current > kpi.alertThreshold;
  const progressPct = Math.min((kpi.current / kpi.target) * 100, 100);

  const TrendIcon = kpi.trendDirection === 'up' ? TrendingUp : kpi.trendDirection === 'down' ? TrendingDown : Minus;
  const trendColor =
    kpi.trendDirection === 'up' ? 'text-emerald-500' : kpi.trendDirection === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className="card card-hover p-4 text-left flex flex-col gap-3 w-full"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{kpi.name}</h3>
              <p className="text-[10px] text-slate-400 truncate">{getCategoryLabel(kpi.category)} · {contractTitle || 'Contract'}</p>
            </div>
          </div>
          {isAlert && (
            <span className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0">
              Alert
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.current}</span>
            <span className="text-sm text-slate-400">{kpi.unit}</span>
          </div>
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400">Target: {kpi.target}{kpi.unit}</span>
              <span className="text-[10px] text-slate-400">{progressPct.toFixed(0)}%</span>
            </div>
            <ProgressBar value={kpi.current} max={kpi.target} color={color} />
          </div>
          <Sparkline data={kpi.trend} color={color} width={80} height={28} />
        </div>
      </button>

      <Modal open={showDetail} onClose={() => setShowDetail(false)} title={kpi.name} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-12 rounded-full" style={{ backgroundColor: color }} />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{kpi.description}</p>
              <p className="text-xs text-slate-400 mt-1">Source: {kpi.source}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Current</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpi.current}<span className="text-sm text-slate-400">{kpi.unit}</span></p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Target</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpi.target}<span className="text-sm text-slate-400">{kpi.unit}</span></p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Alert at</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpi.alertThreshold}<span className="text-sm text-slate-400">{kpi.unit}</span></p>
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-medium text-slate-400 mb-3">6-Period Trend</p>
            <div className="flex items-end justify-between gap-2 h-24">
              {kpi.trend.map((v, i) => {
                const max = Math.max(...kpi.trend);
                const min = Math.min(...kpi.trend);
                const range = max - min || 1;
                const h = ((v - min) / range) * 80 + 8;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md" style={{ height: `${h}px`, backgroundColor: color, opacity: 0.4 + (i / kpi.trend.length) * 0.6 }} />
                    <span className="text-[9px] text-slate-400">{v.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {isAlert ? (
              <>
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">Alert triggered — value {kpi.alertCondition} {kpi.alertThreshold}{kpi.unit}</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Within target range</span>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
