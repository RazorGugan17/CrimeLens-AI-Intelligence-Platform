import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts';
import { Link } from 'wouter';
import {
  useGetCrimeTrends, useGetCategoryDistribution,
  useGetRepeatOffenderRanking, useGetInvestigationProgress,
} from '@workspace/api-client-react';
import { Card, PageHead, QueryState, CHART, DONUT_COLORS } from '@/components/shared';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="mt-1 font-display text-xl font-bold text-[#172735]">{p.value}</div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const trends = useGetCrimeTrends();
  const cats = useGetCategoryDistribution();
  const offenders = useGetRepeatOffenderRanking();
  const progress = useGetInvestigationProgress();

  return (
    <>
      <PageHead
        eyebrow="Evidence patterns"
        title="Analytics desk"
        detail="Trace the movement of crime by time, category and geography. Every view is sourced from the operational feed."
      />

      {/* Row 1: Monthly trend (area) + Category mix (bar) */}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <Card title="Crime by month" meta="Longitudinal view · all districts">
          <QueryState loading={trends.isLoading} error={trends.error} empty={!trends.data?.byMonth.length}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trends.data?.byMonth ?? []} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke={CHART.primary} strokeWidth={2.5} fill="url(#monthGrad)" dot={false} activeDot={{ r: 5, fill: CHART.primary, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            {trends.data && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {trends.data.byMonth.slice(-4).map((x) => (
                  <div className="rounded-lg bg-slate-50 p-3" key={x.month}>
                    <div className="font-mono text-[9px] uppercase text-slate-400">{x.month}</div>
                    <div className="mt-1 font-display text-xl font-bold text-[#172735]">{x.total}</div>
                  </div>
                ))}
              </div>
            )}
          </QueryState>
        </Card>

        <Card title="Category mix" meta="Share of registered incidents">
          <QueryState loading={cats.isLoading} error={cats.error} empty={!cats.data?.length}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cats.data ?? []} layout="vertical" margin={{ top: 0, right: 20, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {(cats.data ?? []).map((_, i) => (
                    <Cell key={i} fill={[CHART.primary, CHART.amber, CHART.sky, CHART.secondary, CHART.rose][i % 5]} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#94a3b8' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </QueryState>
        </Card>
      </div>

      {/* Row 2: District comparison (horizontal bar) + Investigation status (donut) */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card title="District comparison" meta="Relative crime concentration across Karnataka">
          <QueryState loading={trends.isLoading} error={trends.error} empty={!trends.data?.byDistrict.length}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends.data?.byDistrict ?? []} layout="vertical" margin={{ top: 0, right: 36, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={CHART.secondary} radius={[0, 6, 6, 0]} maxBarSize={18}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#94a3b8' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </QueryState>
        </Card>

        <Card title="Investigation status" meta="Case lifecycle distribution">
          <QueryState loading={progress.isLoading} error={progress.error} empty={!progress.data?.length}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={progress.data ?? []}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  strokeWidth={0}
                  cx="50%"
                  cy="50%"
                >
                  {(progress.data ?? []).map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(val) => (
                    <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: '#64748b', textTransform: 'uppercase' }}>{val}</span>
                  )}
                  iconSize={8}
                />
                <Tooltip {...CHART.tooltip} />
              </PieChart>
            </ResponsiveContainer>

            {/* Summary bars */}
            <div className="mt-2 space-y-3">
              {(progress.data ?? []).map((item, i) => (
                <div key={item.label} data-testid={`progress-${item.label}`}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-semibold">{item.label}</span>
                    <span className="font-mono text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, item.count)}%`, backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </QueryState>
        </Card>
      </div>

      {/* Row 3: Repeat offender ranking */}
      <div className="mt-5">
        <Card title="Repeat offender ranking" meta="Risk-weighted operational record review">
          <QueryState loading={offenders.isLoading} error={offenders.error} empty={!offenders.data?.length}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {offenders.data?.slice(0, 6).map((person, i) => (
                <Link
                  href="/network"
                  key={person.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  data-testid={`offender-ranking-${person.id}`}
                >
                  <span className="font-mono text-[10px] text-slate-400">0{i + 1}</span>
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#dce9ea] font-display text-xs font-bold text-[#31566a]">
                    {person.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{person.name}</div>
                    <div className="text-[10px] text-slate-400">{person.incidents} incidents · {person.status}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-display text-sm font-bold ${person.riskScore > 70 ? 'text-rose-600' : 'text-amber-600'}`}>{person.riskScore}</div>
                    <div className="font-mono text-[8px] uppercase text-slate-400">risk</div>
                  </div>
                </Link>
              ))}
            </div>
          </QueryState>
        </Card>
      </div>
    </>
  );
}
