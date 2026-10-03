import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Tenant, Contract, KPIDefinition, Alert, PipelineConfig, ParsedContractResult } from '@/types';
import { mockDatabase } from '@/data/mockDatabase';
import { generateKPIsFromContract, generatePipelineConfig } from '@/lib/kpiGenerator';

interface AppDataValue {
  tenants: Tenant[];
  contracts: Contract[];
  kpis: KPIDefinition[];
  alerts: Alert[];
  pipelineConfigs: PipelineConfig[];
  activeTenantId: string;
  activeTenant: Tenant;
  setActiveTenantId: (id: string) => void;
  addContract: (parsed: ParsedContractResult, tenantId: string) => string;
  getContractsByTenant: (tenantId: string) => Contract[];
  getKPIsByTenant: (tenantId: string) => KPIDefinition[];
  getAlertsByTenant: (tenantId: string) => Alert[];
  getKPIsByContract: (contractId: string) => KPIDefinition[];
  getContractById: (id: string) => Contract | undefined;
  advanceContractStatus: (contractId: string) => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [tenants] = useState<Tenant[]>(mockDatabase.tenants);
  const [contracts, setContracts] = useState<Contract[]>(mockDatabase.contracts);
  const [kpis, setKpis] = useState<KPIDefinition[]>(mockDatabase.kpis);
  const [alerts, setAlerts] = useState<Alert[]>(mockDatabase.alerts);
  const [pipelineConfigs, setPipelineConfigs] = useState<PipelineConfig[]>(mockDatabase.pipelineConfigs);
  const [activeTenantId, setActiveTenantId] = useState<string>(mockDatabase.tenants[0].id);

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  const setActiveTenantIdSafe = useCallback((id: string) => {
    setActiveTenantId(id);
  }, []);

  const addContract = useCallback((parsed: ParsedContractResult, tenantId: string): string => {
    const contractId = `contract-new-${Date.now()}`;
    const newContract: Contract = {
      id: contractId,
      tenantId,
      title: parsed.title,
      type: parsed.type,
      status: 'Configured',
      counterparty: parsed.counterparty,
      effectiveDate: parsed.effectiveDate,
      renewalDate: parsed.renewalDate,
      contractValue: parsed.contractValue,
      riskLevel: parsed.riskLevel,
      clauses: parsed.clauses,
      summary: parsed.summary,
      uploadedAt: new Date().toISOString(),
    };

    setContracts((prev) => [...prev, newContract]);

    const newKpis = generateKPIsFromContract(parsed, tenantId, contractId);
    setKpis((prev) => [...prev, ...newKpis]);

    const newConfig = generatePipelineConfig(
      tenantId,
      contractId,
      newKpis.map((k) => k.id)
    );
    setPipelineConfigs((prev) => [...prev, newConfig]);

    return contractId;
  }, []);

  const getContractsByTenant = useCallback(
    (tenantId: string) => contracts.filter((c) => c.tenantId === tenantId),
    [contracts]
  );

  const getKPIsByTenant = useCallback(
    (tenantId: string) => kpis.filter((k) => k.tenantId === tenantId),
    [kpis]
  );

  const getAlertsByTenant = useCallback(
    (tenantId: string) => alerts.filter((a) => a.tenantId === tenantId),
    [alerts]
  );

  const getKPIsByContract = useCallback(
    (contractId: string) => kpis.filter((k) => k.contractId === contractId),
    [kpis]
  );

  const getContractById = useCallback(
    (id: string) => contracts.find((c) => c.id === id),
    [contracts]
  );

  const advanceContractStatus = useCallback((contractId: string) => {
    const order = ['Ingested', 'Parsed', 'Configured', 'Active', 'Renewed'];
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        const idx = order.indexOf(c.status);
        if (idx < 0 || idx >= order.length - 1) return c;
        return { ...c, status: order[idx + 1] as Contract['status'] };
      })
    );
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        tenants,
        contracts,
        kpis,
        alerts,
        pipelineConfigs,
        activeTenantId,
        activeTenant,
        setActiveTenantId: setActiveTenantIdSafe,
        addContract,
        getContractsByTenant,
        getKPIsByTenant,
        getAlertsByTenant,
        getKPIsByContract,
        getContractById,
        advanceContractStatus,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
