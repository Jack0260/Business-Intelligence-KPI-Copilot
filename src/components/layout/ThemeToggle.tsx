import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeMode } from '@/types';

const options: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'system', icon: Monitor, label: 'System' },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div
      className="flex items-center gap-0.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {options.map(({ mode: m, icon: Icon, label }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              active
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
