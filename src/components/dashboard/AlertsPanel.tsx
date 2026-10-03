import { AlertTriangle, Bell, Info, AlertCircle } from 'lucide-react';
import type { Alert } from '@/types';
import { severityColor, severityBg, formatDate } from '@/lib/formatters';

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Active Alerts</h3>
        </div>
        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {alerts.length} total
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">No active alerts</p>
          <p className="text-xs text-slate-400">All KPIs within target range</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
          {sorted.map((alert) => {
            const Icon = alert.severity === 'critical' ? AlertTriangle : alert.severity === 'warning' ? AlertCircle : Info;
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${severityBg(alert.severity)}`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${severityColor(alert.severity)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 truncate">{alert.contractTitle}</span>
                    <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(alert.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
