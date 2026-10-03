import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';

export function TenantSwitcher() {
  const { tenants, activeTenant, setActiveTenantId } = useAppData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Switch tenant"
        aria-expanded={open}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: activeTenant.logoColor }}
        >
          {activeTenant.name.charAt(0)}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            {activeTenant.name}
          </span>
          <span className="text-xs text-slate-400 leading-tight">{activeTenant.industry}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 card shadow-lg z-50 animate-slide-in overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800">
            Select Tenant
          </div>
          <div className="py-1 max-h-72 overflow-y-auto scrollbar-thin">
            {tenants.map((t) => {
              const active = t.id === activeTenant.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTenantId(t.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                    active ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: t.logoColor }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{t.name}</div>
                    <div className="text-xs text-slate-400 truncate">{t.industry} · {t.contractCount} contracts</div>
                  </div>
                  {active && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
