import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  Activity, AlertCircle, ArrowUpRight, BarChart3, Bell, BrainCircuit,
  ChevronRight, Crosshair, FileText, Fingerprint, LayoutDashboard, LogOut, MapPin,
  Menu, Network, RefreshCw, Search, Send, ShieldCheck, Sparkles, UserRound, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useAskCrimeLens, useDetectAnomalies, useForecastCrimeCategory, useGetCategoryDistribution,
  useGetCrimeTimeline, useGetCrimeTrends, useGetDashboard, useGetHotspots,
  useGetInvestigationProgress, useGetOffender, useGetOffenderNetwork,
  useGetRepeatOffenderRanking, useLogin, usePredictHotspot, usePredictOffenderRisk,
  setAuthTokenGetter
} from '@workspace/api-client-react';
import type { CrimeEvent, MonthlyTrend, Prediction } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const nav = [
  { href: '/', label: 'Command overview', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/network', label: 'Network intelligence', icon: Network },
  { href: '/predictions', label: 'Explainable AI', icon: BrainCircuit },
  { href: '/incidents', label: 'Incident records', icon: FileText },
];

type Session = { username: string; role: string; token: string };

setAuthTokenGetter(() => {
  try {
    const stored = JSON.parse(localStorage.getItem('crimelens-session') || 'null') as Session | null;
    return stored?.token ?? null;
  } catch {
    return null;
  }
});

function useSession() {
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(localStorage.getItem('crimelens-session') || 'null'); } catch { return null; }
  });
  const login = useLogin();
  const signIn = (username: string, role: 'Admin' | 'Investigator' | 'Analyst' | 'Supervisor') => {
    login.mutate({ data: { username, role } }, {
      onSuccess: (result) => {
        const nextSession = { ...result.user, token: result.token };
        localStorage.setItem('crimelens-session', JSON.stringify(nextSession));
        setSession(nextSession);
      },
    });
  };
  const signOut = () => { localStorage.removeItem('crimelens-session'); setSession(null); };
  return { session, signIn, signOut, login };
}

function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-3 animate-pulse" data-testid="loading-state">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-4 rounded bg-slate-200/70" style={{ width: `${72 - i * 9}%` }} />)}
  </div>;
}

function QueryState({ loading, error, empty, children, onRetry }: { loading: boolean; error: unknown; empty?: boolean; children: ReactNode; onRetry?: () => void }) {
  if (loading) return <LoadingBlock />;
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800" data-testid="error-state"><div className="flex items-center gap-2 font-semibold"><AlertCircle size={17} /> Intelligence feed unavailable</div><p className="mt-1 text-sm opacity-80">The latest signal could not be retrieved.</p>{onRetry && <button onClick={onRetry} className="mt-3 inline-flex items-center gap-2 text-sm font-bold underline" data-testid="button-retry"><RefreshCw size={14} /> Retry feed</button>}</div>;
  if (empty) return <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-500" data-testid="empty-state">No records available for this view.</div>;
  return <>{children}</>;
}

