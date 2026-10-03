import { useState } from 'react';
import { ChevronRight, FileText, AlertTriangle } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { riskLevelBg, riskLevelLabel, formatCurrency, formatDate } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { KPICard } from '@/components/dashboard/KPICard';
import type { Contract, ContractStatus } from '@/types';

const stages: ContractStatus[] = ['Ingested', 'Parsed', 'Configured', 'Active', 'Renewed'];

const stageColors: Record<ContractStatus, string> = {
  Ingested: '#94a3b8',
  Parsed: '#3b82f6',
  Configured: '#f59e0b',
  Active: '#0d9488',
  Renewed: '#059669',
  Expiring: '#dc2626',
};

interface PipelineBoardProps {
  onNavigate: (view: string) => void;
}

export function PipelineBoard({ onNavigate }: PipelineBoardProps) {
  const { activeTenant, getContractsByTenant, advanceContractStatus, getKPIsByContract } = useAppData();
  const contracts = getContractsByTenant(activeTenant.id);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const contractsByStage = stages.map((stage) => ({
    stage,
    contracts: contracts.filter((c) => c.status === stage),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Click "Advance" to move contracts through pipeline stages.
        </p>
        <button onClick={() => onNavigate('upload')} className="btn-primary text-xs">
          + Ingest New Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {contractsByStage.map(({ stage, contracts: stageContracts }) => (
          <div key={stage} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageColors[stage] }} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{stage}</span>
              </div>
              <span className="text-xs text-slate-400">{stageContracts.length}</span>
            </div>

            <div className="space-y-2 min-h-[100px]">
              {stageContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="card card-hover p-3 cursor-pointer"
                  onClick={() => setSelectedContract(contract)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">{contract.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{contract.counterparty}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className={`badge ${riskLevelBg(contract.riskLevel)}`}>
                      {riskLevelLabel(contract.riskLevel)}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
                      {formatCurrency(contract.contractValue)}
                    </span>
                  </div>

                  {contract.riskLevel === 'critical' && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span>High exposure</span>
                    </div>
                  )}

                  {stage !== 'Renewed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        advanceContractStatus(contract.id);
                      }}
                      className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Advance <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {stageContracts.length === 0 && (
                <div className="card p-4 text-center border-dashed">
                  <p className="text-xs text-slate-300 dark:text-slate-600">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contract Detail Modal */}
      <Modal
        open={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        title={selectedContract?.title || ''}
        maxWidth="max-w-3xl"
      >
        {selectedContract && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card p-3">
                <p className="text-xs text-slate-400 mb-1">Type</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedContract.type}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-slate-400 mb-1">Value</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(selectedContract.contractValue)}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-slate-400 mb-1">Effective</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(selectedContract.effectiveDate)}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-slate-400 mb-1">Renewal</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(selectedContract.renewalDate)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Summary</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedContract.summary}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Extracted Clauses ({selectedContract.clauses.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedContract.clauses.map((clause) => (
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
              const contractKpis = getKPIsByContract(selectedContract.id);
              if (contractKpis.length === 0) return null;
              return (
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">Tracked KPIs ({contractKpis.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contractKpis.map((kpi) => (
                      <KPICard key={kpi.id} kpi={kpi} contractTitle={selectedContract.title} />
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
