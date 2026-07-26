import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  BarChart3, Bell, BrainCircuit, ChevronRight, Crosshair, FileText,
  LayoutDashboard, LogOut, Menu, MessageSquare, Network, Search, ShieldCheck, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';

import { GlobalSearch } from '@/components/GlobalSearch';
import Overview from '@/pages/Overview';
import Analytics from '@/pages/Analytics';
import NetworkPage from '@/pages/NetworkPage';
import Predictions from '@/pages/Predictions';
import Incidents from '@/pages/Incidents';
import Assistant from '@/pages/Assistant';
import NotFound from '@/pages/not-found';

/* ─── QueryClient ───────────────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

/* ─── Nav ───────────────────────────────────────────────────────── */
const nav = [
  { href: '/',            label: 'Command overview',     icon: LayoutDashboard },
  { href: '/analytics',   label: 'Analytics',            icon: BarChart3 },
  { href: '/network',     label: 'Network intelligence', icon: Network },
  { href: '/predictions', label: 'Explainable AI',       icon: BrainCircuit },
  { href: '/incidents',   label: 'Incident records',     icon: FileText },
  { href: '/assistant',   label: 'AI Assistant',         icon: MessageSquare },
];

/* ─── Auth ──────────────────────────────────────────────────────── */
type Session = { username: string; role: string; token: string };

// Use relative /api paths so Vite can proxy local requests during development.
setBaseUrl(null);

setAuthTokenGetter(() => {
  try {
    const s = JSON.parse(localStorage.getItem('crimelens-session') || 'null') as Session | null;
    return s?.token ?? null;
  } catch { return null; }
});

function useSession() {
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(localStorage.getItem('crimelens-session') || 'null'); } catch { return null; }
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password, role }: { username: string; password: string; role: 'Admin' | 'Investigator' | 'Analyst' | 'Supervisor' }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Authentication failed');
      }
      return data as { token: string; user: { username: string; role: string } };
    },
  });

  const signup = useMutation({
    mutationFn: async ({ username, password, role }: { username: string; password: string; role: 'Admin' | 'Investigator' | 'Analyst' | 'Supervisor' }) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Account creation failed');
      }
      return data as { token: string; user: { username: string; role: string } };
    },
  });

  const signIn = (username: string, password: string, role: 'Admin' | 'Investigator' | 'Analyst' | 'Supervisor') => {
    loginMutation.mutate({ username, password, role }, {
      onSuccess: (result) => {
        const nextSession = { ...result.user, token: result.token };
        localStorage.setItem('crimelens-session', JSON.stringify(nextSession));
        setSession(nextSession);
        toast.success(`Welcome, ${result.user.username}`);
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Authentication failed. Please try again.'),
    });
  };

  const signUp = (username: string, password: string, role: 'Admin' | 'Investigator' | 'Analyst' | 'Supervisor') => {
    signup.mutate({ username, password, role }, {
      onSuccess: (result) => {
        const nextSession = { ...result.user, token: result.token };
        localStorage.setItem('crimelens-session', JSON.stringify(nextSession));
        setSession(nextSession);
        toast.success(`Account created for ${result.user.username}`);
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Account creation failed. Please try again.'),
    });
  };

  const signOut = () => {
    localStorage.removeItem('crimelens-session');
    setSession(null);
    toast.success('Signed out successfully');
  };
  return { session, signIn, signUp, signOut, login: loginMutation, signup };
}

/* ─── Brand ─────────────────────────────────────────────────────── */
function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400 text-[#172735]">
        <Crosshair size={21} strokeWidth={2.5} />
      </div>
      <div>
        <div className={`font-display text-lg font-bold tracking-[-.04em] ${light ? 'text-white' : 'text-[#172735]'}`}>
          CrimeLens<span className="text-emerald-500"> AI</span>
        </div>
        <div className={`font-mono text-[8px] uppercase tracking-[.22em] ${light ? 'text-slate-400' : 'text-slate-500'}`}>
          Evidence in every signal
        </div>
      </div>
    </div>
  );
}