function Login({ onSignIn, pending, error }: { onSignIn: (username: string, role: 'Admin' | 'Investigator' | 'Analyst' | 'Supervisor') => void; pending: boolean; error: unknown }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'Investigator' | 'Analyst' | 'Supervisor' | 'Admin'>('Investigator');
  return <div className="min-h-[100dvh] bg-[#e8eef3] text-[#1f2d3d] grid lg:grid-cols-[1.02fr_.98fr]">
    <div className="hidden lg:flex relative overflow-hidden bg-[#172735] p-14 text-white flex-col justify-between">
      <div className="absolute -right-20 -top-20 h-[470px] w-[470px] rounded-full border border-emerald-400/20" /><div className="absolute right-12 top-28 h-[250px] w-[250px] rounded-full border border-emerald-400/10" />
      <div className="relative"><Brand light /><div className="mt-28 max-w-[510px]"><div className="font-mono text-[11px] uppercase tracking-[.24em] text-emerald-300">Karnataka state police · intelligence layer</div><h1 className="mt-6 font-display text-6xl leading-[.97] tracking-[-.05em]">From signal<br /><span className="text-emerald-300">to action.</span></h1><p className="mt-8 max-w-[390px] text-[15px] leading-7 text-slate-300">A focused command centre for investigators who need every insight to stand on evidence.</p></div></div>
      <div className="relative flex items-center gap-3 text-xs text-slate-400"><ShieldCheck size={17} className="text-emerald-300" /> Secure operational environment <span className="ml-auto font-mono">v0.8.4</span></div>
    </div>
    <div className="flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-[420px]"><div className="mb-10 lg:hidden"><Brand /></div><div className="mb-8"><div className="font-mono text-[10px] uppercase tracking-[.22em] text-slate-500">Restricted access</div><h2 className="mt-3 font-display text-4xl tracking-[-.04em]">Sign in to CrimeLens</h2><p className="mt-3 text-sm leading-6 text-slate-500">Use your assigned prototype identity to enter the intelligence workspace.</p></div>
        <form onSubmit={(e) => { e.preventDefault(); if (username.trim()) onSignIn(username.trim(), role); }} className="space-y-5">
          <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Officer identity</span><div className="relative"><UserRound size={16} className="absolute left-3 top-3.5 text-slate-400" /><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your name" className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15" data-testid="input-username" /></div></label>
          <div><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Operational role</span><div className="grid grid-cols-2 gap-2">{(['Investigator', 'Analyst', 'Supervisor', 'Admin'] as const).map((item) => <button type="button" key={item} onClick={() => setRole(item)} className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold transition ${role === item ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`} data-testid={`button-role-${item.toLowerCase()}`}><span className={`mr-2 inline-block h-2 w-2 rounded-full ${role === item ? 'bg-emerald-500' : 'bg-slate-300'}`} />{item}</button>)}</div></div>
          {!!error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" data-testid="login-error">Sign in was not accepted. Check the identity and try again.</div>}
          <button disabled={!username.trim() || pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#172735] font-bold text-white transition hover:bg-[#203c4c] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-sign-in">{pending ? 'Verifying identity…' : 'Enter command centre'} <ChevronRight size={17} /></button>
        </form>
        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[.17em] text-slate-400">All activity is logged for evidentiary integrity</p>
      </div>
    </div>
  </div>;
}

function Brand({ light = false }: { light?: boolean }) {
  return <div className="flex items-center gap-3" data-testid="brand"><div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400 text-[#172735]"><Crosshair size={21} strokeWidth={2.5} /></div><div><div className={`font-display text-lg font-bold tracking-[-.04em] ${light ? 'text-white' : 'text-[#172735]'}`}>CrimeLens<span className="text-emerald-500"> AI</span></div><div className={`font-mono text-[8px] uppercase tracking-[.22em] ${light ? 'text-slate-400' : 'text-slate-500'}`}>Evidence in every signal</div></div></div>;
}

function Shell({ children, session, onSignOut }: { children: ReactNode; session: Session; onSignOut: () => void }) {
  const [location] = useLocation(); const [mobile, setMobile] = useState(false);
  return <div className="min-h-[100dvh] bg-[#e8eef3] text-[#1f2d3d]">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#172735] text-slate-300 transition-transform lg:translate-x-0 ${mobile ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[92px] items-center border-b border-white/10 px-7"><Brand light /><button className="ml-auto lg:hidden" onClick={() => setMobile(false)} data-testid="button-close-menu"><X size={18} /></button></div>
      <div className="px-4 pt-8"><div className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.22em] text-slate-500">Workspace</div>{nav.map(({ href, label, icon: Icon }) => <Link href={href} key={href} onClick={() => setMobile(false)} className={`group mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-semibold transition ${location === href ? 'bg-emerald-400 text-[#172735]' : 'hover:bg-white/7 hover:text-white'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{location === href && <ChevronRight size={14} className="ml-auto" />}</Link>)}</div>
      <div className="mt-auto border-t border-white/10 p-5"><div className="mb-4 rounded-lg bg-white/5 p-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400 font-display font-bold text-[#172735]">{session.username.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-bold text-white" data-testid="text-session-username">{session.username}</div><div className="font-mono text-[9px] uppercase tracking-wider text-emerald-300">{session.role}</div></div></div></div><button onClick={onSignOut} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white" data-testid="button-sign-out"><LogOut size={15} /> Sign out</button></div>
    </aside>
    {mobile && <button className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={() => setMobile(false)} aria-label="Close navigation" data-testid="button-overlay" />}
    <div className="lg:pl-[260px]"><header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-slate-200/80 bg-[#e8eef3]/90 px-5 backdrop-blur-md sm:px-8"><button className="lg:hidden" onClick={() => setMobile(true)} data-testid="button-open-menu"><Menu size={21} /></button><div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Live operational feed <span className="mx-1 text-slate-300">/</span> Karnataka region</div><div className="ml-auto flex items-center gap-4"><button className="relative rounded-md p-2 text-slate-500 transition hover:bg-white hover:text-slate-800" data-testid="button-notifications"><Bell size={18} /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" /></button><div className="hidden h-5 w-px bg-slate-300 sm:block" /><span className="font-mono text-[10px] text-slate-500">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div></header><main className="mx-auto max-w-[1500px] p-5 sm:p-8">{children}</main></div>
  </div>;
}

function PageHead({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{eyebrow}</div><h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172735] sm:text-[40px]">{title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">{detail}</p></div>{action}</div>;
}

function Card({ children, className = '', title, meta, action }: { children: ReactNode; className?: string; title?: string; meta?: string; action?: ReactNode }) {
  return <section className={`rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_3px_18px_rgba(31,45,61,.035)] ${className}`}><>{title && <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-[15px] font-bold tracking-[-.02em]">{title}</h2>{meta && <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-400">{meta}</div>}</div>{action}</div>}{children}</></section>;
}

function Stat({ label, value, change, icon: Icon, accent = 'emerald' }: { label: string; value: number | string; change?: string; icon: typeof Activity; accent?: string }) {
  return <Card className="relative overflow-hidden"><div className={`absolute right-0 top-0 h-20 w-20 translate-x-7 -translate-y-7 rounded-full ${accent === 'amber' ? 'bg-amber-100' : accent === 'red' ? 'bg-rose-100' : 'bg-emerald-100'}`} /><div className="relative flex items-start justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-slate-500">{label}</div><div className="mt-3 font-display text-3xl font-bold tracking-[-.06em]" data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</div>{change && <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><ArrowUpRight size={13} />{change}</div>}</div><div className={`grid h-9 w-9 place-items-center rounded-lg ${accent === 'amber' ? 'bg-amber-100 text-amber-700' : accent === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}><Icon size={17} /></div></div></Card>;
}

function Sparkline({ trend }: { trend: MonthlyTrend[] }) {
  const max = Math.max(...trend.map((t) => t.total), 1);
  return <div className="flex h-[145px] items-end gap-1.5 pt-4">{trend.map((item, i) => <div className="group flex h-full flex-1 flex-col justify-end gap-2" key={`${item.month}-${i}`}><div className="relative min-h-[4px] rounded-t bg-[#5bbda0] transition-all duration-500 group-hover:bg-[#172735]" style={{ height: `${Math.max(5, (item.total / max) * 100)}%` }} title={`${item.month}: ${item.total}`} data-testid={`bar-trend-${i}`} /><span className="truncate text-center font-mono text-[8px] text-slate-400">{item.month.slice(0, 3)}</span></div>)}</div>;
}

function IncidentRow({ item }: { item: CrimeEvent }) {
  return <div className="group grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[1.2fr_1fr_.8fr_auto] sm:items-center" data-testid={`row-incident-${item.id}`}><div><div className="flex items-center gap-2 text-sm font-bold"><span className={`h-1.5 w-1.5 rounded-full ${item.severity?.toLowerCase() === 'high' ? 'bg-rose-500' : 'bg-amber-400'}`} />{item.crimeType}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{item.firNumber}</div></div><div className="hidden text-xs text-slate-500 sm:block">{item.district}<div className="mt-1 text-[10px] text-slate-400">{item.policeStation}</div></div><div className="hidden text-xs text-slate-500 sm:block">{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div><span className={`justify-self-end rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-wider ${item.status.toLowerCase().includes('open') ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.status}</span></div>;
}

function Overview() {
  const q = useGetDashboard(); const h = useGetHotspots(); const progress = useGetInvestigationProgress();
  const dashboard = q.data; const maxHot = Math.max(...(h.data || []).map((x) => x.crimeCount), 1);
  return <><PageHead eyebrow="Command overview" title="Good morning, officer." detail="A live read on incidents, investigations and emerging risk across Karnataka." action={<button onClick={() => q.refetch()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700" data-testid="button-refresh-overview"><RefreshCw size={14} /> Refresh signals</button>} />
    <QueryState loading={q.isLoading} error={q.error} onRetry={() => q.refetch()}>{dashboard && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total crimes · 30 days" value={dashboard.totalCrimes.toLocaleString('en-IN')} change="6.8% vs prior period" icon={Activity} /><Stat label="Active investigations" value={dashboard.activeInvestigations} change="4 need review" icon={FileText} accent="amber" /><Stat label="Repeat offenders" value={dashboard.repeatOffenders} change="3 newly flagged" icon={Fingerprint} accent="red" /><Stat label="Hotspot districts" value={dashboard.hotspotDistricts} change="Based on 14-day scan" icon={MapPin} /></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.85fr]"><Card title="Incident velocity" meta="Monthly volume · all categories" action={<span className="rounded bg-emerald-50 px-2 py-1 font-mono text-[9px] uppercase text-emerald-700">Live</span>}><div className="flex items-end justify-between"><div><span className="font-display text-3xl font-bold">{dashboard.trend.at(-1)?.total ?? '—'}</span><span className="ml-2 text-xs text-slate-400">latest period</span></div><div className="flex items-center gap-1 text-xs font-bold text-emerald-700"><ArrowUpRight size={14} /> trend signal</div></div><Sparkline trend={dashboard.trend} /></Card>
        <Card title="Investigation board" meta="Current case distribution"><QueryState loading={progress.isLoading} error={progress.error} empty={!progress.data?.length}>{progress.data?.map((item) => <div className="mb-4 last:mb-0" key={item.label} data-testid={`progress-${item.label}`}><div className="mb-2 flex justify-between text-xs"><span className="font-semibold">{item.label}</span><span className="font-mono text-slate-500">{item.count}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, item.count)}%`, background: item.color }} /></div></div>)}</QueryState></Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><Card title="Priority hotspots" meta="Districts requiring attention"><QueryState loading={h.isLoading} error={h.error} empty={!h.data?.length}>{h.data?.slice(0, 5).map((item) => <div key={item.district} className="mb-4 flex items-center gap-3 last:mb-0" data-testid={`hotspot-${item.district}`}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600"><MapPin size={16} /></div><div className="min-w-0 flex-1"><div className="flex justify-between text-xs font-bold"><span>{item.district}</span><span className="font-mono text-slate-500">{item.crimeCount}</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-rose-400" style={{ width: `${(item.crimeCount / maxHot) * 100}%` }} /></div></div><span className="font-mono text-[9px] text-rose-600">{item.intensity.toFixed(1)}×</span></div>)}</QueryState></Card>
        <Card title="Recent incident activity" meta="Most recent entries from field units" action={<Link href="/incidents" className="text-xs font-bold text-emerald-700 hover:underline" data-testid="link-view-all-incidents">View all <ChevronRight size={13} className="inline" /></Link>}><QueryState loading={q.isLoading} error={q.error} empty={!dashboard.recentIncidents?.length}>{dashboard.recentIncidents?.slice(0, 5).map((item) => <IncidentRow item={item} key={item.id} />)}</QueryState></Card></div>
    </>}</QueryState></>;
}

function Analytics() {
  const trends = useGetCrimeTrends(); const cats = useGetCategoryDistribution(); const offenders = useGetRepeatOffenderRanking();
  const maxCat = Math.max(...(cats.data || []).map((x) => x.count), 1); const maxDist = Math.max(...(trends.data?.byDistrict || []).map((x) => x.count), 1);
  return <><PageHead eyebrow="Evidence patterns" title="Analytics desk" detail="Trace the movement of crime by time, category and geography. Every view is sourced from the operational feed." /><div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><Card title="Crime by month" meta="Longitudinal view · all districts"><QueryState loading={trends.isLoading} error={trends.error} empty={!trends.data?.byMonth.length}>{trends.data && <><Sparkline trend={trends.data.byMonth} /><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{trends.data.byMonth.slice(-4).map((x) => <div className="rounded-lg bg-slate-50 p-3" key={x.month}><div className="font-mono text-[9px] uppercase text-slate-400">{x.month}</div><div className="mt-1 font-display text-xl font-bold">{x.total}</div></div>)}</div></>}</QueryState></Card><Card title="Category mix" meta="Share of registered incidents"><QueryState loading={cats.isLoading} error={cats.error} empty={!cats.data?.length}>{cats.data?.map((item, i) => <div className="mb-4 flex items-center gap-3 last:mb-0" key={item.label} data-testid={`category-${i}`}><span className="w-24 truncate text-xs font-semibold">{item.label}</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className={`h-full rounded-full ${i % 3 === 0 ? 'bg-emerald-500' : i % 3 === 1 ? 'bg-amber-400' : 'bg-sky-500'}`} style={{ width: `${item.count / maxCat * 100}%` }} /></div><span className="w-8 text-right font-mono text-[10px] text-slate-500">{item.count}</span></div>)}</QueryState></Card></div><div className="mt-5 grid gap-5 xl:grid-cols-2"><Card title="District comparison" meta="Relative crime concentration"><QueryState loading={trends.isLoading} error={trends.error} empty={!trends.data?.byDistrict.length}>{trends.data?.byDistrict.map((item, i) => <div className="mb-3 flex items-center gap-3 last:mb-0" key={item.label}><span className="w-28 truncate text-xs font-semibold">{item.label}</span><div className="h-7 flex-1 overflow-hidden rounded bg-slate-100"><div className="flex h-full items-center rounded bg-[#31566a] px-2 font-mono text-[10px] text-white" style={{ width: `${item.count / maxDist * 100}%` }}>{item.count}</div></div><span className="font-mono text-[10px] text-slate-400">#{i + 1}</span></div>)}</QueryState></Card><Card title="Repeat offender ranking" meta="Risk-weighted record review"><QueryState loading={offenders.isLoading} error={offenders.error} empty={!offenders.data?.length}>{offenders.data?.slice(0, 6).map((person, i) => <Link href="/network" className="mb-3 flex items-center gap-3 rounded-lg border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50 last:mb-0" key={person.id} data-testid={`offender-ranking-${person.id}`}><span className="font-mono text-[10px] text-slate-400">0{i + 1}</span><div className="grid h-8 w-8 place-items-center rounded-full bg-[#dce9ea] font-display text-xs font-bold text-[#31566a]">{person.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{person.name}</div><div className="text-[10px] text-slate-400">{person.incidents} linked incidents · {person.status}</div></div><div className="text-right"><div className={`font-display text-sm font-bold ${person.riskScore > 70 ? 'text-rose-600' : 'text-amber-600'}`}>{person.riskScore}</div><div className="font-mono text-[8px] uppercase text-slate-400">risk</div></div></Link>)}</QueryState></Card></div></>;
}

function NetworkPage() {
  const ranking = useGetRepeatOffenderRanking(); const [selected, setSelected] = useState<number>(1); const network = useGetOffenderNetwork(selected); const profile = useGetOffender(selected);
  const nodes = network.data?.nodes || []; const edges = network.data?.edges || [];
  return <><PageHead eyebrow="Relationship intelligence" title="Network explorer" detail="Follow the links between people, places and incidents. Select a subject to inspect their connected record." /><div className="grid gap-5 xl:grid-cols-[.75fr_1.5fr]"><Card title="Subjects of interest" meta="Ranked by repeat-offender risk"><QueryState loading={ranking.isLoading} error={ranking.error} empty={!ranking.data?.length}>{ranking.data?.map((person) => <button onClick={() => setSelected(person.id)} className={`mb-2 flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${selected === person.id ? 'bg-[#172735] text-white' : 'hover:bg-slate-50'}`} key={person.id} data-testid={`button-select-offender-${person.id}`}><div className={`grid h-8 w-8 place-items-center rounded-full font-display text-xs font-bold ${selected === person.id ? 'bg-emerald-400 text-[#172735]' : 'bg-slate-200 text-slate-600'}`}>{person.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{person.name}</div><div className={`text-[10px] ${selected === person.id ? 'text-slate-400' : 'text-slate-500'}`}>{person.incidents} incidents · {person.status}</div></div><span className={`font-mono text-xs font-bold ${person.riskScore > 70 ? 'text-rose-400' : 'text-amber-400'}`}>{person.riskScore}</span></button>)}</QueryState></Card>
    <Card title="Connected record" meta={`Subject ID ${selected}`}><QueryState loading={network.isLoading || profile.isLoading} error={network.error || profile.error}><div className="grid gap-5 md:grid-cols-[1fr_1fr]"><div className="relative min-h-[320px] overflow-hidden rounded-lg bg-[#172735] p-5"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#5bbda0 1px, transparent 1px), linear-gradient(90deg,#5bbda0 1px,transparent 1px)', backgroundSize: '36px 36px' }} /><div className="relative flex h-full min-h-[280px] items-center justify-center"><div className="absolute left-[12%] top-[18%] rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 py-2 text-[10px] text-emerald-200">incident cluster</div><div className="absolute right-[10%] top-[32%] rounded-lg border border-sky-400/35 bg-sky-400/10 px-3 py-2 text-[10px] text-sky-200">associate</div><div className="absolute bottom-[16%] left-[22%] rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-[10px] text-amber-200">location</div><svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 280"><path d="M250 135 L95 85 M250 135 L400 120 M250 145 L145 230" fill="none" stroke="#5bbda0" strokeDasharray="4 5" strokeOpacity=".55" /><circle cx="250" cy="140" r="25" fill="#5bbda0" fillOpacity=".18" stroke="#5bbda0" /><text x="250" y="144" textAnchor="middle" fill="#baf1de" fontSize="10">subject</text></svg><div className="absolute bottom-3 right-3 font-mono text-[9px] text-slate-500">{nodes.length} nodes · {edges.length} links</div></div></div><div><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#dce9ea] font-display text-lg font-bold text-[#31566a]">{profile.data?.name.slice(0, 2).toUpperCase()}</div><div><h3 className="font-display text-xl font-bold">{profile.data?.name}</h3><span className="font-mono text-[10px] uppercase tracking-wider text-rose-600">Risk score {profile.data?.riskScore}</span></div></div><dl className="mt-6 grid grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-400">Age / gender</dt><dd className="mt-1 font-bold">{profile.data?.age} · {profile.data?.gender}</dd></div><div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-400">Prior history</dt><dd className="mt-1 font-bold">{profile.data?.criminalHistory} records</dd></div></dl><div className="mt-4 border-t border-slate-100 pt-4"><div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">Known modus operandi</div><p className="mt-2 text-sm leading-6 text-slate-600">{profile.data?.modusOperandi || 'No description on file.'}</p></div></div></div></QueryState></Card></div></>;
}

function PredictionCard({ title, icon: Icon, result, loading, error, onRetry }: { title: string; icon: LucideIcon; result?: Prediction; loading: boolean; error: unknown; onRetry: () => void }) {
  return <Card title={title} meta={result?.predictionType || 'Explainable model output'} action={<Icon size={18} className="text-emerald-600" />}><QueryState loading={loading} error={error} onRetry={onRetry}>{result && <div><div className="flex items-end justify-between gap-4"><p className="font-display text-xl font-bold tracking-[-.03em]">{result.prediction}</p><div className="shrink-0 text-right"><div className="font-display text-3xl font-bold text-emerald-600">{Math.round(result.confidenceScore * 100)}<span className="text-lg">%</span></div><div className="font-mono text-[9px] uppercase text-slate-400">confidence</div></div></div><div className="mt-6"><div className="mb-3 font-mono text-[9px] uppercase tracking-wider text-slate-400">Reasoning trace</div>{result.reasoning.map((reason, i) => <div className="mb-2 flex gap-3 text-sm leading-6 text-slate-600" key={i}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{reason}</div>)}</div><div className="mt-5 rounded-lg bg-[#f0f5f3] p-3"><div className="font-mono text-[9px] uppercase tracking-wider text-emerald-700">Supporting records</div><div className="mt-2 flex flex-wrap gap-2">{result.supportingRecords.map((record) => <span className="rounded border border-emerald-200 bg-white px-2 py-1 font-mono text-[10px] text-slate-600" key={record}>{record}</span>)}</div></div></div>}</QueryState></Card>;
}

function Predictions() {
  const hotspot = usePredictHotspot(); const risk = usePredictOffenderRisk(); const anomaly = useDetectAnomalies(); const forecast = useForecastCrimeCategory(); const chat = useAskCrimeLens(); const [question, setQuestion] = useState('');
  return <><PageHead eyebrow="Explainable intelligence" title="Prediction desk" detail="Model outputs are surfaced with their reasoning trail, confidence and supporting operational records." /><div className="grid gap-5 xl:grid-cols-2"><PredictionCard title="Emerging hotspot" icon={MapPin} result={hotspot.data} loading={hotspot.isLoading} error={hotspot.error} onRetry={() => hotspot.refetch()} /><PredictionCard title="Repeat-offender risk" icon={Fingerprint} result={risk.data} loading={risk.isLoading} error={risk.error} onRetry={() => risk.refetch()} /><PredictionCard title="Anomaly watch" icon={Activity} result={anomaly.data} loading={anomaly.isLoading} error={anomaly.error} onRetry={() => anomaly.refetch()} /><PredictionCard title="Category forecast" icon={BarChart3} result={forecast.data} loading={forecast.isLoading} error={forecast.error} onRetry={() => forecast.refetch()} /></div><Card className="mt-5 border-[#31566a]/20 bg-[#f2f6f6]" title="Ask CrimeLens" meta="Operational question interface" action={<Sparkles size={18} className="text-emerald-600" />}><form onSubmit={(e) => { e.preventDefault(); if (question.trim()) chat.mutate({ data: { question: question.trim() } }); }} className="flex flex-col gap-3 sm:flex-row"><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about current patterns…" className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500" data-testid="input-crimelens-question" /><button disabled={!question.trim() || chat.isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#172735] px-5 text-sm font-bold text-white disabled:opacity-50" data-testid="button-ask-crimelens"><Send size={15} /> {chat.isPending ? 'Analysing…' : 'Ask'} </button></form>{chat.data && <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4" data-testid="chat-response"><div className="flex items-center gap-2 text-xs font-bold text-emerald-700"><Sparkles size={14} /> CrimeLens response</div><p className="mt-2 text-sm leading-7 text-slate-700">{chat.data.answer}</p></div>}{chat.error && <div className="mt-4 text-sm text-rose-700">The question could not be processed. Try a narrower query.</div>}</Card></>;
}

function Incidents() {
  const q = useGetCrimeTimeline(); const [search, setSearch] = useState(''); const [filter, setFilter] = useState('All');
  const filtered = useMemo(() => (q.data || []).filter((item) => `${item.firNumber} ${item.crimeType} ${item.district} ${item.summary || ''}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || item.status === filter)), [q.data, search, filter]);
  const statuses = useMemo(() => ['All', ...new Set((q.data || []).map((x) => x.status))], [q.data]);
  return <><PageHead eyebrow="Field records" title="Incident timeline" detail="A chronological evidence register for current and historical crime events." action={<button onClick={() => q.refetch()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold" data-testid="button-refresh-incidents"><RefreshCw size={14} /> Sync records</button>} /><Card><div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search FIR, category, district or description" className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" data-testid="input-search-incidents" /></div><div className="flex gap-2 overflow-auto">{statuses.map((item) => <button onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-lg border px-3 text-xs font-bold transition ${filter === item ? 'border-[#172735] bg-[#172735] text-white' : 'border-slate-200 bg-white text-slate-500'}`} key={item} data-testid={`button-filter-${item}`}>{item}</button>)}</div></div><QueryState loading={q.isLoading} error={q.error} empty={!filtered.length} onRetry={() => q.refetch()}><div className="hidden grid-cols-[1.2fr_1fr_.8fr_.7fr_auto] gap-3 border-b border-slate-200 px-3 pb-3 font-mono text-[9px] uppercase tracking-wider text-slate-400 sm:grid"><span>Incident / FIR</span><span>Location</span><span>Recorded</span><span>Severity</span><span>Status</span></div>{filtered.map((item) => <div className="grid gap-2 border-b border-slate-100 px-3 py-4 last:border-0 sm:grid-cols-[1.2fr_1fr_.8fr_.7fr_auto] sm:items-center" key={item.id} data-testid={`timeline-event-${item.id}`}><div><div className="text-sm font-bold">{item.crimeType}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{item.firNumber}</div><div className="mt-2 text-xs leading-5 text-slate-500 sm:max-w-[360px]">{item.summary || 'No summary attached.'}</div></div><div className="text-xs text-slate-600">{item.district}<div className="mt-1 text-[10px] text-slate-400">{item.policeStation}</div></div><div className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div><div><span className={`rounded-full px-2 py-1 font-mono text-[9px] uppercase ${item.severity?.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{item.severity || 'standard'}</span></div><span className="font-mono text-[9px] uppercase text-emerald-700">{item.status}</span></div>)}</QueryState></Card></>;
}

function AppRoutes({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  return <Shell session={session} onSignOut={onSignOut}><Switch><Route path="/" component={Overview} /><Route path="/analytics" component={Analytics} /><Route path="/network" component={NetworkPage} /><Route path="/predictions" component={Predictions} /><Route path="/incidents" component={Incidents} /><Route component={NotFound} /></Switch></Shell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><AppWithProviders /></QueryClientProvider>;
}

function AppWithProviders() {
  const auth = useSession();
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>{auth.session ? <AppRoutes session={auth.session} onSignOut={auth.signOut} /> : <Login onSignIn={auth.signIn} pending={auth.login.isPending} error={auth.login.error} />}</WouterRouter>;
}

export default App;