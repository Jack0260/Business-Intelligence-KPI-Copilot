import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { Modal } from '@/components/ui/Modal';
import { KPICard } from '@/components/dashboard/KPICard';
import { formatCurrency, formatCurrencyFull, formatDate, riskLevelBg, riskLevelLabel, statusColor, daysUntil } from '@/lib/formatters';
import type { Contract } from '@/types';

type SortField = 'title' | 'type' | 'contractValue' | 'riskLevel' | 'renewalDate' | 'status';
type SortDir = 'asc' | 'desc';

const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export function ContractsTable() {
  const { activeTenant, getContractsByTenant, getKPIsByContract } = useAppData();
  const allContracts = getContractsByTenant(activeTenant.id);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('renewalDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Contract | null>(null);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let result = [...allContracts];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.counterparty.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') result = result.filter((c) => c.type === typeFilter);
    if (riskFilter !== 'all') result = result.filter((c) => c.riskLevel === riskFilter);

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'contractValue': cmp = a.contractValue - b.contractValue; break;
        case 'riskLevel': cmp = riskOrder[a.riskLevel] - riskOrder[b.riskLevel]; break;
        case 'renewalDate': cmp = new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [allContracts, search, typeFilter, riskFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageContracts = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const types = useMemo(() => Array.from(new Set(allContracts.map((c) => c.type))), [allContracts]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search contracts..."
            className="input pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="input max-w-[160px]"
        >
          <option value="all">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
          className="input max-w-[160px]"
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

 {/* Table */}
      {pageContracts.length > 0 ? (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-4 py-3 font-medium">
                      <button onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200">
                        Contract <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">
                      <button onClick={() => toggleSort('type')} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200">
                        Type <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      <button onClick={() => toggleSort('contractValue')} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 ml-auto">
                        Value <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">
                      <button onClick={() => toggleSort('renewalDate')} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200">
                        Renewal <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <button onClick={() => toggleSort('riskLevel')} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200">
                        Risk <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200">
                        Status <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageContracts.map((c) => {
                    const days = daysUntil(c.renewalDate);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[220px]">{c.title}</p>
                              <p className="text-xs text-slate-400 truncate">{c.counterparty}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{c.type}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatCurrency(c.contractValue)}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(c.renewalDate)}</p>
                            <p className={`text-[10px] ${days < 30 ? 'text-red-500' : days < 60 ? 'text-amber-500' : 'text-slate-400'}`}>
                              {days > 0 ? `${days} days` : 'Expired'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${riskLevelBg(c.riskLevel)}`}>{riskLevelLabel(c.riskLevel)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${statusColor(c.status)}`}>{c.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400 px-2">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No contracts match your filters.</p>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || ''}
        maxWidth="max-w-3xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card p-3">
                <p className="text-xs text-slate-400 mb-1">Type</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selected.type}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-slate-400 mb-1">Value</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrencyFull(selected.contractValue)}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-slate-400 mb-1">Effective</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(selected.effectiveDate)}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-slate-400 mb-1">Renewal</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(selected.renewalDate)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Summary</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{selected.summary}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Extracted Clauses ({selected.clauses.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selected.clauses.map((clause) => (
                  <div key={clause.id} className="card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{clause.label}</p>
                      <span className="text-[10px] text-slate-400">{(clause.confidence * 100).toFixed(0)}% conf.</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{clause.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const contractKpis = getKPIsByContract(selected.id);
              if (contractKpis.length === 0) return null;
              return (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">Tracked KPIs ({contractKpis.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contractKpis.map((kpi) => (
                      <KPICard key={kpi.id} kpi={kpi} contractTitle={selected.title} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