/* ─── Login ─────────────────────────────────────────────────────── */
function Login({ onSignIn, onSignUp, pending, signupPending, error, signupError }: {
  onSignIn: (u: string, p: string, r: 'Admin' | 'Investigator' | 'Analyst' | 'Supervisor') => void;
  onSignUp: (u: string, p: string, r: 'Admin' | 'Investigator' | 'Analyst' | 'Supervisor') => void;
  pending: boolean; signupPending: boolean; error: unknown; signupError: unknown;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Investigator' | 'Analyst' | 'Supervisor' | 'Admin'>('Investigator');

  return (
    <div className="min-h-[100dvh] bg-[#e8eef3] text-[#1f2d3d] grid lg:grid-cols-[1.02fr_.98fr]">
      {/* Left panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-[#172735] p-14 text-white flex-col justify-between">
        <div className="absolute -right-20 -top-20 h-[470px] w-[470px] rounded-full border border-emerald-400/20" />
        <div className="absolute right-12 top-28 h-[250px] w-[250px] rounded-full border border-emerald-400/10" />
        <div className="relative">
          <Brand light />
          <div className="mt-28 max-w-[510px]">
            <div className="font-mono text-[11px] uppercase tracking-[.24em] text-emerald-300">Karnataka state police · intelligence layer</div>
            <h1 className="mt-6 font-display text-6xl leading-[.97] tracking-[-.05em]">From signal<br /><span className="text-emerald-300">to action.</span></h1>
            <p className="mt-8 max-w-[390px] text-[15px] leading-7 text-slate-300">A focused command centre for investigators who need every insight to stand on evidence.</p>
          </div>
        </div>
        <div className="relative flex items-center gap-3 text-xs text-slate-400">
          <ShieldCheck size={17} className="text-emerald-300" /> Secure operational environment <span className="ml-auto font-mono">v0.9.0</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 lg:hidden"><Brand /></div>
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[.22em] text-slate-500">Restricted access</div>
            <h2 className="mt-3 font-display text-4xl tracking-[-.04em]">
              {mode === 'login' ? 'Sign in to CrimeLens' : 'Create your CrimeLens account'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {mode === 'login'
                ? 'Use your assigned prototype identity to enter the intelligence workspace.'
                : 'Create a new operational account and choose your role to join the intelligence workspace.'}
            </p>
          </div>

          <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => {
              setMode('login');
              setConfirmPassword('');
            }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-[#172735] text-white shadow-sm' : 'text-slate-600'}`}>Sign in</button>
            <button type="button" onClick={() => {
              setMode('signup');
              setConfirmPassword('');
            }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-[#172735] text-white shadow-sm' : 'text-slate-600'}`}>Create account</button>
          </div>

          {(() => {
            const isLogin = mode === 'login';
            const loginPending = typeof pending === 'boolean' ? pending : false;
            const signUpPendingFlag = typeof signupPending === 'boolean' ? signupPending : false;
            const hasUsername = username.trim().length > 0;
            const hasPassword = password.trim().length > 0;
            const hasConfirm = confirmPassword.trim().length > 0;
            const passwordsMatch = password === confirmPassword;
            const canSubmit = isLogin
              ? hasUsername && hasPassword
              : hasUsername && hasPassword && hasConfirm && passwordsMatch;
            const isSubmitDisabled = !canSubmit || (isLogin ? loginPending : signUpPendingFlag);
            const showPasswordMismatch = mode === 'signup' && hasConfirm && hasPassword && !passwordsMatch;
            const showConfirmRequired = mode === 'signup' && hasPassword && !hasConfirm;

            return (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (isLogin) {
                  if (hasUsername && hasPassword) onSignIn(username.trim(), password.trim(), role);
                } else if (hasUsername && hasPassword && hasConfirm && passwordsMatch) {
                  onSignUp(username.trim(), password.trim(), role);
                }
              }} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Officer username</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
                    autoComplete="username"
                    placeholder="Enter your username"
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
                    data-testid="input-username"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
                    data-testid="input-password"
                  />
                </label>

                {mode === 'signup' && (
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Confirm password</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
                      data-testid="input-confirm-password"
                    />
                    {(showPasswordMismatch || showConfirmRequired) && (
                      <p className="mt-2 text-sm text-rose-600">
                        {showPasswordMismatch ? 'Passwords must match to create an account.' : 'Please confirm your password before continuing.'}
                      </p>
                    )}
                  </label>
                )}

                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Operational role</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Investigator', 'Analyst', 'Supervisor', 'Admin'] as const).map((item) => (
                      <button type="button" key={item} onClick={() => setRole(item)}
                        className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold transition ${role === item ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`}
                        data-testid={`button-role-${item.toLowerCase()}`}>
                        <span className={`mr-2 inline-block h-2 w-2 rounded-full ${role === item ? 'bg-emerald-500' : 'bg-slate-300'}`} />{item}
                      </button>
                    ))}
                  </div>
                </div>

                {!!(isLogin ? error : signupError) && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" data-testid="login-error">{isLogin ? 'Sign in was not accepted. Check the identity and try again.' : 'Account creation was not accepted. Choose another username or password.'}</div>}

                <button type="submit" disabled={isSubmitDisabled}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#172735] hover:bg-[#203c4c] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50`}
                  data-testid="button-sign-in">
                  {isLogin ? (loginPending ? 'Verifying identity…' : 'Enter command centre') : (signUpPendingFlag ? 'Creating account…' : 'Create account')} <ChevronRight size={17} />
                </button>
              </form>
            );
          })()}

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[.17em] text-slate-400">All activity is logged for evidentiary integrity</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Shell ─────────────────────────────────────────────────────── */
function Shell({ children, session, onSignOut }: { children: ReactNode; session: Session; onSignOut: () => void }) {
  const [location] = useLocation();
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  /* Cmd/Ctrl+K global search shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#e8eef3] text-[#1f2d3d]">
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#172735] text-slate-300 transition-transform lg:translate-x-0 ${mobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[74px] items-center border-b border-white/10 px-7">
          <Brand light />
          <button className="ml-auto lg:hidden" onClick={() => setMobile(false)} data-testid="button-close-menu"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-6">
          <div className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.22em] text-slate-500">Workspace</div>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href} onClick={() => setMobile(false)}
              className={`group mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${location === href ? 'bg-emerald-400 text-[#172735]' : 'hover:bg-white/7 hover:text-white'}`}
              data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {location === href && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="mb-4 rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400 font-display font-bold text-[#172735]">
                {session.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white" data-testid="text-session-username">{session.username}</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-300">{session.role}</div>
              </div>
            </div>
          </div>
          <button onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
            data-testid="button-sign-out">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {mobile && <button className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={() => setMobile(false)} aria-label="Close navigation" data-testid="button-overlay" />}

      {/* Main */}
      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center gap-3 border-b border-slate-200/80 bg-[#e8eef3]/90 px-5 backdrop-blur-md sm:px-8">
          <button className="lg:hidden" onClick={() => setMobile(true)} data-testid="button-open-menu"><Menu size={21} /></button>

          {/* Global search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-400 hover:text-slate-700 sm:w-56"
            data-testid="button-global-search"
          >
            <Search size={14} />
            <span className="hidden sm:block">Search…</span>
            <kbd className="ml-auto hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] sm:block">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live operational feed · Karnataka region
            </div>
            <button className="relative rounded-md p-2 text-slate-500 transition hover:bg-white hover:text-slate-800" data-testid="button-notifications">
              <Bell size={18} />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>
            <div className="hidden h-5 w-px bg-slate-300 sm:block" />
            <span className="font-mono text-[10px] text-slate-500">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

/* ─── Routes ────────────────────────────────────────────────────── */
function AppRoutes({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  return (
    <Shell session={session} onSignOut={onSignOut}>
      <Switch>
        <Route path="/"            component={Overview} />
        <Route path="/analytics"   component={Analytics} />
        <Route path="/network"     component={NetworkPage} />
        <Route path="/predictions" component={Predictions} />
        <Route path="/incidents"   component={Incidents} />
        <Route path="/assistant"   component={Assistant} />
        <Route                     component={NotFound} />
      </Switch>
    </Shell>
  );
}

function AppWithProviders() {
  const auth = useSession();
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      {auth.session
        ? <AppRoutes session={auth.session} onSignOut={auth.signOut} />
        : <Login onSignIn={auth.signIn} onSignUp={auth.signUp} pending={auth.login.isPending} signupPending={auth.signup.isPending} error={auth.login.error} signupError={auth.signup.error} />
      }
    </WouterRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithProviders />
    </QueryClientProvider>
  );
}
