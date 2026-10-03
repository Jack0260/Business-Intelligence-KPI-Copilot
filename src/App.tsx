import { useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppDataProvider, useAppData } from '@/context/AppDataContext';
import { Sidebar, MobileNav, type ViewId } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { UploadFlow } from '@/components/upload/UploadFlow';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { ContractsTable } from '@/components/contracts/ContractsTable';

const viewTitles: Record<ViewId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Dashboard', subtitle: 'Multi-tenant KPI overview and contract intelligence' },
  upload: { title: 'Ingest Contract', subtitle: 'Upload and parse new contracts to generate KPI pipelines' },
  pipeline: { title: 'Contract Pipeline', subtitle: 'Track contracts through ingestion to activation stages' },
  contracts: { title: 'Contract Portfolio', subtitle: 'Browse, filter, and manage all tenant contracts' },
};

function AppContent() {
  const [view, setView] = useState<ViewId>('dashboard');
  const { getAlertsByTenant, activeTenantId } = useAppData();
  const alertCount = getAlertsByTenant(activeTenantId).length;

  const { title, subtitle } = viewTitles[view];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar activeView={view} onNavigate={setView} alertCount={alertCount} />
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          <div key={view} className="animate-fade-in">
            {view === 'dashboard' && <Dashboard onNavigate={(v) => setView(v as ViewId)} />}
            {view === 'upload' && <UploadFlow onNavigate={(v) => setView(v as ViewId)} />}
            {view === 'pipeline' && <PipelineBoard onNavigate={(v) => setView(v as ViewId)} />}
            {view === 'contracts' && <ContractsTable />}
          </div>
        </main>
      </div>
      <MobileNav activeView={view} onNavigate={setView} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </ThemeProvider>
  );
}

export default App;
