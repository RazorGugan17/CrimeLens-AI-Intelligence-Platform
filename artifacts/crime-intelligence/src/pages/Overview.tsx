import {
  Activity, ArrowUpRight, ArrowDownRight, FileText, Fingerprint, MapPin, RefreshCw, ChevronRight,
} from 'lucide-react';
import { Link } from 'wouter';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  useGetDashboard, useGetHotspots, useGetInvestigationProgress,
} from '@workspace/api-client-react';
import type { CrimeEvent } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Card, PageHead, QueryState, CHART, DONUT_COLORS, useCountUp } from '@/components/shared';

/* ─── Animated KPI stat ─────────────────────────────────────────── */
function Stat({
  label, value, change, up = true, icon: Icon, accent = 'emerald',
}: {
  label: string; value: number; change?: string; up?: boolean;
  icon: typeof Activity; accent?: 'emerald' | 'amber' | 'red';
}) {
  const animated = useCountUp(value);
  const bg = accent === 'amber' ? 'bg-amber-50' : accent === 'red' ? 'bg-rose-50' : 'bg-emerald-50';
  const iconBg = accent === 'amber' ? 'bg-amber-100 text-amber-700' : accent === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700';
  const blob = accent === 'amber' ? 'bg-amber-100' : accent === 'red' ? 'bg-rose-100' : 'bg-emerald-100';
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200/90 ${bg} p-5 shadow-[0_3px_20px_rgba(31,45,61,.04)] transition hover:shadow-md hover:-translate-y-0.5 duration-200`}>
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${blob} opacity-70`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[.14em] text-slate-500">{label}</div>
          <div className="mt-3 font-display text-3xl font-bold tracking-[-.06em] text-[#172735]" data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}>
            {animated.toLocaleString('en-IN')}
          </div>
          {change && (
            <div className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${up ? 'text-emerald-700' : 'text-rose-600'}`}>
              {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{change}
            </div>
          )}
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${iconBg}`}><Icon size={17} /></div>
      </div>
    </div>
  );
}

/* ─── Custom Recharts tooltip ───────────────────────────────────── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-[#172735]">{payload[0].value}</div>
    </div>
  );
}

/* ─── Incident row ──────────────────────────────────────────────── */
function IncidentRow({ item }: { item: CrimeEvent }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[1.2fr_1fr_.8fr_auto] sm:items-center" data-testid={`row-incident-${item.id}`}>
      <div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className={`h-1.5 w-1.5 rounded-full ${item.severity?.toLowerCase() === 'high' ? 'bg-rose-500' : 'bg-amber-400'}`} />
          {item.crimeType}
        </div>
        <div className="mt-1 font-mono text-[10px] text-slate-400">{item.firNumber}</div>
      </div>
      <div className="hidden text-xs text-slate-500 sm:block">{item.district}<div className="mt-0.5 text-[10px] text-slate-400">{item.policeStation}</div></div>
      <div className="hidden text-xs text-slate-500 sm:block">{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
      <span className={`justify-self-end rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-wider ${item.status.toLowerCase().includes('open') ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.status}</span>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function Overview() {
  const q = useGetDashboard();
  const h = useGetHotspots();
  const progress = useGetInvestigationProgress();

  const dashboard = q.data;
  const maxHot = Math.max(...(h.data ?? []).map((x) => x.crimeCount), 1);

  const handleRefresh = () => {
    void q.refetch();
    void h.refetch();
    void progress.refetch();
    toast.success('Signals refreshed');
  };

  return (
    <>
      <PageHead
        eyebrow="Command overview"
        title="Good morning, officer."
        detail="A live read on incidents, investigations and emerging risk across Karnataka."
        action={
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
            data-testid="button-refresh-overview"
          >
            <RefreshCw size={14} /> Refresh signals
          </button>
        }
      />

      <QueryState loading={q.isLoading} error={q.error} onRetry={() => q.refetch()}>
        {dashboard && (
          <>
            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Total crimes · 30 days" value={dashboard.totalCrimes} change="6.8% vs prior period" icon={Activity} />
              <Stat label="Active investigations" value={dashboard.activeInvestigations} change="4 need review" icon={FileText} accent="amber" />
              <Stat label="Repeat offenders" value={dashboard.repeatOffenders} change="3 newly flagged" up={false} icon={Fingerprint} accent="red" />
              <Stat label="Hotspot districts" value={dashboard.hotspotDistricts} change="Based on 14-day scan" icon={MapPin} />
            </div>

            {/* Trend + Investigation board */}
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
              <Card title="Incident velocity" meta="Monthly volume · all categories" action={<span className="rounded bg-emerald-50 px-2 py-1 font-mono text-[9px] uppercase text-emerald-700">Live</span>}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dashboard.trend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" stroke={CHART.primary} strokeWidth={2.5} fill="url(#trendGrad)" dot={false} activeDot={{ r: 5, fill: CHART.primary, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Investigation board" meta="Current case distribution">
                <QueryState loading={progress.isLoading} error={progress.error} empty={!progress.data?.length}>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={progress.data} dataKey="count" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                        {(progress.data ?? []).map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend formatter={(val) => <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: '#64748b', textTransform: 'uppercase' }}>{val}</span>} iconSize={8} />
                      <Tooltip {...CHART.tooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </QueryState>
              </Card>
            </div>

            {/* Hotspots + Recent */}
            <div className="mt-5 grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
              <Card title="Priority hotspots" meta="Districts requiring attention">
                <QueryState loading={h.isLoading} error={h.error} empty={!h.data?.length}>
                  {h.data?.slice(0, 5).map((item) => (
                    <div key={item.district} className="mb-4 flex items-center gap-3 last:mb-0" data-testid={`hotspot-${item.district}`}>
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600"><MapPin size={16} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between text-xs font-bold"><span>{item.district}</span><span className="font-mono text-slate-500">{item.crimeCount}</span></div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-rose-400 transition-all duration-700" style={{ width: `${(item.crimeCount / maxHot) * 100}%` }} />
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-rose-600">{item.intensity.toFixed(1)}×</span>
                    </div>
                  ))}
                </QueryState>
              </Card>

              <Card
                title="Recent incident activity"
                meta="Most recent entries from field units"
                action={<Link href="/incidents" className="text-xs font-bold text-emerald-700 hover:underline" data-testid="link-view-all-incidents">View all <ChevronRight size={13} className="inline" /></Link>}
              >
                <QueryState loading={q.isLoading} error={q.error} empty={!dashboard.recentIncidents?.length}>
                  {dashboard.recentIncidents?.slice(0, 5).map((item) => <IncidentRow item={item} key={item.id} />)}
                </QueryState>
              </Card>
            </div>
          </>
        )}
      </QueryState>
    </>
  );
}
