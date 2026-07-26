import { useEffect, useState } from 'react';
import {
  Activity, BarChart3, BrainCircuit, ChevronDown, ChevronUp, Fingerprint, MapPin, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  usePredictHotspot, usePredictOffenderRisk,
  useDetectAnomalies, useForecastCrimeCategory,
} from '@workspace/api-client-react';
import type { Prediction } from '@workspace/api-client-react';
import { Card, PageHead, QueryState } from '@/components/shared';

/* ─── Animated confidence bar ───────────────────────────────────── */
function ConfidenceBar({ score }: { score: number }) {
  const [width, setWidth] = useState(0);
  const pct = Math.round(score * 100);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  const color = pct >= 85 ? '#5bbda0' : pct >= 65 ? '#f59e0b' : '#f43f5e';
  const label = pct >= 85 ? 'High confidence' : pct >= 65 ? 'Moderate confidence' : 'Low confidence';

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="font-display text-3xl font-bold" style={{ color }}>{pct}<span className="text-lg">%</span></span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ─── Expandable reasoning ──────────────────────────────────────── */
function ExpandSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#172735] transition"
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/* ─── Prediction card ───────────────────────────────────────────── */
function PredictionCard({
  title, icon: Icon, result, loading, error, onRetry,
}: {
  title: string; icon: LucideIcon; result?: Prediction;
  loading: boolean; error: unknown; onRetry: () => void;
}) {
  const pct = result ? Math.round(result.confidenceScore * 100) : 0;
  const severity = pct >= 85 ? 'high' : pct >= 65 ? 'medium' : 'low';
  const severityBadge = {
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-50 text-slate-600 border-slate-200',
  }[severity];

  return (
    <Card
      title={title}
      meta={result?.predictionType ?? 'Explainable model output'}
      action={
        result ? (
          <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase font-bold ${severityBadge}`}>
            {severity}
          </span>
        ) : <Icon size={18} className="text-emerald-600" />
      }
    >
      <QueryState loading={loading} error={error} onRetry={onRetry}>
        {result && (
          <div>
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon size={20} />
              </div>
              <p className="font-display text-[17px] font-bold leading-snug tracking-[-.02em] text-[#172735]">
                {result.prediction}
              </p>
            </div>

            <div className="mt-5">
              <ConfidenceBar score={result.confidenceScore} />
            </div>

            <ExpandSection title="Reasoning trace" defaultOpen>
              <div className="space-y-2">
                {result.reasoning.map((reason, i) => (
                  <div key={i} className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {reason}
                  </div>
                ))}
              </div>
            </ExpandSection>

            <ExpandSection title="Supporting records">
              <div className="flex flex-wrap gap-2">
                {result.supportingRecords.map((record) => (
                  <span key={record} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] text-emerald-800">
                    {record}
                  </span>
                ))}
              </div>
              {result.generatedAt && (
                <div className="mt-3 font-mono text-[9px] text-slate-400">
                  Generated {new Date(result.generatedAt).toLocaleString('en-IN')}
                </div>
              )}
            </ExpandSection>
          </div>
        )}
      </QueryState>
    </Card>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function Predictions() {
  const hotspot = usePredictHotspot();
  const risk = usePredictOffenderRisk();
  const anomaly = useDetectAnomalies();
  const forecast = useForecastCrimeCategory();

  const handleRefreshAll = () => {
    void hotspot.refetch();
    void risk.refetch();
    void anomaly.refetch();
    void forecast.refetch();
  };

  return (
    <>
      <PageHead
        eyebrow="Explainable intelligence"
        title="Prediction desk"
        detail="Model outputs are surfaced with their reasoning trail, confidence score and supporting operational records."
        action={
          <button
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
          >
            <BrainCircuit size={14} /> Refresh models
          </button>
        }
      />

      {/* Model overview banner */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-5 py-3.5">
        <Sparkles size={16} className="text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-800">
          All predictions include a <strong>confidence score</strong>, <strong>reasoning trace</strong> and <strong>supporting field records</strong>.
          Expand each card to review the evidence trail before acting.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <PredictionCard title="Emerging hotspot" icon={MapPin} result={hotspot.data} loading={hotspot.isLoading} error={hotspot.error} onRetry={() => hotspot.refetch()} />
        <PredictionCard title="Repeat-offender risk" icon={Fingerprint} result={risk.data} loading={risk.isLoading} error={risk.error} onRetry={() => risk.refetch()} />
        <PredictionCard title="Anomaly watch" icon={Activity} result={anomaly.data} loading={anomaly.isLoading} error={anomaly.error} onRetry={() => anomaly.refetch()} />
        <PredictionCard title="Category forecast" icon={BarChart3} result={forecast.data} loading={forecast.isLoading} error={forecast.error} onRetry={() => forecast.refetch()} />
      </div>
    </>
  );
}
