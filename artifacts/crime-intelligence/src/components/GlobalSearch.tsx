import { useEffect, useRef, useState } from 'react';
import { Search, X, FileText, Fingerprint, MapPin } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGetCrimeTimeline, useGetRepeatOffenderRanking } from '@workspace/api-client-react';

type Result = {
  id: string;
  label: string;
  sub: string;
  type: 'incident' | 'offender' | 'district';
  href: string;
};

const TYPE_META = {
  incident:  { icon: FileText,     bg: 'bg-amber-50',   text: 'text-amber-700',  tag: 'Incident' },
  offender:  { icon: Fingerprint,  bg: 'bg-rose-50',    text: 'text-rose-700',   tag: 'Offender' },
  district:  { icon: MapPin,       bg: 'bg-sky-50',     text: 'text-sky-700',    tag: 'District' },
};

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const timeline = useGetCrimeTimeline();
  const offenders = useGetRepeatOffenderRanking();

  /* Focus input when opened */
  useEffect(() => {
    if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  /* Keyboard close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results: Result[] = [];

  if (query.length >= 2) {
    const q = query.toLowerCase();

    /* Incidents */
    (timeline.data ?? []).forEach((item) => {
      const match = `${item.firNumber} ${item.crimeType} ${item.district} ${item.summary ?? ''}`.toLowerCase().includes(q);
      if (match) {
        results.push({
          id: `inc-${item.id}`,
          label: item.crimeType,
          sub: `${item.firNumber} · ${item.district}`,
          type: 'incident',
          href: '/incidents',
        });
      }
    });

    /* Offenders */
    (offenders.data ?? []).forEach((p) => {
      if (p.name.toLowerCase().includes(q)) {
        results.push({
          id: `off-${p.id}`,
          label: p.name,
          sub: `Risk ${p.riskScore} · ${p.incidents} incidents`,
          type: 'offender',
          href: '/network',
        });
      }
    });

    /* Distinct districts */
    const districts = new Set(
      (timeline.data ?? []).filter((i) => i.district.toLowerCase().includes(q)).map((i) => i.district)
    );
    districts.forEach((d) => {
      results.push({ id: `dist-${d}`, label: d, sub: 'District · view hotspot data', type: 'district', href: '/' });
    });
  }

  const sliced = results.slice(0, 8);

  const pick = (r: Result) => {
    navigate(r.href);
    onClose();
  };

  /* Arrow key navigation */
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, sliced.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && sliced[cursor]) pick(sliced[cursor]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[620px] mx-4 rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={handleKey}
            placeholder="Search FIR, crime type, district or offender…"
            className="flex-1 bg-transparent text-[15px] text-[#1f2d3d] placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-700">
              <X size={16} />
            </button>
          )}
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:block">Esc</kbd>
        </div>

        {/* Results */}
        {query.length >= 2 && (
          <div className="max-h-[380px] overflow-y-auto py-2">
            {sliced.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">No results for <strong className="text-slate-700">"{query}"</strong></p>
              </div>
            ) : (
              <>
                {sliced.map((r, i) => {
                  const M = TYPE_META[r.type];
                  return (
                    <button
                      key={r.id}
                      onClick={() => pick(r)}
                      onMouseEnter={() => setCursor(i)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${cursor === i ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${M.bg}`}>
                        <M.icon size={15} className={M.text} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[#1f2d3d]">{r.label}</div>
                        <div className="truncate font-mono text-[10px] text-slate-400">{r.sub}</div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase font-bold ${M.bg} ${M.text}`}>
                        {M.tag}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Hint */}
        {query.length < 2 && (
          <div className="flex items-center justify-between px-5 py-4 text-xs text-slate-400">
            <span>Type to search across incidents, offenders, and districts</span>
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
              navigate
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
              select
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
