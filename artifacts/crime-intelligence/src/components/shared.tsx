import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/* ─── Animated counter ─────────────────────────────────────────── */
export function useCountUp(target: number, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

/* ─── Skeleton loading ──────────────────────────────────────────── */
export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" data-testid="loading-state">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded-lg bg-slate-200" style={{ width: `${82 - i * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 140 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="mb-4 flex justify-between">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="h-4 w-16 rounded bg-slate-200" />
      </div>
      <div className="rounded-lg bg-slate-100" style={{ height }} />
    </div>
  );
}

/* ─── QueryState ────────────────────────────────────────────────── */
export function QueryState({
  loading, error, empty, children, onRetry, emptyMessage,
}: {
  loading: boolean; error: unknown; empty?: boolean;
  children: ReactNode; onRetry?: () => void; emptyMessage?: string;
}) {
  if (loading) return <LoadingBlock />;
  if (error) return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800" data-testid="error-state">
      <div className="flex items-center gap-2 font-semibold"><AlertCircle size={17} /> Intelligence feed unavailable</div>
      <p className="mt-1 text-sm opacity-80">The latest signal could not be retrieved.</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 inline-flex items-center gap-2 text-sm font-bold underline" data-testid="button-retry">
          <RefreshCw size={14} /> Retry feed
        </button>
      )}
    </div>
  );
  if (empty) return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center" data-testid="empty-state">
      <p className="text-sm text-slate-500">{emptyMessage ?? 'No records available for this view.'}</p>
    </div>
  );
  return <>{children}</>;
}

/* ─── PageHead ──────────────────────────────────────────────────── */
export function PageHead({ eyebrow, title, detail, action }: {
  eyebrow: string; title: string; detail: string; action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end animate-page-enter">
      <div>
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{eyebrow}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172735] sm:text-[38px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{detail}</p>
      </div>
      {action}
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────── */
export function Card({
  children, className = '', title, meta, action, noPad = false,
}: {
  children: ReactNode; className?: string; title?: string;
  meta?: string; action?: ReactNode; noPad?: boolean;
}) {
  return (
    <section className={`rounded-xl border border-slate-200/90 bg-white shadow-[0_3px_20px_rgba(31,45,61,.045)] ${className}`}>
      {title && (
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-display text-[15px] font-bold tracking-[-.02em] text-[#1f2d3d]">{title}</h2>
            {meta && <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">{meta}</div>}
          </div>
          {action}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

/* ─── Recharts shared theme ─────────────────────────────────────── */
export const CHART = {
  primary: '#5bbda0',
  secondary: '#172735',
  amber: '#f59e0b',
  rose: '#f43f5e',
  sky: '#38bdf8',
  grid: '#f1f5f9',
  muted: '#94a3b8',
  tooltip: {
    contentStyle: {
      borderRadius: 10,
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,.08)',
      fontFamily: 'Manrope, sans-serif',
      fontSize: 12,
    },
    labelStyle: { color: '#64748b', fontFamily: 'DM Mono, monospace', fontSize: 10, textTransform: 'uppercase' as const },
    itemStyle: { color: '#172735', fontWeight: 700, fontSize: 14 },
  },
} as const;

export const DONUT_COLORS = ['#f59e0b', '#5bbda0', '#172735', '#94a3b8', '#38bdf8'];
