import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown, ChevronUp, Send, Sparkles, Bot, User,
} from 'lucide-react';
import { useAskCrimeLens } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { PageHead } from '@/components/shared';

/* ─── Types ─────────────────────────────────────────────────────── */
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  reasoning?: string[];
  records?: string[];
  timestamp: Date;
};

/* ─── Suggested questions ───────────────────────────────────────── */
const SUGGESTED = [
  'What are the trending crime types this month?',
  'Which districts need immediate patrol reinforcement?',
  'Who are the highest-risk repeat offenders?',
  'Are there any anomalies in the current crime patterns?',
  'What is the forecast for robbery incidents next month?',
  'Which police stations are handling the most cases?',
];

/* ─── Typing indicator ──────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <Bot size={16} />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Expandable evidence section ───────────────────────────────── */
function Evidence({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition"
      >
        {title}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

/* ─── Message bubble ─────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const pct = msg.confidence != null ? Math.round(msg.confidence * 100) : null;
  const confColor = pct == null ? '' : pct >= 85 ? 'text-emerald-600' : pct >= 65 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isUser ? 'bg-[#172735] text-white' : 'bg-emerald-100 text-emerald-700'}`}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? 'rounded-br-sm bg-[#172735] text-white'
            : 'rounded-bl-sm bg-white border border-slate-200 text-[#1f2d3d]'
        }`}>
          <p>{msg.content}</p>

          {/* AI metadata */}
          {!isUser && pct != null && (
            <div className={`mt-3 flex items-center gap-1.5 font-mono text-[10px] font-bold ${confColor}`}>
              <Sparkles size={11} />
              {pct}% confidence · {pct >= 85 ? 'High' : pct >= 65 ? 'Moderate' : 'Low'} certainty
            </div>
          )}

          {!isUser && msg.reasoning?.length ? (
            <Evidence title={`Reasoning · ${msg.reasoning.length} steps`}>
              <div className="space-y-1.5">
                {msg.reasoning.map((r, i) => (
                  <div key={i} className="flex gap-2 text-xs leading-5 text-slate-500">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />{r}
                  </div>
                ))}
              </div>
            </Evidence>
          ) : null}

          {!isUser && msg.records?.length ? (
            <Evidence title={`Supporting records · ${msg.records.length}`}>
              <div className="flex flex-wrap gap-1.5">
                {msg.records.map((r) => (
                  <span key={r} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] text-emerald-800">{r}</span>
                ))}
              </div>
            </Evidence>
          ) : null}
        </div>

        <span className="px-1 font-mono text-[9px] text-slate-400">
          {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I\'m CrimeLens AI, your operational intelligence assistant. I can analyse crime patterns, identify risk indicators, and answer questions about the Karnataka operational data. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chat = useAskCrimeLens();

  /* Auto-scroll */
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chat.isPending]);

  const handleSend = (question: string) => {
    const q = question.trim();
    if (!q || chat.isPending) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    chat.mutate(
      { data: { question: q } },
      {
        onSuccess: (res) => {
          const aiMsg: Message = {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: res.answer,
            confidence: res.confidenceScore,
            reasoning: res.reasoning,
            records: res.supportingRecords,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        },
        onError: () => {
          toast.error('CrimeLens could not process that question. Try rephrasing.');
          const errMsg: Message = {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: 'I encountered an issue processing that request. Please try rephrasing your question or ask about a specific district, crime type, or offender.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errMsg]);
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const clearHistory = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Conversation cleared. How can I assist you with the latest operational data?',
      timestamp: new Date(),
    }]);
    toast.success('Conversation cleared');
  };

  return (
    <>
      <PageHead
        eyebrow="AI operations desk"
        title="CrimeLens Assistant"
        detail="Ask operational questions and receive evidence-backed answers with reasoning traces and supporting field records."
        action={
          messages.length > 1 && (
            <button
              onClick={clearHistory}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-slate-400"
            >
              Clear history
            </button>
          )
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_.38fr]">
        {/* Chat panel */}
        <div className="flex flex-col rounded-xl border border-slate-200/90 bg-white shadow-[0_3px_20px_rgba(31,45,61,.045)]" style={{ height: 620 }}>
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-[#172735]">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display text-[15px] font-bold">CrimeLens AI</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-600">Operational intelligence · Karnataka</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-slate-400">Live</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-5 px-5 py-5">
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
            {chat.isPending && <TypingIndicator />}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-100 p-4">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crime patterns, hotspots, offenders…"
              className="h-11 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-500 focus:bg-white"
              data-testid="input-crimelens-question"
              disabled={chat.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || chat.isPending}
              className="grid h-11 w-11 place-items-center rounded-xl bg-[#172735] text-white transition hover:bg-[#203c4c] disabled:opacity-40"
              data-testid="button-ask-crimelens"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Suggested questions */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_3px_20px_rgba(31,45,61,.045)]">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-wider text-slate-400">Suggested questions</div>
            <div className="space-y-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={chat.isPending}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-[#f0f5f3] p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-emerald-700">How it works</div>
            <ul className="space-y-2 text-xs leading-6 text-slate-600">
              {[
                'Answers cite confidence scores',
                'Every response includes a reasoning trace',
                'Supporting field records are linked',
                'Data is sourced from the operational feed',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
