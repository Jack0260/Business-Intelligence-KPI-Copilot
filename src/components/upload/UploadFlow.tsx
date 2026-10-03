import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, Sparkles, CheckCircle2, Loader2, ArrowRight, X, ClipboardPaste, FileUp } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { parseContractText, getParseSteps, sampleContractText } from '@/lib/contractParser';
import { generateKPIsFromContract, generatePipelineConfig, getCategoryLabel, getCategoryColor } from '@/lib/kpiGenerator';
import { riskLevelBg, riskLevelLabel, formatCurrencyFull, formatDate } from '@/lib/formatters';
import type { ParsedContractResult, ParseProgressStep } from '@/types';

type Phase = 'input' | 'parsing' | 'review' | 'config' | 'success';

interface UploadFlowProps {
  onNavigate: (view: string) => void;
}

export function UploadFlow({ onNavigate }: UploadFlowProps) {
  const { activeTenant, addContract } = useAppData();
  const [phase, setPhase] = useState<Phase>('input');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parseSteps, setParseSteps] = useState<ParseProgressStep[]>([]);
  const [parsedResult, setParsedResult] = useState<ParsedContractResult | null>(null);
  const [generatedKpis, setGeneratedKpis] = useState<ReturnType<typeof generateKPIsFromContract>>([]);
  const [pipelineConfig, setPipelineConfig] = useState<ReturnType<typeof generatePipelineConfig> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || ''));
    };
    reader.onerror = () => setErrorMsg('Could not read file. Try pasting the text instead.');
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleParse = useCallback(async () => {
    if (!text.trim()) {
      setErrorMsg('Please upload a file or paste contract text to begin.');
      return;
    }
    setErrorMsg('');
    setPhase('parsing');

    const steps = getParseSteps();
    setParseSteps(steps.map((s) => ({ ...s, status: 'pending' as const })));

    for (let i = 0; i < steps.length; i++) {
      setParseSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s));
      await new Promise((r) => setTimeout(r, 280 + Math.random() * 200));
      setParseSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'complete' as const } : s));
    }

    const result = parseContractText(text, fileName || undefined);
    setParsedResult(result);

    const kpis = generateKPIsFromContract(result, activeTenant.id, `contract-new-${Date.now()}`);
    setGeneratedKpis(kpis);

    const config = generatePipelineConfig(
      activeTenant.id,
      `contract-new-${Date.now()}`,
      kpis.map((k) => k.id)
    );
    setPipelineConfig(config);

    await new Promise((r) => setTimeout(r, 400));
    setPhase('review');
  }, [text, fileName, activeTenant.id]);

  const handleActivate = useCallback(() => {
    if (!parsedResult) return;
    addContract(parsedResult, activeTenant.id);
    setPhase('success');
  }, [parsedResult, addContract, activeTenant.id]);

  const handleReset = useCallback(() => {
    setPhase('input');
    setText('');
    setFileName('');
    setParsedResult(null);
    setGeneratedKpis([]);
    setPipelineConfig(null);
    setParseSteps([]);
    setErrorMsg('');
  }, []);

  const loadSample = useCallback(() => {
    setText(sampleContractText);
    setFileName('master_services_agreement.txt');
  }, []);

  // -- INPUT PHASE --
  if (phase === 'input') {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 items-center justify-center mb-2">
            <UploadCloud className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Ingest a New Contract</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload or paste a contract document. The AI parser will extract key clauses and auto-generate KPI pipelines for <span className="font-medium text-brand-600 dark:text-brand-400">{activeTenant.name}</span>.
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`card p-8 border-2 border-dashed transition-all duration-200 ${dragActive ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' : 'border-slate-300 dark:border-slate-700'}`}
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileUp className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag & drop a contract file here</p>
              <p className="text-xs text-slate-400 mt-0.5">Supports .txt, .md — or paste text below</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs"
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.text"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </div>

        {fileName && (
          <div className="card p-3 flex items-center gap-3 animate-slide-in">
            <FileText className="w-5 h-5 text-brand-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{fileName}</p>
              <p className="text-xs text-slate-400">{text.length.toLocaleString()} characters loaded</p>
            </div>
            <button
              onClick={() => { setFileName(''); setText(''); }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ClipboardPaste className="w-3.5 h-3.5" /> Or paste contract text
            </label>
            <button onClick={loadSample} className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Load sample contract
            </button>
          </div>
          <textarea
            ref={pasteRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full text of a contract here (MSA, SOW, NDA, Vendor Agreement, etc.)..."
            className="input font-mono text-xs resize-y"
            rows={8}
          />
        </div>

        {errorMsg && (
          <div className="card p-3 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40">
            <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleParse}
            disabled={!text.trim()}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4" /> Parse & Analyze Contract
          </button>
        </div>
      </div>
    );
  }

  // -- PARSING PHASE --
  if (phase === 'parsing') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 items-center justify-center mb-2 animate-pulse-soft">
            <Loader2 className="w-7 h-7 text-brand-600 dark:text-brand-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Parsing Contract</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered clause extraction in progress...</p>
        </div>

        <div className="card p-5 space-y-2">
          {parseSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                {step.status === 'complete' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : step.status === 'running' ? (
                  <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                )}
              </div>
              <span className={`text-sm transition-colors ${
                step.status === 'complete' ? 'text-slate-500 dark:text-slate-400' :
                step.status === 'running' ? 'text-slate-900 dark:text-slate-100 font-medium' :
                'text-slate-300 dark:text-slate-600'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -- REVIEW PHASE --
  if (phase === 'review' && parsedResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Parsed Contract Review</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review extracted data and generated KPI pipeline before activation.</p>
          </div>
          <button onClick={handleReset} className="btn-ghost text-xs">
            <X className="w-4 h-4" /> Start Over
          </button>
        </div>

        {/* Contract Overview */}
        <div className="card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{parsedResult.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{parsedResult.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Type</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{parsedResult.type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Counterparty</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{parsedResult.counterparty}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Effective Date</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(parsedResult.effectiveDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Renewal Date</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(parsedResult.renewalDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Contract Value</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatCurrencyFull(parsedResult.contractValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Risk Level</p>
              <span className={`badge ${riskLevelBg(parsedResult.riskLevel)}`}>{riskLevelLabel(parsedResult.riskLevel)}</span>
            </div>
          </div>
        </div>

        {/* Extracted Clauses */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Extracted Clauses ({parsedResult.clauses.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {parsedResult.clauses.map((clause) => (
              <div key={clause.id} className="card p-3 card-hover">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{clause.label}</p>
                  <span className="text-[10px] text-slate-400">{(clause.confidence * 100).toFixed(0)}% confidence</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{clause.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Generated KPI Pipeline */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Auto-Generated KPI Pipeline ({generatedKpis.length} KPIs)
            </h3>
          </div>
          {generatedKpis.length > 0 ? (
            <div className="space-y-2">
              {generatedKpis.map((kpi) => {
                const color = getCategoryColor(kpi.category);
                return (
                  <div key={kpi.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{kpi.name}</p>
                      <p className="text-xs text-slate-400 truncate">{kpi.source}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500 dark:text-slate-300">Target: {kpi.target}{kpi.unit}</p>
                      <p className="text-[10px] text-slate-400">{getCategoryLabel(kpi.category)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">No KPIs could be auto-generated from this contract.</p>
          )}

          {pipelineConfig && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-400 mb-2">Pipeline Configuration</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Auto-Renewal Tracking', enabled: pipelineConfig.autoRenewalTracking },
                  { label: 'SLA Monitoring', enabled: pipelineConfig.slaMonitoring },
                  { label: 'Financial Exposure', enabled: pipelineConfig.financialExposureTracking },
                  { label: 'Compliance Audit', enabled: pipelineConfig.complianceAudit },
                  { label: 'Alerting', enabled: pipelineConfig.alertingEnabled },
                ].map((opt) => (
                  <span
                    key={opt.label}
                    className={`badge ${opt.enabled ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                  >
                    {opt.enabled ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activate */}
        <div className="flex justify-end gap-3">
          <button onClick={handleReset} className="btn-secondary">Cancel</button>
          <button onClick={handleActivate} className="btn-primary">
            <CheckCircle2 className="w-4 h-4" /> Activate Pipeline for {activeTenant.name}
          </button>
        </div>
      </div>
    );
  }

  // -- SUCCESS PHASE --
  if (phase === 'success') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-5 py-8">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center mb-2 animate-slide-up">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Pipeline Activated</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The contract has been parsed, KPIs generated, and the pipeline is now active for {activeTenant.name}.
          Visit the dashboard to see the new KPIs in action.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={handleReset} className="btn-secondary">
            <UploadCloud className="w-4 h-4" /> Ingest Another
          </button>
          <button onClick={() => onNavigate('dashboard')} className="btn-primary">
            View Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
